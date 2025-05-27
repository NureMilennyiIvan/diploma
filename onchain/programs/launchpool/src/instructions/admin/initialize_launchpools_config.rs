use anchor_lang::prelude::*;
use anchor_spl::token_interface;
use crate::state::{LaunchpoolsConfig, LaunchpoolsConfigsManager};
use utilities::constants::ANCHOR_DISCRIMINATOR;
use utilities::helpers::validate_stakable_mint;

#[derive(Accounts)]
pub struct InitializeLaunchpoolsConfig<'info> {
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
    pub launchpools_configs_manager: Box<Account<'info, LaunchpoolsConfigsManager>>,
    #[account(
        init,
        payer = authority,
        space = ANCHOR_DISCRIMINATOR + LaunchpoolsConfig::INIT_SPACE,
        seeds = [LaunchpoolsConfig::SEED, launchpools_configs_manager.configs_count().to_le_bytes().as_ref()],
        bump
    )]
    pub launchpools_config: Box<Account<'info, LaunchpoolsConfig>>,
    /// CHECK: Launchpools config's reward authority can be arbitrary
    pub reward_authority: UncheckedAccount<'info>,
    pub stakable_mint: Box<InterfaceAccount<'info, token_interface::Mint>>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>
}

pub(crate) fn handler(ctx: Context<InitializeLaunchpoolsConfig>, min_position_size: u64, max_position_size: u64, protocol_reward_share_basis_points: u16, duration: u64) -> Result<()> {
    ctx.accounts.validate_stakable_mint()?;
    ctx.accounts.launchpools_config.initialize(
        ctx.accounts.reward_authority.key(),
        ctx.accounts.stakable_mint.key(),
        min_position_size,
        max_position_size,
        protocol_reward_share_basis_points,
        duration,
        ctx.accounts.launchpools_configs_manager.configs_count(),
        ctx.bumps.launchpools_config
    )?;
    ctx.accounts.launchpools_configs_manager.increment_configs_count();
    let launchpools_config = &ctx.accounts.launchpools_config;

    msg!("Event: InitializeLaunchpoolsConfig");

    emit!(
        InitializeLaunchpoolsConfigEvent {
            authority: ctx.accounts.authority.key(),
            launchpools_config: launchpools_config.key(),
            reward_authority: launchpools_config.reward_authority().key(),
            stakable_mint: launchpools_config.stakable_mint().key(),
            min_position_size: launchpools_config.min_position_size(),
            max_position_size: launchpools_config.max_position_size(),
            protocol_reward_share_basis_points: launchpools_config.protocol_reward_share_basis_points(),
            duration: launchpools_config.duration(),
            id: launchpools_config.id,
            timestamp: Clock::get()?.unix_timestamp
        }
    );
    Ok(())
}
#[event]
pub struct InitializeLaunchpoolsConfigEvent {
    pub authority: Pubkey,
    pub launchpools_config: Pubkey,
    pub reward_authority: Pubkey,
    pub stakable_mint: Pubkey,
    pub min_position_size: u64,
    pub max_position_size: u64,
    pub protocol_reward_share_basis_points: u16,
    pub duration: u64,
    pub id: u64,
    pub timestamp: i64,
}
impl<'info> InitializeLaunchpoolsConfig<'info>  {
    fn validate_stakable_mint(&self) -> Result<()> {
        let stakable_mint = self.stakable_mint.as_ref();
        validate_stakable_mint(stakable_mint)
    }
}