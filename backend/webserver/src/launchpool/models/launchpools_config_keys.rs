use std::str::FromStr;
use scylla::DeserializeRow;
use solana_sdk::pubkey::{ParsePubkeyError, Pubkey};
use launchpool::accounts::{LaunchpoolsConfig};

pub struct LaunchpoolsConfigKeys{
    pub stakable_mint: Pubkey
}

impl From<LaunchpoolsConfig> for LaunchpoolsConfigKeys{

    fn from(value: LaunchpoolsConfig) -> Self {
        Self{
            stakable_mint: value.stakable_mint
        }
    }
}

#[derive(DeserializeRow)]
pub struct LaunchpoolsConfigKeysScylla {
    pub stakable_mint: String,
}
impl TryFrom<LaunchpoolsConfigKeysScylla> for LaunchpoolsConfigKeys {
    type Error = ParsePubkeyError;

    fn try_from(value: LaunchpoolsConfigKeysScylla) -> Result<Self, Self::Error> {
        Ok(Self {
            stakable_mint: Pubkey::from_str(&value.stakable_mint)?,
        })
    }
}