use serde::Deserialize;
use solana_sdk::pubkey::Pubkey;
use crate::utils::serde::pubkey_from_str;
#[derive(Deserialize)]
pub struct InitializeLaunchpoolsConfigParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub launchpools_configs_manager: Pubkey,
}

#[derive(Deserialize)]
pub struct UpdateLaunchpoolsConfigRewardAuthorityParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub launchpools_config: Pubkey,
}

#[derive(Deserialize)]
pub struct UpdateLaunchpoolsConfigProtocolRewardShareParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub launchpools_config: Pubkey,
}
#[derive(Deserialize)]
pub struct UpdateLaunchpoolsConfigPositionSizesParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub launchpools_config: Pubkey,
}
#[derive(Deserialize)]
pub struct UpdateLaunchpoolsConfigDurationParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub launchpools_config: Pubkey,
}
#[derive(Deserialize)]
pub struct InitializeLaunchpoolParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub launchpools_config: Pubkey,
}

#[derive(Deserialize)]
pub struct LaunchLaunchpoolParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub launchpool: Pubkey,
}

#[derive(Deserialize)]
pub struct OpenStakePositionParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub launchpool: Pubkey,
}

#[derive(Deserialize)]
pub struct IncreaseStakePositionParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub stake_position: Pubkey,
}

#[derive(Deserialize)]
pub struct CloseStakePositionParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub stake_position: Pubkey,
}

#[derive(Deserialize)]
pub struct CollectProtocolRewardParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub launchpool: Pubkey,
}