use serde::Deserialize;
use solana_sdk::pubkey::Pubkey;
use crate::utils::serde::*;
#[derive(Deserialize)]
pub struct InitializeAmmsConfigsManagerPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub signer: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub authority: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub head_authority: Pubkey,
}

#[derive(Deserialize)]
pub struct UpdateAmmsConfigsManagerAuthorityPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub authority: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub new_authority: Pubkey,
}

#[derive(Deserialize)]
pub struct UpdateAmmsConfigsManagerHeadAuthorityPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub head_authority: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub new_head_authority: Pubkey,
}

#[derive(Deserialize)]
pub struct InitializeAmmsConfigPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub authority: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub fee_authority: Pubkey,
    pub protocol_fee_rate_basis_points: u16,
    pub providers_fee_rate_basis_points: u16,
}

#[derive(Deserialize)]
pub struct UpdateAmmsConfigFeeAuthorityPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub authority: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub new_fee_authority: Pubkey,
}

#[derive(Deserialize)]
pub struct UpdateAmmsConfigProtocolFeeRatePayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub authority: Pubkey,
    pub new_protocol_fee_rate_basis_points: u16,
}

#[derive(Deserialize)]
pub struct UpdateAmmsConfigProvidersFeeRatePayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub authority: Pubkey,
    pub new_providers_fee_rate_basis_points: u16,
}

#[derive(Deserialize)]
pub struct InitializeCpAmmPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub signer: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub base_mint: Pubkey,
    #[serde(deserialize_with = "pubkey_from_str")]
    pub quote_mint: Pubkey,
}

#[derive(Deserialize)]
pub struct LaunchCpAmmPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub creator: Pubkey,
    #[serde(deserialize_with = "option_pubkey_from_str")]
    pub creator_base_account: Option<Pubkey>,
    #[serde(deserialize_with = "option_pubkey_from_str")]
    pub creator_quote_account: Option<Pubkey>,
    #[serde(deserialize_with = "u64_from_str")]
    pub base_liquidity: u64,
    #[serde(deserialize_with = "u64_from_str")]
    pub quote_liquidity: u64,
}

#[derive(Deserialize)]
pub struct ProvideToCpAmmPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub signer: Pubkey,
    #[serde(deserialize_with = "option_pubkey_from_str")]
    pub signer_base_account: Option<Pubkey>,
    #[serde(deserialize_with = "option_pubkey_from_str")]
    pub signer_quote_account: Option<Pubkey>,
    #[serde(deserialize_with = "u64_from_str")]
    pub base_liquidity: u64,
    #[serde(deserialize_with = "u64_from_str")]
    pub quote_liquidity: u64,
}

#[derive(Deserialize)]
pub struct WithdrawFromCpAmmPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub signer: Pubkey,
    #[serde(deserialize_with = "option_pubkey_from_str")]
    pub signer_lp_account: Option<Pubkey>,
    #[serde(deserialize_with = "u64_from_str")]
    pub lp_tokens: u64,
}

#[derive(Deserialize)]
pub struct SwapInCpAmmPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub signer: Pubkey,
    #[serde(deserialize_with = "u64_from_str")]
    pub swap_amount: u64,
    #[serde(deserialize_with = "u64_from_str")]
    pub estimated_result: u64,
    #[serde(deserialize_with = "u64_from_str")]
    pub allowed_slippage: u64,
    pub is_in_out: bool,
}

#[derive(Deserialize)]
pub struct CollectFeesFromCpAmmPayload {
    #[serde(deserialize_with = "pubkey_from_str")]
    pub signer: Pubkey,
}