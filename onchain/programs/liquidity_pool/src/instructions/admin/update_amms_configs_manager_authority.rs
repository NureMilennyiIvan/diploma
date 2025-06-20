use anchor_lang::prelude::*;
use crate::state::AmmsConfigsManager;

#[derive(Accounts)]
pub struct UpdateAmmsConfigsManagerAuthority<'info> {
    #[account(
        mut,
        constraint = (authority.key() == amms_configs_manager.authority().key() || authority.key() == amms_configs_manager.head_authority().key())
    )]
    authority: Signer<'info>,
    #[account(
        mut,
        seeds = [AmmsConfigsManager::SEED],
        bump = amms_configs_manager.bump()
    )]
    amms_configs_manager: Account<'info, AmmsConfigsManager>,
    /// CHECK: New authority can be arbitrary
    new_authority: UncheckedAccount<'info>,
}
pub(crate) fn handler(ctx: Context<UpdateAmmsConfigsManagerAuthority>) -> Result<()> {
    ctx.accounts.amms_configs_manager.update_authority(
        ctx.accounts.new_authority.key()
    );

    msg!("Event: UpdateAmmsConfigsManagerAuthority");
    emit!(
        UpdateAmmsConfigsManagerAuthorityEvent{
            authority: ctx.accounts.authority.key(),
            new_authority:  ctx.accounts.amms_configs_manager.authority().key(),
            timestamp: Clock::get()?.unix_timestamp
        }
    );
    Ok(())
}

#[event]
pub struct UpdateAmmsConfigsManagerAuthorityEvent {
    pub authority: Pubkey,
    pub new_authority: Pubkey,
    pub timestamp: i64,
}