use anchor_lang::Accounts;
use anchor_lang::prelude::*;
use crate::state::{LaunchpoolsConfig, LaunchpoolsConfigsManager};

#[derive(Accounts)]
pub struct UpdateLaunchpoolsConfigPositionSizes<'info> {
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

pub(crate) fn handler(ctx: Context<UpdateLaunchpoolsConfigPositionSizes>, new_min_position_size: u64, new_max_position_size: u64) -> Result<()> {
    ctx.accounts.launchpools_config.update_min_position_size(new_min_position_size)?;
    ctx.accounts.launchpools_config.update_max_position_size(new_max_position_size)?;
    let launchpools_config = &ctx.accounts.launchpools_config;
    msg!("Event: UpdateLaunchpoolsConfigPositionSizes");
    emit!(
        UpdateLaunchpoolsConfigPositionSizesEvent{
            authority: ctx.accounts.authority.key(),
            launchpools_config: launchpools_config.key(),
            new_min_position_size: launchpools_config.min_position_size(),
            new_max_position_size: launchpools_config.max_position_size(),
            timestamp: Clock::get()?.unix_timestamp
        }
    );
    Ok(())
}

#[event]
pub struct UpdateLaunchpoolsConfigPositionSizesEvent {
    pub authority: Pubkey,
    pub launchpools_config: Pubkey,
    pub new_min_position_size: u64,
    pub new_max_position_size: u64,
    pub timestamp: i64,
}