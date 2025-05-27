use anchor_lang::Accounts;
use anchor_lang::prelude::*;
use crate::state::{LaunchpoolsConfig, LaunchpoolsConfigsManager};

#[derive(Accounts)]
pub struct UpdateLaunchpoolsConfigDuration<'info> {
    #[account(
        mut,
        constraint = (authority.key() == launchpools_configs_manager.authority().key() || authority.key() == launchpools_configs_manager.head_authority().key())
    )]
    pub authority: Signer<'info>,
    #[account(
        seeds = [LaunchpoolsConfigsManager::SEED],
        bump = launchpools_configs_manager.bump()
    )]
    pub launchpools_configs_manager: Account<'info, LaunchpoolsConfigsManager>,
    #[account(
        mut,
        seeds = [LaunchpoolsConfig::SEED, launchpools_config.id.to_le_bytes().as_ref()],
        bump = launchpools_config.bump()
    )]
    pub launchpools_config: Account<'info, LaunchpoolsConfig>,
}

pub(crate) fn handler(ctx: Context<UpdateLaunchpoolsConfigDuration>, new_duration: u64) -> Result<()> {
    ctx.accounts.launchpools_config.update_duration(new_duration)?;
    msg!("Event: UpdateLaunchpoolsConfigDuration");
    emit!(
        UpdateLaunchpoolsConfigDurationEvent{
            authority: ctx.accounts.authority.key(),
            launchpools_config: ctx.accounts.launchpools_config.key(),
            new_duration: ctx.accounts.launchpools_config.duration(),
            timestamp: Clock::get()?.unix_timestamp
        }
    );
    Ok(())
}

#[event]
pub struct UpdateLaunchpoolsConfigDurationEvent {
    pub authority: Pubkey,
    pub launchpools_config: Pubkey,
    pub new_duration: u64,
    pub timestamp: i64,
}