use std::str::FromStr;
use serde::{de, Deserialize, Deserializer};
use solana_sdk::pubkey::Pubkey;
use tracing::info;

pub fn pubkey_from_str<'de, D>(deserializer: D) -> Result<Pubkey, D::Error>
where
    D: Deserializer<'de>,
{
    let s = String::deserialize(deserializer)?;
    Pubkey::from_str(&s).map_err(de::Error::custom)
}

pub fn option_pubkey_from_str<'de, D>(deserializer: D) -> Result<Option<Pubkey>, D::Error>
where
    D: Deserializer<'de>,
{
    let opt = Option::<String>::deserialize(deserializer)?;
    match opt {
        Some(s) => Pubkey::from_str(&s).map(Some).map_err(de::Error::custom),
        None => Ok(None),
    }
}
pub fn u64_from_str<'de, D>(deserializer: D) -> Result<u64, D::Error>
where
    D: Deserializer<'de>,
{
    let s = String::deserialize(deserializer)?;
    s.parse::<u64>().map_err(de::Error::custom)
}