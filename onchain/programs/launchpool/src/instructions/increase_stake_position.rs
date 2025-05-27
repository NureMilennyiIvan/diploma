use anchor_lang::{emit, event, Accounts, Key, ToAccountInfo};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{TokenAccount as InterfaceTokenAccount, TokenInterface, Mint, TokenAccount};
use utilities::math::Q64_128;
use utilities::token_instructions::TransferTokensInstruction;
use crate::state::{LaunchpoolsConfig, StakePosition, Launchpool};

#[derive(Accounts)]
pub struct IncreaseStakePosition<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    // Token program will check mint and authority via token_instructions instruction
    pub signer_stakable_account: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        constraint = launchpools_config.stakable_mint().key() == stakable_mint.key(),
        seeds = [LaunchpoolsConfig::SEED, launchpools_config.id.to_le_bytes().as_ref()],
        bump = launchpools_config.bump()
    )]
    pub launchpools_config: Box<Account<'info, LaunchpoolsConfig>>,

    pub stakable_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        constraint = launchpools_config.key() == launchpool.launchpools_config().key(),
        seeds = [Launchpool::SEED, launchpool.reward_mint.as_ref()],
        bump = launchpool.bump()
    )]
    pub launchpool: Box<Account<'info, Launchpool>>,

    #[account(
        mut,
        constraint = stake_vault.key() == stake_position.stake_vault().key(),
        constraint = signer.key() == stake_position.authority.key(),
        constraint = launchpool.key() == stake_position.launchpool.key(),
        seeds = [StakePosition::SEED, stake_position.authority.as_ref(), stake_position.launchpool.as_ref()],
        bump = stake_position.bump(),
    )]
    pub stake_position: Box<Account<'info, StakePosition>>,

    #[account(
        mut,
        seeds = [StakePosition::VAULT_SEED, stake_position.key().as_ref()],
        bump = stake_position.stake_vault_bump(),
    )]
    pub stake_vault: Box<InterfaceAccount<'info, InterfaceTokenAccount>>,

    pub stakable_token_program: Interface<'info, TokenInterface>,
}

pub(crate) fn handler(ctx: Context<IncreaseStakePosition>, stake_increase_amount: u64) -> Result<()> {
    let now = Clock::get()?.unix_timestamp as u64;
    let launchpool = &mut ctx.accounts.launchpool;

    launchpool.check_active_state(now)?;
    launchpool.accrue_rewards(now)?;

    let launchpool_snapshot = Launchpool::get_snapshot(launchpool);

    let get_increase_stake_transfer_instruction = Box::new(ctx.accounts.get_increase_stake_transfer_instruction(stake_increase_amount)?);
    let stake_increase_amount_after_fee = get_increase_stake_transfer_instruction.get_amount_after_fee();
    get_increase_stake_transfer_instruction.execute(None)?;

    let increase_position_payload = ctx.accounts.stake_position.increase_position(stake_increase_amount_after_fee, launchpool_snapshot)?;
    let (increase_stake_amount, pending) = (increase_position_payload.increase_amount(), increase_position_payload.pending());
    ctx.accounts.launchpool.process_position_increase(increase_position_payload)?;

    let launchpool = &ctx.accounts.launchpool;
    let stake_position = &ctx.accounts.stake_position;

    msg!("Event: IncreaseStakePosition");
    emit!(
        IncreaseStakePositionEvent{
            launchpool: launchpool.key(),
            signer: ctx.accounts.signer.key(),
            stake_position: ctx.accounts.stake_position.key(),
            staked_amount: launchpool.staked_amount(),
            reward_per_token: launchpool.reward_per_token(),
            participants_reward_left_to_distribute: launchpool.participants_reward_left_to_distribute(),
            increase_stake_amount,
            pending,
            stake_amount: stake_position.amount().as_u64(),
            reward_earned: stake_position.reward_earned(),
            reward_debt: stake_position.reward_debt(),
            increase_stake_timestamp: now
        }
    );
    Ok(())
}
impl<'info> IncreaseStakePosition<'info> {
    fn get_increase_stake_transfer_instruction(&self, stake_increase_amount: u64) -> Result<TransferTokensInstruction<'_, '_, '_, 'info>> {
        TransferTokensInstruction::try_new(
            stake_increase_amount,
            &self.stakable_mint,
            &self.signer_stakable_account,
            self.signer.to_account_info(),
            &self.stake_vault,
            &self.stakable_token_program
        )
    }
}
#[event]
pub struct IncreaseStakePositionEvent {
    pub launchpool: Pubkey,
    pub signer: Pubkey,
    pub stake_position: Pubkey,
    pub staked_amount: u64,
    pub reward_per_token: Q64_128,
    pub participants_reward_left_to_distribute: Q64_128,
    pub increase_stake_amount: u64,
    pub pending: Q64_128,
    pub stake_amount: u64,
    pub reward_earned: Q64_128,
    pub reward_debt: Q64_128,
    pub increase_stake_timestamp: u64
}