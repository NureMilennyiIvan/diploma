use anchor_lang::{emit, event, Accounts, Key, ToAccountInfo};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{TokenAccount as InterfaceTokenAccount, TokenInterface, Mint};
use utilities::math::Q64_128;
use utilities::token_instructions::TransferTokensInstruction;
use crate::state::{LaunchpoolsConfig, StakePosition, Launchpool};

#[derive(Accounts)]
pub struct CloseStakePosition<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        token::mint = reward_mint,
        token::authority = signer,
        token::token_program = reward_token_program
    )]
    pub signer_reward_account: Box<InterfaceAccount<'info, InterfaceTokenAccount>>,

    #[account(
        mut,
        token::mint = stakable_mint,
        token::authority = signer,
        token::token_program = stakable_token_program
    )]
    pub signer_stakable_account: Box<InterfaceAccount<'info, InterfaceTokenAccount>>,

    #[account(
        constraint = launchpools_config.stakable_mint().key() == stakable_mint.key(),
        seeds = [LaunchpoolsConfig::SEED, launchpools_config.id.to_le_bytes().as_ref()],
        bump = launchpools_config.bump()
    )]
    pub launchpools_config: Box<Account<'info, LaunchpoolsConfig>>,

    pub stakable_mint: Box<InterfaceAccount<'info, Mint>>,
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
        close = signer,
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
    pub stake_vault: InterfaceAccount<'info, InterfaceTokenAccount>,

    #[account(
        mut,
        seeds = [Launchpool::VAULT_SEED, launchpool.key().as_ref()],
        bump = launchpool.reward_vault_bump()
    )]
    pub reward_vault: Box<InterfaceAccount<'info, InterfaceTokenAccount>>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub stakable_token_program: Interface<'info, TokenInterface>,
    pub reward_token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>
}

pub(crate) fn handler(ctx: Context<CloseStakePosition>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp as u64;
    let launchpool = &mut ctx.accounts.launchpool;

    launchpool.accrue_rewards(now)?;
    launchpool.check_finished_state(now)?;

    let launchpool_snapshot = Launchpool::get_snapshot(launchpool);
    let close_position_payload = ctx.accounts.stake_position.close_position(launchpool_snapshot)?;
    let (stake_amount, pending, reward_amount) = (close_position_payload.stake_amount(), close_position_payload.pending(), close_position_payload.reward_earned());
    ctx.accounts.launchpool.process_position_close(close_position_payload)?;

    let get_receive_stake_instruction = Box::new(ctx.accounts.get_receive_stake_transfer_instruction(stake_amount)?);
    let get_receive_reward_instruction = Box::new(ctx.accounts.get_receive_reward_transfer_instruction(reward_amount.as_u64())?);
    let stake_amount_after_fee = get_receive_stake_instruction.get_amount_after_fee();
    let reward_amount_after_fee = get_receive_reward_instruction.get_amount_after_fee();

    let stake_position_seeds = ctx.accounts.stake_position.seeds();
    let receive_stake_instruction_seeds: &[&[&[u8]]] = &[&stake_position_seeds];
    get_receive_stake_instruction.execute(Some(receive_stake_instruction_seeds))?;
    let launchpool_seeds = ctx.accounts.launchpool.seeds();
    let receive_reward_instruction_seeds: &[&[&[u8]]] = &[&launchpool_seeds];
    get_receive_reward_instruction.execute(Some(receive_reward_instruction_seeds))?;

    let launchpool = &ctx.accounts.launchpool;
    emit!(
        CloseStakePositionEvent{
            launchpool: launchpool.key(),
            signer: ctx.accounts.signer.key(),
            stake_position: ctx.accounts.stake_position.key(),
            staked_amount: launchpool.staked_amount(),
            reward_per_token: launchpool.reward_per_token(),
            participants_reward_left_to_distribute: launchpool.participants_reward_left_to_distribute(),
            participants_reward_left_to_obtain: launchpool.participants_reward_left_to_obtain(),
            pending,
            stake_received: stake_amount_after_fee,
            reward_received: reward_amount_after_fee,
            close_timestamp: now
        }
    );
    Ok(())
}
impl<'info> CloseStakePosition<'info> {
    fn get_receive_stake_transfer_instruction(&self, stake_amount: u64) -> Result<TransferTokensInstruction<'_, '_, '_, 'info>> {
        TransferTokensInstruction::try_new(
            stake_amount,
            &self.stakable_mint,
            &self.stake_vault,
            self.stake_position.to_account_info(),
            &self.signer_stakable_account,
            &self.stakable_token_program
        )
    }
    fn get_receive_reward_transfer_instruction(&self, reward_amount: u64) -> Result<TransferTokensInstruction<'_, '_, '_, 'info>> {
        TransferTokensInstruction::try_new(
            reward_amount,
            &self.reward_mint,
            &self.reward_vault,
            self.launchpool.to_account_info(),
            &self.signer_reward_account,
            &self.reward_token_program
        )
    }
}
#[event]
pub struct CloseStakePositionEvent {
    pub launchpool: Pubkey,
    pub signer: Pubkey,
    pub stake_position: Pubkey,
    pub staked_amount: u64,
    pub reward_per_token: Q64_128,
    pub participants_reward_left_to_distribute: Q64_128,
    pub participants_reward_left_to_obtain: u64,
    pub pending: Q64_128,
    pub stake_received: u64,
    pub reward_received: u64,
    pub close_timestamp: u64
}