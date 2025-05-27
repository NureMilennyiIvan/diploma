use anchor_lang::{Accounts, Key, ToAccountInfo};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{TokenAccount as InterfaceTokenAccount, TokenInterface, Mint};
use utilities::math::Q64_128;
use utilities::token_instructions::TransferTokensInstruction;
use crate::state::{LaunchpoolsConfig, Launchpool};

#[derive(Accounts)]
pub struct CollectProtocolReward<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: Launchpools config's reward authority can be arbitrary
    pub reward_authority: UncheckedAccount<'info>,

    #[account(
        constraint = launchpools_config.reward_authority().key() == reward_authority.key(),
        seeds = [LaunchpoolsConfig::SEED, launchpools_config.id.to_le_bytes().as_ref()],
        bump = launchpools_config.bump()
    )]
    pub launchpools_config: Box<Account<'info, LaunchpoolsConfig>>,

    pub reward_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        constraint = launchpools_config.key() == launchpool.launchpools_config().key(),
        constraint = reward_mint.key() == launchpool.reward_mint,
        constraint = reward_vault.key() == launchpool.reward_vault().key(),
        seeds = [Launchpool::SEED, launchpool.reward_mint.as_ref()],
        bump = launchpool.bump()
    )]
    pub launchpool: Box<Account<'info, Launchpool>>,

    #[account(
        mut,
        seeds = [Launchpool::VAULT_SEED, launchpool.key().as_ref()],
        bump = launchpool.reward_vault_bump()
    )]
    pub reward_vault: Box<InterfaceAccount<'info, InterfaceTokenAccount>>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = reward_mint,
        associated_token::authority = reward_authority,
        associated_token::token_program = reward_token_program
    )]
    pub reward_authority_account: Box<InterfaceAccount<'info, InterfaceTokenAccount>>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub reward_token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>
}

pub(crate) fn handler(ctx: Context<CollectProtocolReward>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp as u64;
    ctx.accounts.launchpool.accrue_rewards(now)?;
    let collect_protocol_reward_payload = ctx.accounts.launchpool.get_collect_protocol_reward_payload()?;
    let protocol_reward_to_redeem = collect_protocol_reward_payload.protocol_reward_amount();
    ctx.accounts.launchpool.collect_protocol_reward(collect_protocol_reward_payload);

    let get_receive_reward_instruction = Box::new(ctx.accounts.get_receive_reward_transfer_instruction(protocol_reward_to_redeem)?);
    let protocol_reward_to_redeem_after_fee = get_receive_reward_instruction.get_amount_after_fee();
    let launchpool_seeds = ctx.accounts.launchpool.seeds();
    let receive_reward_instruction_seeds: &[&[&[u8]]] = &[&launchpool_seeds];
    get_receive_reward_instruction.execute(Some(receive_reward_instruction_seeds))?;

    emit!(
        CollectProtocolRewardEvent {
            launchpool: ctx.accounts.launchpool.key(),
            signer: ctx.accounts.signer.key(),
            reward_authority: ctx.accounts.reward_authority.key(),
            reward_authority_account: ctx.accounts.reward_authority_account.key(),
            protocol_reward_to_redeem: protocol_reward_to_redeem_after_fee,
            reward_per_token: ctx.accounts.launchpool.reward_per_token(),
            claim_timestamp: now
        }
    );
    Ok(())
}
impl<'info> CollectProtocolReward<'info> {
    fn get_receive_reward_transfer_instruction(&self, reward_amount: u64) -> Result<TransferTokensInstruction<'_, '_, '_, 'info>> {
        TransferTokensInstruction::try_new(
            reward_amount,
            &self.reward_mint,
            &self.reward_vault,
            self.launchpool.to_account_info(),
            &self.reward_authority_account,
            &self.reward_token_program
        )
    }
}
#[event]
pub struct CollectProtocolRewardEvent {
    pub launchpool: Pubkey,
    pub signer: Pubkey,
    pub reward_authority: Pubkey,
    pub reward_authority_account: Pubkey,
    pub protocol_reward_to_redeem: u64,
    pub reward_per_token: Q64_128,
    pub claim_timestamp: u64
}