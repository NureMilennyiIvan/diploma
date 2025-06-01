use liquidity_pool::accounts::CpAmm;
use scylla::_macro_internal::DeserializeRow;
use solana_sdk::pubkey::{ParsePubkeyError, Pubkey};
use std::str::FromStr;

pub struct CpAmmKeys {
    pub amms_config: Pubkey,
    pub base_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub lp_mint: Pubkey,
}

impl From<CpAmm> for CpAmmKeys {
    fn from(value: CpAmm) -> Self {
        Self {
            amms_config: value.amms_config,
            base_mint: value.base_mint,
            quote_mint: value.quote_mint,
            lp_mint: value.lp_mint,
        }
    }
}
impl TryFrom<CpAmmKeysScylla> for CpAmmKeys {
    type Error = ParsePubkeyError;

    fn try_from(value: CpAmmKeysScylla) -> Result<Self, Self::Error> {
        Ok(Self {
            amms_config: Pubkey::from_str(value.amms_config.as_str())?,
            base_mint: Pubkey::from_str(value.base_mint.as_str())?,
            quote_mint: Pubkey::from_str(value.quote_mint.as_str())?,
            lp_mint: Pubkey::from_str(value.lp_mint.as_str())?,
        })
    }
}

#[derive(DeserializeRow)]
pub struct CpAmmKeysScylla {
    pub amms_config: String,
    pub base_mint: String,
    pub quote_mint: String,
    pub lp_mint: String,
}
