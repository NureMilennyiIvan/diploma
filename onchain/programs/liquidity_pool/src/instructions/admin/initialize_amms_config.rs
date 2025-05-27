use anchor_lang::prelude::*;
use crate::state::{AmmsConfig, AmmsConfigsManager};
use utilities::constants::ANCHOR_DISCRIMINATOR;

#[derive(Accounts)]
pub struct InitializeAmmsConfig<'info> {
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
    #[account(
        init,
        payer = authority,
        space = ANCHOR_DISCRIMINATOR + AmmsConfig::INIT_SPACE,
        seeds = [AmmsConfig::SEED, amms_configs_manager.configs_count().to_le_bytes().as_ref()],
        bump
    )]
    amms_config: Account<'info, AmmsConfig>,
    /// CHECK: Amms config's fee authority can be arbitrary
    fee_authority: UncheckedAccount<'info>,
    rent: Sysvar<'info, Rent>,
    system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<InitializeAmmsConfig>, protocol_fee_rate_basis_points: u16, providers_fee_rate_basis_points: u16) -> Result<()> {
    ctx.accounts.amms_config.initialize(
        ctx.accounts.fee_authority.key(),
        protocol_fee_rate_basis_points,
        providers_fee_rate_basis_points,
        ctx.accounts.amms_configs_manager.configs_count(),
        ctx.bumps.amms_config
    )?;
    ctx.accounts.amms_configs_manager.increment_configs_count();
    let amms_config = &ctx.accounts.amms_config;
    emit!(
        InitializeAmmsConfigEvent{
            authority: ctx.accounts.authority.key(),
            amms_config: amms_config.key(),
            fee_authority: amms_config.fee_authority().key(),
            protocol_fee_rate_basis_points: amms_config.protocol_fee_rate_basis_points(),
            providers_fee_rate_basis_points: amms_config.providers_fee_rate_basis_points(),
            id: amms_config.id,
            timestamp: Clock::get()?.unix_timestamp
        }
    );
    Ok(())
}

#[event]
pub struct InitializeAmmsConfigEvent {
    pub authority: Pubkey,
    pub amms_config: Pubkey,
    pub fee_authority: Pubkey,
    pub protocol_fee_rate_basis_points: u16,
    pub providers_fee_rate_basis_points: u16,
    pub id: u64,
    pub timestamp: i64
}
