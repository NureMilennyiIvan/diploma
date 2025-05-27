
use anchor_lang::prelude::*;

declare_id!("5M9TeHHBeAtUd956yRUW9TEULF5XqGUdcyfy74YDzXHU");

mod error;
mod instructions;
mod state;

pub use instructions::*;

#[program]
pub mod launchpool {
    use super::*;
    pub fn initialize_launchpools_config(ctx: Context<InitializeLaunchpoolsConfig>, min_position_size: u64, max_position_size: u64, protocol_reward_share_basis_points: u16, duration: u64) -> Result<()>{
        msg!("Instruction: InitializeLaunchpoolsConfig");
        initialize_launchpools_config::handler(ctx, min_position_size, max_position_size, protocol_reward_share_basis_points, duration)
    }

    pub fn initialize_launchpools_configs_manager(ctx: Context<InitializeLaunchpoolsConfigsManager>) -> Result<()>{
        msg!("Instruction: InitializeLaunchpoolsConfigsManager");
        initialize_launchpools_configs_manager::handler(ctx)
    }

    pub fn update_launchpools_config_duration(ctx: Context<UpdateLaunchpoolsConfigDuration>, new_duration: u64) -> Result<()>{
        msg!("Instruction: UpdateLaunchpoolsConfigDuration");
        update_launchpools_config_duration::handler(ctx, new_duration)
    }

    pub fn update_launchpools_config_position_sizes(ctx: Context<UpdateLaunchpoolsConfigPositionSizes>, new_min_position_size: u64, new_max_position_size: u64) -> Result<()>{
        msg!("Instruction: UpdateLaunchpoolsConfigPositionSizes");
        update_launchpools_config_position_sizes::handler(ctx, new_min_position_size, new_max_position_size)
    }

    pub fn update_launchpools_config_protocol_reward_share(ctx: Context<UpdateLaunchpoolsConfigProtocolRewardShare>, new_protocol_reward_share_basis_points: u16) -> Result<()>{
        msg!("Instruction: UpdateLaunchpoolsConfigProtocolRewardShare");
        update_launchpools_config_protocol_reward_share::handler(ctx, new_protocol_reward_share_basis_points)
    }

    pub fn update_launchpools_config_reward_authority(ctx: Context<UpdateLaunchpoolsConfigRewardAuthority>) -> Result<()>{
        msg!("Instruction: UpdateLaunchpoolsConfigRewardAuthority");
        update_launchpools_config_reward_authority::handler(ctx)
    }

    pub fn update_launchpools_configs_manager_authority(ctx: Context<UpdateLaunchpoolsConfigsManagerAuthority>) -> Result<()>{
        msg!("Instruction: UpdateLaunchpoolsConfigsManagerAuthority");
        update_launchpools_configs_manager_authority::handler(ctx)
    }

    pub fn update_launchpools_configs_manager_head_authority(ctx: Context<UpdateLaunchpoolsConfigsManagerHeadAuthority>) -> Result<()>{
        msg!("Instruction: UpdateLaunchpoolsConfigsManagerHeadAuthority");
        update_launchpools_configs_manager_head_authority::handler(ctx)
    }

    pub fn initialize_launchpool(ctx: Context<InitializeLaunchpool>, initial_reward_amount: u64) -> Result<()>{
        msg!("Instruction: InitializeLaunchpool");
        initialize_launchpool::handler(ctx, initial_reward_amount)
    }

    pub fn launch_launchpool(ctx: Context<LaunchLaunchpool>, start_timestamp: u64) -> Result<()>{
        msg!("Instruction: LaunchLaunchpool");
        launch_launchpool::handler(ctx, start_timestamp)
    }

    pub fn open_stake_position(ctx: Context<OpenStakePosition>, stake_amount: u64) -> Result<()>{
        msg!("Instruction: OpenStakePosition");
        open_stake_position::handler(ctx, stake_amount)
    }

    pub fn increase_stake_position(ctx: Context<IncreaseStakePosition>, stake_increase_amount: u64) -> Result<()>{
        msg!("Instruction: IncreaseStakePosition");
        increase_stake_position::handler(ctx, stake_increase_amount)
    }

    pub fn close_stake_position(ctx: Context<CloseStakePosition>) -> Result<()>{
        msg!("Instruction: CloseStakePosition");
        close_stake_position::handler(ctx)
    }

    pub fn collect_protocol_reward(ctx: Context<CollectProtocolReward>) -> Result<()>{
        msg!("Instruction: CollectProtocolReward");
        collect_protocol_reward::handler(ctx)
    }
}