use serde::Deserialize;
use solana_sdk::pubkey::Pubkey;
use crate::utils::serde::pubkey_from_str;

#[derive(Deserialize)]
pub struct InitializeAmmsConfigParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub amms_configs_manager: Pubkey,
}

#[derive(Deserialize)]
pub struct UpdateAmmsConfigFeeAuthorityParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub amms_config: Pubkey,
}

#[derive(Deserialize)]
pub struct UpdateAmmsConfigProtocolFeeRateParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub amms_config: Pubkey,
}

#[derive(Deserialize)]
pub struct UpdateAmmsConfigProvidersFeeRateParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub amms_config: Pubkey,
}

#[derive(Deserialize)]
pub struct InitializeCpAmmParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub amms_config: Pubkey
}

#[derive(Deserialize)]
pub struct LaunchCpAmmParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub cp_amm: Pubkey,
}

#[derive(Deserialize)]
pub struct ProvideToCpAmmParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub cp_amm: Pubkey,
}

#[derive(Deserialize)]
pub struct WithdrawFromCpAmmParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub cp_amm: Pubkey,
}

#[derive(Deserialize)]
pub struct SwapInCpAmmParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub cp_amm: Pubkey,
}

#[derive(Deserialize)]
pub struct CollectFeesFromCpAmmParams {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub cp_amm: Pubkey,
}