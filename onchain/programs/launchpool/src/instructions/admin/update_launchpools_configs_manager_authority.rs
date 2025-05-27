use anchor_lang::prelude::*;
use crate::state::LaunchpoolsConfigsManager;

#[derive(Accounts)]
pub struct UpdateLaunchpoolsConfigsManagerAuthority<'info> {
    #[account(
        mut,
        constraint = (authority.key() == launchpools_configs_manager.authority().key() || authority.key() == launchpools_configs_manager.head_authority().key())
    )]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [LaunchpoolsConfigsManager::SEED],
        bump = launchpools_configs_manager.bump()
    )]
    pub launchpools_configs_manager: Account<'info, LaunchpoolsConfigsManager>,
    /// CHECK: New authority can be arbitrary
    pub new_authority: UncheckedAccount<'info>,
}
pub(crate) fn handler(ctx: Context<UpdateLaunchpoolsConfigsManagerAuthority>) -> Result<()> {
    ctx.accounts.launchpools_configs_manager.update_authority(
        ctx.accounts.new_authority.key()
    );
    msg!("Event: UpdateLaunchpoolsConfigsManagerAuthority");
    emit!(
        UpdateLaunchpoolsConfigsManagerAuthorityEvent{
            authority: ctx.accounts.authority.key(),
            new_authority:  ctx.accounts.launchpools_configs_manager.authority().key(),
            timestamp: Clock::get()?.unix_timestamp
        }
    );
    Ok(())
}

#[event]
pub struct UpdateLaunchpoolsConfigsManagerAuthorityEvent {
    pub authority: Pubkey,
    pub new_authority: Pubkey,
    pub timestamp: i64,
}