use anchor_lang::prelude::*;
use crate::state::AmmsConfigsManager;

#[derive(Accounts)]
pub struct UpdateAmmsConfigsManagerHeadAuthority<'info> {
    #[account(
        mut,
        constraint = head_authority.key() == amms_configs_manager.head_authority().key()
    )]
    head_authority: Signer<'info>,
    #[account(
        mut,
        seeds = [AmmsConfigsManager::SEED],
        bump = amms_configs_manager.bump()
    )]
    amms_configs_manager: Account<'info, AmmsConfigsManager>,
    /// CHECK: New head authority can be arbitrary
    new_head_authority: UncheckedAccount<'info>,
}
pub(crate) fn handler(ctx: Context<UpdateAmmsConfigsManagerHeadAuthority>) -> Result<()> {
    ctx.accounts.amms_configs_manager.update_head_authority(
        ctx.accounts.new_head_authority.key()
    );

    msg!("Event: UpdateAmmsConfigsManagerHeadAuthority");
    emit!(
        UpdateAmmsConfigsManagerHeadAuthorityEvent{
            head_authority: ctx.accounts.head_authority.key(),
            new_head_authority:  ctx.accounts.amms_configs_manager.authority().key(),
            timestamp: Clock::get()?.unix_timestamp
        }
    );
    Ok(())
}

#[event]
pub struct UpdateAmmsConfigsManagerHeadAuthorityEvent {
    pub head_authority: Pubkey,
    pub new_head_authority: Pubkey,
    pub timestamp: i64,
}