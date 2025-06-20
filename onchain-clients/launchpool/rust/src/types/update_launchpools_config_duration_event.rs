//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use solana_program::pubkey::Pubkey;
use borsh::BorshSerialize;
use borsh::BorshDeserialize;

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct UpdateLaunchpoolsConfigDurationEvent {
#[cfg_attr(feature = "serde", serde(with = "serde_with::As::<serde_with::DisplayFromStr>"))]
pub authority: Pubkey,
#[cfg_attr(feature = "serde", serde(with = "serde_with::As::<serde_with::DisplayFromStr>"))]
pub launchpools_config: Pubkey,
pub new_duration: u64,
pub timestamp: i64,
}


