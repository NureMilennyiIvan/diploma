use anchor_lang::Accounts;
use anchor_lang::prelude::*;
use crate::state::{LaunchpoolsConfig, LaunchpoolsConfigsManager};

#[derive(Accounts)]
pub struct UpdateLaunchpoolsConfigRewardAuthority<'info> {
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
    /// CHECK: New reward authority can be arbitrary
    pub new_reward_authority: UncheckedAccount<'info>,
}
pub(crate) fn handler(ctx: Context<UpdateLaunchpoolsConfigRewardAuthority>) -> Result<()> {
    ctx.accounts.launchpools_config.update_reward_authority(
        ctx.accounts.new_reward_authority.key()
    );
    msg!("Event: UpdateLaunchpoolsConfigRewardAuthority");
    emit!(
        UpdateLaunchpoolsConfigRewardAuthorityEvent{
            authority: ctx.accounts.authority.key(),
            launchpools_config: ctx.accounts.launchpools_config.key(),
            new_reward_authority: ctx.accounts.launchpools_config.reward_authority().key(),
            timestamp: Clock::get()?.unix_timestamp
        }
    );
    Ok(())
}

#[event]
pub struct UpdateLaunchpoolsConfigRewardAuthorityEvent {
    pub authority: Pubkey,
    pub launchpools_config: Pubkey,
    pub new_reward_authority: Pubkey,
    pub timestamp: i64,
}