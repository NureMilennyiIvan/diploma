use super::address_derive::{
    get_launchpool_pda, get_launchpool_vault_pda, get_launchpools_config_pda,
    get_launchpools_configs_manager_pda, get_stake_position_pda, get_stake_position_vault_pda,
};
use crate::utils::address_derive::{get_ata, get_program_data};
use crate::utils::constants::{ASSOCIATED_TOKEN_PROGRAM_ID, RENT, SYSTEM_PROGRAM_ID};
use launchpool::instructions::{
    CloseStakePositionBuilder, CollectProtocolRewardBuilder, IncreaseStakePositionBuilder,
    InitializeLaunchpoolBuilder, InitializeLaunchpoolsConfigBuilder,
    InitializeLaunchpoolsConfigsManagerBuilder, LaunchLaunchpoolBuilder, OpenStakePositionBuilder,
    UpdateLaunchpoolsConfigDurationBuilder, UpdateLaunchpoolsConfigPositionSizesBuilder,
    UpdateLaunchpoolsConfigProtocolRewardShareBuilder,
    UpdateLaunchpoolsConfigRewardAuthorityBuilder, UpdateLaunchpoolsConfigsManagerAuthorityBuilder,
    UpdateLaunchpoolsConfigsManagerHeadAuthorityBuilder,
};
use launchpool::programs::LAUNCHPOOL_ID;
use solana_sdk::instruction::Instruction;
use solana_sdk::pubkey::Pubkey;

pub fn initialize_launchpools_configs_manager_ix(
    signer: Pubkey,
    authority: Pubkey,
    head_authority: Pubkey,
) -> (Instruction, Pubkey) {
    let mut builder = InitializeLaunchpoolsConfigsManagerBuilder::new();
    let launchpools_configs_manager = get_launchpools_configs_manager_pda().0;
    builder.signer(signer);
    builder.launchpools_configs_manager(launchpools_configs_manager.clone());
    builder.authority(authority);
    builder.head_authority(head_authority);
    builder.program_data(get_program_data(&LAUNCHPOOL_ID).0);
    builder.launchpool_program(LAUNCHPOOL_ID);
    builder.rent(RENT);
    builder.system_program(SYSTEM_PROGRAM_ID);
    (builder.instruction(), launchpools_configs_manager)
}
pub fn update_launchpools_configs_manager_authority_ix(
    authority: Pubkey,
    new_authority: Pubkey,
) -> Instruction {
    let mut builder = UpdateLaunchpoolsConfigsManagerAuthorityBuilder::new();
    builder.authority(authority);
    builder.launchpools_configs_manager(get_launchpools_configs_manager_pda().0);
    builder.new_authority(new_authority);
    builder.instruction()
}
pub fn update_launchpools_configs_manager_head_authority_ix(
    head_authority: Pubkey,
    new_head_authority: Pubkey,
) -> Instruction {
    let mut builder = UpdateLaunchpoolsConfigsManagerHeadAuthorityBuilder::new();
    builder.head_authority(head_authority);
    builder.launchpools_configs_manager(get_launchpools_configs_manager_pda().0);
    builder.new_head_authority(new_head_authority);
    builder.instruction()
}
pub fn initialize_launchpools_config_ix(
    authority: Pubkey,
    id: u64,
    reward_authority: Pubkey,
    stakable_mint: Pubkey,
    min_position_size: u64,
    max_position_size: u64,
    protocol_reward_share_basis_points: u16,
    duration: u64,
) -> (Instruction, Pubkey) {
    let mut builder = InitializeLaunchpoolsConfigBuilder::new();
    let launchpools_config = get_launchpools_config_pda(id).0;
    builder.authority(authority);
    builder.launchpools_configs_manager(get_launchpools_configs_manager_pda().0);
    builder.launchpools_config(launchpools_config.clone());
    builder.reward_authority(reward_authority);
    builder.stakable_mint(stakable_mint);
    builder.duration(duration);
    builder.min_position_size(min_position_size);
    builder.max_position_size(max_position_size);
    builder.protocol_reward_share_basis_points(protocol_reward_share_basis_points);
    builder.rent(RENT);
    builder.system_program(SYSTEM_PROGRAM_ID);
    (builder.instruction(), launchpools_config)
}
pub fn update_launchpools_config_reward_authority_ix(
    authority: Pubkey,
    launchpools_config: Pubkey,
    new_reward_authority: Pubkey,
) -> Instruction {
    let mut builder = UpdateLaunchpoolsConfigRewardAuthorityBuilder::new();
    builder.authority(authority);
    builder.launchpools_config(launchpools_config);
    builder.launchpools_configs_manager(get_launchpools_configs_manager_pda().0);
    builder.new_reward_authority(new_reward_authority);
    builder.instruction()
}
pub fn update_launchpools_config_protocol_reward_share_ix(
    authority: Pubkey,
    launchpools_config: Pubkey,
    new_protocol_reward_share_basis_points: u16,
) -> Instruction {
    let mut builder = UpdateLaunchpoolsConfigProtocolRewardShareBuilder::new();
    builder.authority(authority);
    builder.launchpools_config(launchpools_config);
    builder.launchpools_configs_manager(get_launchpools_configs_manager_pda().0);
    builder.new_protocol_reward_share_basis_points(new_protocol_reward_share_basis_points);
    builder.instruction()
}
pub fn update_launchpools_config_position_sizes_ix(
    authority: Pubkey,
    launchpools_config: Pubkey,
    new_min_position_size: u64,
    new_max_position_size: u64,
) -> Instruction {
    let mut builder = UpdateLaunchpoolsConfigPositionSizesBuilder::new();
    builder.authority(authority);
    builder.launchpools_config(launchpools_config);
    builder.launchpools_configs_manager(get_launchpools_configs_manager_pda().0);
    builder.new_min_position_size(new_min_position_size);
    builder.new_max_position_size(new_max_position_size);
    builder.instruction()
}
pub fn update_launchpools_config_duration_ix(
    authority: Pubkey,
    launchpools_config: Pubkey,
    new_duration: u64,
) -> Instruction {
    let mut builder = UpdateLaunchpoolsConfigDurationBuilder::new();
    builder.authority(authority);
    builder.launchpools_config(launchpools_config);
    builder.launchpools_configs_manager(get_launchpools_configs_manager_pda().0);
    builder.new_duration(new_duration);
    builder.instruction()
}
pub fn initialize_launchpool_ix(
    authority: Pubkey,
    launchpools_config: Pubkey,
    reward_mint: Pubkey,
    reward_token_program: Pubkey,
    initial_reward_amount: u64,
) -> (Instruction, Pubkey) {
    let mut builder = InitializeLaunchpoolBuilder::new();
    let launchpool = get_launchpool_pda(&reward_mint).0;
    builder.authority(authority);
    builder.launchpools_config(launchpools_config);
    builder.launchpools_configs_manager(get_launchpools_configs_manager_pda().0);
    builder.initial_reward_amount(initial_reward_amount);
    builder.reward_vault(get_launchpool_vault_pda(&launchpool).0);
    builder.launchpool(launchpool.clone());
    builder.reward_mint(reward_mint);
    builder.rent(RENT);
    builder.system_program(SYSTEM_PROGRAM_ID);
    builder.reward_token_program(reward_token_program);
    (builder.instruction(), launchpool)
}
pub fn launch_launchpool_ix(
    authority: Pubkey,
    launchpools_config: Pubkey,
    launchpool: Pubkey,
    reward_mint: Pubkey,
    start_timestamp: u64,
) -> Instruction {
    let mut builder = LaunchLaunchpoolBuilder::new();
    builder.authority(authority);
    builder.launchpools_config(launchpools_config);
    builder.launchpools_configs_manager(get_launchpools_configs_manager_pda().0);
    builder.reward_vault(get_launchpool_vault_pda(&launchpool).0);
    builder.launchpool(launchpool);
    builder.reward_mint(reward_mint);
    builder.start_timestamp(start_timestamp);
    builder.instruction()
}
pub fn open_stake_position_ix(
    signer: Pubkey,
    signer_stakable_account: Option<Pubkey>,
    launchpools_config: Pubkey,
    launchpool: Pubkey,
    stakable_mint: Pubkey,
    stakable_token_program: Pubkey,
    stake_amount: u64,
) -> (Instruction, Pubkey) {
    let mut builder = OpenStakePositionBuilder::new();
    let stake_position = get_stake_position_pda(&signer, &launchpool).0;
    builder.launchpools_config(launchpools_config);
    builder.signer_stakable_account(
        signer_stakable_account
            .unwrap_or(get_ata(&signer, &stakable_mint, &stakable_token_program).0),
    );
    builder.stakable_mint(stakable_mint);
    builder.stake_vault(get_stake_position_vault_pda(&stake_position).0);
    builder.stake_position(stake_position.clone());
    builder.signer(signer);
    builder.launchpool(launchpool);
    builder.rent(RENT);
    builder.system_program(SYSTEM_PROGRAM_ID);
    builder.stakable_token_program(stakable_token_program);
    builder.stake_amount(stake_amount);
    (builder.instruction(), stake_position)
}
pub fn increase_stake_position_ix(
    signer: Pubkey,
    signer_stakable_account: Option<Pubkey>,
    launchpools_config: Pubkey,
    launchpool: Pubkey,
    stakable_mint: Pubkey,
    stake_position: Pubkey,
    stakable_token_program: Pubkey,
    stake_increase_amount: u64,
) -> Instruction {
    let mut builder = IncreaseStakePositionBuilder::new();
    builder.launchpools_config(launchpools_config);
    builder.signer_stakable_account(
        signer_stakable_account
            .unwrap_or(get_ata(&signer, &stakable_mint, &stakable_token_program).0),
    );
    builder.stakable_mint(stakable_mint);
    builder.stake_vault(get_stake_position_vault_pda(&stake_position).0);
    builder.stake_position(stake_position);
    builder.signer(signer);
    builder.launchpool(launchpool);
    builder.stakable_token_program(stakable_token_program);
    builder.stake_increase_amount(stake_increase_amount);
    builder.instruction()
}
pub fn close_stake_position_ix(
    signer: Pubkey,
    signer_stakable_account: Option<Pubkey>,
    launchpools_config: Pubkey,
    launchpool: Pubkey,
    stakable_mint: Pubkey,
    reward_mint: Pubkey,
    stake_position: Pubkey,
    stakable_token_program: Pubkey,
    reward_token_program: Pubkey,
) -> Instruction {
    let mut builder = CloseStakePositionBuilder::new();
    builder.launchpools_config(launchpools_config);
    builder.signer_stakable_account(
        signer_stakable_account
            .unwrap_or(get_ata(&signer, &stakable_mint, &stakable_token_program).0),
    );
    builder.signer_reward_account(get_ata(&signer, &reward_mint, &reward_token_program).0);
    builder.signer(signer);
    builder.reward_mint(reward_mint);
    builder.stakable_mint(stakable_mint);
    builder.reward_vault(get_launchpool_vault_pda(&launchpool).0);
    builder.launchpool(launchpool);
    builder.stake_vault(get_stake_position_vault_pda(&stake_position).0);
    builder.stake_position(stake_position);
    builder.stakable_token_program(stakable_token_program);
    builder.reward_token_program(reward_token_program);
    builder.rent(RENT);
    builder.system_program(SYSTEM_PROGRAM_ID);
    builder.associated_token_program(ASSOCIATED_TOKEN_PROGRAM_ID);
    builder.instruction()
}
pub fn collect_protocol_reward_ix(
    signer: Pubkey,
    reward_authority: Pubkey,
    launchpools_config: Pubkey,
    reward_mint: Pubkey,
    launchpool: Pubkey,
    reward_token_program: Pubkey,
) -> Instruction {
    let mut builder = CollectProtocolRewardBuilder::new();
    builder.signer(signer);
    builder.launchpools_config(launchpools_config);
    builder.reward_authority_account(
        get_ata(&reward_authority, &reward_mint, &reward_token_program).0,
    );
    builder.reward_mint(reward_mint);
    builder.reward_authority(reward_authority);
    builder.reward_vault(get_launchpool_vault_pda(&launchpool).0);
    builder.launchpool(launchpool);
    builder.rent(RENT);
    builder.system_program(SYSTEM_PROGRAM_ID);
    builder.associated_token_program(ASSOCIATED_TOKEN_PROGRAM_ID);
    builder.reward_token_program(reward_token_program);
    builder.instruction()
}
