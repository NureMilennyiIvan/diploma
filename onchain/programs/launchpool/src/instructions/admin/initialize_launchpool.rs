use anchor_lang::{emit, event, Accounts, Key, ToAccountInfo};
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{TokenAccount as InterfaceTokenAccount, TokenInterface, Mint};
use utilities::helpers::validate_stakable_mint;
use utilities::math::Q64_128;
use crate::state::{LaunchpoolsConfig, LaunchpoolsConfigsManager, Launchpool};

#[derive(Accounts)]
pub struct InitializeLaunchpool<'info> {
    #[account(
        mut,
        constraint = (authority.key() == launchpools_configs_manager.authority().key() || authority.key() == launchpools_configs_manager.head_authority().key())
    )]
    pub authority: Signer<'info>,

    #[account(
        seeds = [LaunchpoolsConfigsManager::SEED],
        bump = launchpools_configs_manager.bump()
    )]
    pub launchpools_configs_manager: Box<Account<'info, LaunchpoolsConfigsManager>>,
    #[account(
        seeds = [LaunchpoolsConfig::SEED, launchpools_config.id.to_le_bytes().as_ref()],
        bump = launchpools_config.bump()
    )]
    pub launchpools_config: Box<Account<'info, LaunchpoolsConfig>>,

    pub reward_mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        init,
        payer = authority,
        space = 8 + Launchpool::INIT_SPACE,
        seeds = [Launchpool::SEED, reward_mint.key().as_ref()],
        bump
    )]
    pub launchpool: Box<Account<'info, Launchpool>>,

    #[account(
        init_if_needed,
        payer = authority,
        token::mint = reward_mint,
        token::authority = launchpool,
        token::token_program = reward_token_program,
        seeds = [Launchpool::VAULT_SEED, launchpool.key().as_ref()],
        bump
    )]
    pub reward_vault: Box<InterfaceAccount<'info, InterfaceTokenAccount>>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub reward_token_program: Interface<'info, TokenInterface>,
}

pub(crate) fn handler(ctx: Context<InitializeLaunchpool>, initial_reward_amount: u64) -> Result<()>{
    ctx.accounts.validate_reward_mint()?;
    ctx.accounts.launchpool.initialize(
        initial_reward_amount,
        &ctx.accounts.reward_vault.to_account_info(),
        &ctx.accounts.reward_mint,
        &ctx.accounts.launchpools_config,
        ctx.bumps.launchpool,
        ctx.bumps.reward_vault
    )?;
    let launchpool = &ctx.accounts.launchpool;

    msg!("Event: InitializeLaunchpool");

    emit!(
        InitializeLaunchpoolEvent{
            authority: ctx.accounts.authority.key(),
            launchpool: launchpool.key(),
            launchpools_config: launchpool.launchpools_config().key(),
            reward_mint: launchpool.reward_mint().key(),
            reward_vault: launchpool.reward_vault().key(),
            initial_reward_amount: launchpool.initial_reward_amount(),
            protocol_reward_amount: launchpool.protocol_reward_amount(),
            participants_reward_amount: launchpool.participants_reward_amount().as_u64(),
            protocol_reward_left_to_obtain: launchpool.protocol_reward_left_to_obtain(),
            participants_reward_left_to_obtain: launchpool.participants_reward_left_to_obtain(),
            participants_reward_left_to_distribute: launchpool.participants_reward_left_to_distribute(),
            min_position_size: launchpool.min_position_size(),
            max_position_size: launchpool.max_position_size(),
            timestamp: Clock::get()?.unix_timestamp,
        }
    );
    Ok(())
}
impl<'info> InitializeLaunchpool<'info> {
    fn validate_reward_mint(&self) -> Result<()> {
        let reward_mint = self.reward_mint.as_ref();
        validate_stakable_mint(reward_mint)
    }
}

#[event]
pub struct InitializeLaunchpoolEvent {
    pub authority: Pubkey,
    pub launchpool: Pubkey,
    pub launchpools_config: Pubkey,
    pub reward_mint: Pubkey,
    pub reward_vault: Pubkey,
    pub initial_reward_amount: u64,
    pub protocol_reward_amount: u64,
    pub participants_reward_amount: u64,
    pub participants_reward_left_to_obtain: u64,
    pub protocol_reward_left_to_obtain: u64,
    pub participants_reward_left_to_distribute: Q64_128,
    pub min_position_size: u64,
    pub max_position_size: u64,
    pub timestamp: i64,
}