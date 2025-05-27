use anchor_lang::prelude::*;
use crate::state::LaunchpoolsConfigsManager;

#[derive(Accounts)]
pub struct UpdateLaunchpoolsConfigsManagerHeadAuthority<'info> {
    #[account(
        mut,
        constraint = head_authority.key() == launchpools_configs_manager.head_authority().key()
    )]
    pub head_authority: Signer<'info>,
    #[account(
        mut,
        seeds = [LaunchpoolsConfigsManager::SEED],
        bump = launchpools_configs_manager.bump()
    )]
    pub launchpools_configs_manager: Account<'info, LaunchpoolsConfigsManager>,
    /// CHECK: New authority can be arbitrary
    pub new_head_authority: UncheckedAccount<'info>,
}
pub(crate) fn handler(ctx: Context<UpdateLaunchpoolsConfigsManagerHeadAuthority>) -> Result<()> {
    ctx.accounts.launchpools_configs_manager.update_head_authority(
        ctx.accounts.new_head_authority.key()
    );
    emit!(
        UpdateLaunchpoolsConfigsManagerHeadAuthorityEvent{
            head_authority: ctx.accounts.head_authority.key(),
            new_head_authority: ctx.accounts.launchpools_configs_manager.head_authority().key(),
            timestamp: Clock::get()?.unix_timestamp
        }
    );
    Ok(())
}

#[event]
pub struct UpdateLaunchpoolsConfigsManagerHeadAuthorityEvent {
    pub head_authority: Pubkey,
    pub new_head_authority: Pubkey,
    pub timestamp: i64,
}