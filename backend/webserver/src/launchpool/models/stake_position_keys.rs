use scylla::DeserializeRow;
use solana_sdk::pubkey::{ParsePubkeyError, Pubkey};
use std::str::FromStr;
use launchpool::accounts::StakePosition;

pub struct StakePositionKeys{
    pub authority: Pubkey,
    pub launchpool: Pubkey,
}

impl From<StakePosition> for StakePositionKeys{

    fn from(value: StakePosition) -> Self {
        Self{
            authority: value.authority,
            launchpool: value.launchpool,
        }
    }
}

#[derive(DeserializeRow)]
pub struct StakePositionKeysScylla {
    pub user: String,
    pub launchpool: String,
}

impl TryFrom<StakePositionKeysScylla> for StakePositionKeys {
    type Error = ParsePubkeyError;

    fn try_from(value: StakePositionKeysScylla) -> Result<Self, Self::Error> {
        Ok(Self {
            authority: Pubkey::from_str(&value.user)?,
            launchpool: Pubkey::from_str(&value.launchpool)?,
        })
    }
}