use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use utilities::math::Q64_128;
use crate::state::{AmmsConfig, cp_amm::CpAmm};
use utilities::token_instructions::{TransferTokensInstruction};
use crate::state::cp_amm::CpAmmCore;

#[derive(Accounts)]
pub struct SwapInCpAmm<'info>{
    #[account(mut)]
    pub signer: Signer<'info>,
    pub base_mint: Box<InterfaceAccount<'info, Mint>>,
    pub quote_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = base_mint,
        associated_token::authority = signer,
        associated_token::token_program = base_token_program
    )]
    pub signer_base_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = quote_mint,
        associated_token::authority = signer,
        associated_token::token_program = quote_token_program
    )]
    pub signer_quote_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        seeds = [AmmsConfig::SEED, amms_config.id.to_le_bytes().as_ref()],
        bump = amms_config.bump()
    )]
    pub amms_config: Box<Account<'info, AmmsConfig>>,

    #[account(
        mut,
        constraint = cp_amm.is_launched(),
        constraint = amms_config.key() == cp_amm.amms_config().key(),
        constraint = base_mint.key() == cp_amm.base_mint().key(),
        constraint = quote_mint.key() == cp_amm.quote_mint().key(),
        constraint = cp_amm_base_vault.key() == cp_amm.base_vault().key(),
        constraint = cp_amm_quote_vault.key() == cp_amm.quote_vault().key(),
        seeds = [CpAmm::SEED, cp_amm.lp_mint.as_ref()],
        bump = cp_amm.bump()
    )]
    pub cp_amm: Box<Account<'info, CpAmm>>,

    #[account(
        mut,
        seeds = [CpAmm::VAULT_SEED, cp_amm.key().as_ref(), cp_amm.base_mint().as_ref()],
        bump = cp_amm.base_vault_bump()
    )]
    pub cp_amm_base_vault:Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [CpAmm::VAULT_SEED, cp_amm.key().as_ref(), cp_amm.quote_mint().as_ref()],
        bump = cp_amm.quote_vault_bump()
    )]
    pub cp_amm_quote_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub base_token_program: Interface<'info, TokenInterface>,
    pub quote_token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<SwapInCpAmm>, swap_amount: u64, estimated_result: u64, allowed_slippage: u64, is_in_out: bool) -> Result<()> {
    let in_transfer_instruction = Box::new(ctx.accounts.get_in_transfer_instruction(swap_amount, is_in_out)?);

    let swap_amount_after_fee = in_transfer_instruction.get_amount_after_fee();
    let swap_payload = ctx.accounts.cp_amm.get_swap_payload(
        swap_amount_after_fee,
        estimated_result,
        allowed_slippage,
        ctx.accounts.amms_config.providers_fee_rate_basis_points(),
        ctx.accounts.amms_config.protocol_fee_rate_basis_points(),
        is_in_out
    )?;
    let amount_to_withdraw = swap_payload.amount_to_withdraw();

    let out_transfer_instruction = Box::new(ctx.accounts.get_out_transfer_instruction(swap_payload.amount_to_withdraw(), is_in_out)?);
    in_transfer_instruction.execute(None)?;
    let cp_amm_seeds = ctx.accounts.cp_amm.seeds();
    let out_instruction_seeds: &[&[&[u8]]] = &[&cp_amm_seeds];
    out_transfer_instruction.execute(Some(out_instruction_seeds))?;

    ctx.accounts.cp_amm.swap(swap_payload);
    let cp_amm = &ctx.accounts.cp_amm;

    msg!("Event: SwapInCpAmm");
    emit!(
        SwapInCpAmmEvent{
            swapper: ctx.accounts.signer.key(),
            cp_amm: cp_amm.key(),
            is_in_out,
            swapped_amount: swap_amount_after_fee,
            received_amount: amount_to_withdraw,
            estimated_result,
            allowed_slippage,
            base_liquidity: cp_amm.base_liquidity(),
            quote_liquidity: cp_amm.quote_liquidity(),
            protocol_base_fees_to_redeem: cp_amm.protocol_base_fees_to_redeem(),
            protocol_quote_fees_to_redeem: cp_amm.protocol_quote_fees_to_redeem(),
            constant_product_sqrt: cp_amm.constant_product_sqrt(),
            base_quote_ratio_sqrt: cp_amm.base_quote_ratio_sqrt(),
            timestamp: Clock::get()?.unix_timestamp
        }
    );

    Ok(())
}
#[event]
pub struct SwapInCpAmmEvent{
    pub swapper: Pubkey,
    pub cp_amm: Pubkey,
    pub is_in_out: bool,
    pub swapped_amount: u64,
    pub received_amount: u64,
    pub estimated_result: u64,
    pub allowed_slippage: u64,
    pub base_liquidity: u64,
    pub quote_liquidity: u64,
    pub protocol_base_fees_to_redeem: u64,
    pub protocol_quote_fees_to_redeem: u64,
    pub constant_product_sqrt: Q64_128,
    pub base_quote_ratio_sqrt: Q64_128,
    pub timestamp: i64
}
impl<'info> SwapInCpAmm<'info>{
    fn get_in_transfer_instruction(&self, in_amount: u64, is_in_out: bool) -> Result<TransferTokensInstruction<'_, '_, '_, 'info>>{
        if is_in_out{
            TransferTokensInstruction::try_new(
                in_amount,
                &self.base_mint,
                &self.signer_base_account,
                self.signer.to_account_info(),
                &self.cp_amm_base_vault,
                &self.base_token_program
            )
        }
        else{
            TransferTokensInstruction::try_new(
                in_amount,
                &self.quote_mint,
                &self.signer_quote_account,
                self.signer.to_account_info(),
                &self.cp_amm_quote_vault,
                &self.quote_token_program
            )
        }
    }
    fn get_out_transfer_instruction(&self, in_amount: u64, is_in_out: bool) -> Result<TransferTokensInstruction<'_, '_, '_, 'info>>{
        if is_in_out{
            TransferTokensInstruction::try_new(
                in_amount,
                &self.quote_mint,
                &self.cp_amm_quote_vault,
                self.cp_amm.to_account_info(),
                &self.signer_quote_account,
                &self.quote_token_program
            )

        }
        else{
            TransferTokensInstruction::try_new(
                in_amount,
                &self.base_mint,
                &self.cp_amm_base_vault,
                self.cp_amm.to_account_info(),
                &self.signer_base_account,
                &self.base_token_program
            )
        }
    }
}