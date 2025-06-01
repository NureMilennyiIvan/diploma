use serde::Deserialize;
use solana_sdk::pubkey::Pubkey;
use crate::utils::serde::*;
#[derive(Deserialize)]
pub struct InitializeLaunchpoolsConfigsManagerPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub signer: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub authority: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub head_authority: Pubkey,
}

#[derive(Deserialize)]
pub struct UpdateLaunchpoolsConfigsManagerAuthorityPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub authority: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub new_authority: Pubkey,
}

#[derive(Deserialize)]
pub struct UpdateLaunchpoolsConfigsManagerHeadAuthorityPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub head_authority: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub new_head_authority: Pubkey,
}

#[derive(Deserialize)]
pub struct InitializeLaunchpoolsConfigPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub authority: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub reward_authority: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub stakable_mint: Pubkey,
    #[serde(deserialize_with = "u64_from_str")]
    pub min_position_size: u64,
    #[serde(deserialize_with = "u64_from_str")]
    pub max_position_size: u64,
    pub protocol_reward_share_basis_points: u16,
    #[serde(deserialize_with = "u64_from_str")]
    pub duration: u64,
}

#[derive(Deserialize)]
pub struct UpdateLaunchpoolsConfigRewardAuthorityPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub authority: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub new_reward_authority: Pubkey,
}

#[derive(Deserialize)]
pub struct UpdateLaunchpoolsConfigProtocolRewardSharePayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub authority: Pubkey,
    pub new_protocol_reward_share_basis_points: u16,
}

#[derive(Deserialize)]
pub struct UpdateLaunchpoolsConfigPositionSizesPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub authority: Pubkey,
    #[serde(deserialize_with = "u64_from_str")]
    pub new_min_position_size: u64,
    #[serde(deserialize_with = "u64_from_str")]
    pub new_max_position_size: u64,
}

#[derive(Deserialize)]
pub struct UpdateLaunchpoolsConfigDurationPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub authority: Pubkey,
    #[serde(deserialize_with = "u64_from_str")]
    pub new_duration: u64,
}

#[derive(Deserialize)]
pub struct InitializeLaunchpoolPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub authority: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub reward_mint: Pubkey,
    #[serde(deserialize_with = "u64_from_str")]
    pub initial_reward_amount: u64,
}

#[derive(Deserialize)]
pub struct LaunchLaunchpoolPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub authority: Pubkey,
    #[serde(deserialize_with = "u64_from_str")]
    pub start_timestamp: u64,
}

#[derive(Deserialize)]
pub struct OpenStakePositionPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub signer: Pubkey,
    #[serde(deserialize_with = "option_pubkey_from_str")]
    pub signer_stakable_account: Option<Pubkey>,
    #[serde(deserialize_with = "u64_from_str")]
    pub stake_amount: u64,
}

#[derive(Deserialize)]
pub struct IncreaseStakePositionPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub signer: Pubkey,
    #[serde(deserialize_with = "option_pubkey_from_str")]
    pub signer_stakable_account: Option<Pubkey>,
    #[serde(deserialize_with = "u64_from_str")]
    pub stake_increase_amount: u64,
}

#[derive(Deserialize)]
pub struct CloseStakePositionPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub signer: Pubkey,
    #[serde(deserialize_with = "option_pubkey_from_str")]
    pub signer_stakable_account: Option<Pubkey>,
}

#[derive(Deserialize)]
pub struct CollectProtocolRewardPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub signer: Pubkey,
}