use anchor_lang::Accounts;
use anchor_lang::prelude::*;
use crate::state::{LaunchpoolsConfig, LaunchpoolsConfigsManager};

#[derive(Accounts)]
pub struct UpdateLaunchpoolsConfigProtocolRewardShare<'info> {
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

pub(crate) fn handler(ctx: Context<UpdateLaunchpoolsConfigProtocolRewardShare>, new_protocol_reward_share_basis_points: u16) -> Result<()> {
    ctx.accounts.launchpools_config.update_protocol_reward_share_basis_points(new_protocol_reward_share_basis_points)?;
    emit!(
        UpdateLaunchpoolsConfigProtocolRewardShareEvent{
            authority: ctx.accounts.authority.key(),
            launchpools_config: ctx.accounts.launchpools_config.key(),
            new_protocol_reward_share_basis_points: ctx.accounts.launchpools_config.protocol_reward_share_basis_points(),
            timestamp: Clock::get()?.unix_timestamp
        }
    );
    Ok(())
}

#[event]
pub struct UpdateLaunchpoolsConfigProtocolRewardShareEvent {
    pub authority: Pubkey,
    pub launchpools_config: Pubkey,
    pub new_protocol_reward_share_basis_points: u16,
    pub timestamp: i64,
}