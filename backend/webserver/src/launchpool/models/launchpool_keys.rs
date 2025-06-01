use std::str::FromStr;
use scylla::DeserializeRow;
use solana_sdk::pubkey::{ParsePubkeyError, Pubkey};
use launchpool::accounts::Launchpool;

pub struct LaunchpoolKeys{
    pub launchpools_config: Pubkey,
    pub reward_mint: Pubkey
}

impl From<Launchpool> for LaunchpoolKeys{

    fn from(value: Launchpool) -> Self {
        Self{
            launchpools_config: value.launchpools_config,
            reward_mint: value.reward_mint
        }
    }
}


#[derive(DeserializeRow)]
pub struct LaunchpoolKeysScylla {
    pub launchpools_config: String,
    pub reward_mint: String,
}
impl TryFrom<LaunchpoolKeysScylla> for LaunchpoolKeys {
    type Error = ParsePubkeyError;

    fn try_from(value: LaunchpoolKeysScylla) -> Result<Self, Self::Error> {
        Ok(Self {
            launchpools_config: Pubkey::from_str(&value.launchpools_config)?,
            reward_mint: Pubkey::from_str(&value.reward_mint)?
        })
    }
}