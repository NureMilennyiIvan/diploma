use anchor_lang::Accounts;
use anchor_lang::prelude::*;
use utilities::constants::{ANCHOR_DISCRIMINATOR};
use crate::state::LaunchpoolsConfigsManager;
use crate::program::Launchpool;
#[derive(Accounts)]
pub struct InitializeLaunchpoolsConfigsManager<'info>{
    #[account(
        mut,
        constraint = program_data.upgrade_authority_address == Some(signer.key())
    )]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR + LaunchpoolsConfigsManager::INIT_SPACE,
        seeds = [LaunchpoolsConfigsManager::SEED],
        bump
    )]
    pub launchpools_configs_manager: Account<'info, LaunchpoolsConfigsManager>,
    /// CHECK: Authority can be arbitrary
    pub authority: UncheckedAccount<'info>,
    /// CHECK: Signer will be head_authority on initialization
    #[account(constraint = program_data.upgrade_authority_address == Some(head_authority.key()))]
    pub head_authority: UncheckedAccount<'info>,
    pub program_data: Account<'info, ProgramData>,
    #[account(constraint = launchpool_program.programdata_address()? == Some(program_data.key()))]
    pub launchpool_program: Program<'info, Launchpool>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<InitializeLaunchpoolsConfigsManager>) -> Result<()> {
    ctx.accounts.launchpools_configs_manager.initialize(
        ctx.accounts.authority.key(),
        ctx.accounts.head_authority.key(),
        ctx.bumps.launchpools_configs_manager
    );
    let launchpools_configs_manager = &ctx.accounts.launchpools_configs_manager;

    msg!("Event: InitializeLaunchpoolsConfigsManager");
    emit!(
        InitializeLaunchpoolsConfigsManagerEvent{
            signer: ctx.accounts.signer.key(),
            authority: launchpools_configs_manager.authority().key(),
            head_authority: launchpools_configs_manager.head_authority().key(),
            timestamp: Clock::get()?.unix_timestamp

        }
    );
    Ok(())
}

#[event]
pub struct InitializeLaunchpoolsConfigsManagerEvent {
    pub signer: Pubkey,
    pub authority: Pubkey,
    pub head_authority: Pubkey,
    pub timestamp: i64,
}