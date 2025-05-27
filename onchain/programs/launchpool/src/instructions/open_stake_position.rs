use anchor_lang::{emit, event, Accounts, Key, ToAccountInfo};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{TokenAccount as InterfaceTokenAccount, TokenInterface, Mint};
use utilities::math::Q64_128;
use utilities::token_instructions::TransferTokensInstruction;
use crate::state::{LaunchpoolsConfig, StakePosition, Launchpool};

#[derive(Accounts)]
pub struct OpenStakePosition<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    // Token program will check mint and authority via token_instructions instruction
    pub signer_stakable_account: Box<InterfaceAccount<'info, InterfaceTokenAccount>>,

    pub stakable_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        constraint = launchpools_config.stakable_mint().key() == stakable_mint.key(),
        seeds = [LaunchpoolsConfig::SEED, launchpools_config.id.to_le_bytes().as_ref()],
        bump = launchpools_config.bump()
    )]
    pub launchpools_config: Box<Account<'info, LaunchpoolsConfig>>,

    #[account(
        mut,
        constraint = launchpools_config.key() == launchpool.launchpools_config().key(),
        seeds = [Launchpool::SEED, launchpool.reward_mint.as_ref()],
        bump = launchpool.bump()
    )]
    pub launchpool: Box<Account<'info, Launchpool>>,

    #[account(
        init,
        payer = signer,
        space = 8 + StakePosition::INIT_SPACE,
        seeds = [StakePosition::SEED, signer.key().as_ref(), launchpool.key().as_ref()],
        bump
    )]
    pub stake_position: Box<Account<'info, StakePosition>>,

    #[account(
        init_if_needed,
        payer = signer,
        token::mint = stakable_mint,
        token::authority = stake_position,
        token::token_program = stakable_token_program,
        seeds = [StakePosition::VAULT_SEED, stake_position.key().as_ref()],
        bump
    )]
    pub stake_vault: Box<InterfaceAccount<'info, InterfaceTokenAccount>>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub stakable_token_program: Interface<'info, TokenInterface>
}

pub(crate) fn handler(ctx: Context<OpenStakePosition>, stake_amount: u64) -> Result<()> {
    msg!("Before 1");
    ctx.accounts.stake_position.initialize(
        &ctx.accounts.signer.to_account_info(),
        &ctx.accounts.launchpool,
        &ctx.accounts.stake_vault.as_ref(),
        ctx.bumps.stake_vault,
        ctx.bumps.stake_position
    )?;
    let now = Clock::get()?.unix_timestamp as u64;
    let launchpool = &mut ctx.accounts.launchpool;
    launchpool.check_active_state(now)?;
    launchpool.accrue_rewards(now)?;
    let launchpool_snapshot = Launchpool::get_snapshot(launchpool);

    let get_stake_transfer_instruction = Box::new(ctx.accounts.get_stake_transfer_instruction(stake_amount)?);
    let stake_amount_after_fee = get_stake_transfer_instruction.get_amount_after_fee();
    msg!("Before 2");
    get_stake_transfer_instruction.execute(None)?;

    let open_position_payload = ctx.accounts.stake_position.open_position(stake_amount_after_fee, launchpool_snapshot)?;

    ctx.accounts.launchpool.process_position_open(open_position_payload)?;

    let launchpool = &ctx.accounts.launchpool;

    msg!("Event: OpenStakePosition");
    emit!(
        OpenStakePositionEvent{
            launchpool: launchpool.key(),
            signer: ctx.accounts.signer.key(),
            stake_position: ctx.accounts.stake_position.key(),
            staked_amount: launchpool.staked_amount(),
            reward_per_token: launchpool.reward_per_token(),
            stake_amount: stake_amount_after_fee,
            stake_timestamp: now
        }
    );
    Ok(())
}
impl<'info> OpenStakePosition<'info> {
    fn get_stake_transfer_instruction(&self, stake_amount: u64) -> Result<TransferTokensInstruction<'_, '_, '_, 'info>> {
        TransferTokensInstruction::try_new(
            stake_amount,
            &self.stakable_mint,
            &self.signer_stakable_account,
            self.signer.to_account_info(),
            &self.stake_vault,
            &self.stakable_token_program
        )
    }
}
#[event]
pub struct OpenStakePositionEvent {
    pub launchpool: Pubkey,
    pub signer: Pubkey,
    pub stake_position: Pubkey,
    pub staked_amount: u64,
    pub reward_per_token: Q64_128,
    pub stake_amount: u64,
    pub stake_timestamp: u64
}