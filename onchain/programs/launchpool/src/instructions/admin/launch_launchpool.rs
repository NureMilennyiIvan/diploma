use anchor_lang::{emit, event, Accounts, Key};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{TokenAccount as InterfaceTokenAccount, Mint};
use utilities::math::Q64_128;
use crate::state::{Launchpool, LaunchpoolsConfig, LaunchpoolsConfigsManager};

#[derive(Accounts)]
pub struct LaunchLaunchpool<'info> {
    #[account(
        mut,
        constraint = (authority.key() == launchpools_configs_manager.authority().key() || authority.key() == launchpools_configs_manager.head_authority().key())
    )]
    pub authority: Signer<'info>,

    #[account(
        seeds = [LaunchpoolsConfigsManager::SEED],
        bump = launchpools_configs_manager.bump()
    )]
    pub launchpools_configs_manager: Box<Account<'info, LaunchpoolsConfigsManager>>,
    #[account(
        seeds = [LaunchpoolsConfig::SEED, launchpools_config.id.to_le_bytes().as_ref()],
        bump = launchpools_config.bump()
    )]
    pub launchpools_config: Box<Account<'info, LaunchpoolsConfig>>,

    pub reward_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        constraint = reward_mint.key() == launchpool.reward_mint,
        constraint = reward_vault.key() == launchpool.reward_vault().key(),
        constraint = launchpools_config.key() == launchpool.launchpools_config().key(),
        constraint = reward_vault.amount >= launchpool.initial_reward_amount(),
        seeds = [Launchpool::SEED, launchpool.reward_mint.as_ref()],
        bump = launchpool.bump()
    )]
    pub launchpool: Box<Account<'info, Launchpool>>,

    #[account(
        mut,
        seeds = [Launchpool::VAULT_SEED, launchpool.key().as_ref()],
        bump = launchpool.reward_vault_bump()
    )]
    pub reward_vault: Box<InterfaceAccount<'info, InterfaceTokenAccount>>
}

pub(crate) fn handler(ctx: Context<LaunchLaunchpool>, start_timestamp: u64) -> Result<()> {
    let now = Clock::get()?.unix_timestamp as u64;
    let launch_payload = ctx.accounts.launchpool.get_launch_payload(now, start_timestamp, ctx.accounts.launchpools_config.duration())?;
    ctx.accounts.launchpool.launch(launch_payload);
    let launchpool = &ctx.accounts.launchpool;
    msg!("Event: LaunchLaunchpool");
    emit!(
        LaunchLaunchpoolEvent{
            authority: ctx.accounts.authority.key(),
            launchpool: launchpool.key(),
            reward_rate: launchpool.reward_rate(),
            start_timestamp: launchpool.start_timestamp(),
            end_timestamp: launchpool.end_timestamp(),
            last_update_timestamp: launchpool.last_update_timestamp(),
            timestamp: Clock::get()?.unix_timestamp
        }
    );
    Ok(())
}

#[event]
pub struct LaunchLaunchpoolEvent{
    pub authority: Pubkey,
    pub launchpool: Pubkey,
    pub reward_rate: Q64_128,
    pub start_timestamp: u64,
    pub end_timestamp: u64,
    pub last_update_timestamp: u64,
    pub timestamp: i64
}