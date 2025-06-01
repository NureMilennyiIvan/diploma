use scylla::client::session::Session;
use solana_sdk::pubkey::Pubkey;
use anyhow::{Context, Result as AnyResult};
use crate::utils::clients::ScyllaDbClient;
use crate::liquidity_pool::models::{CpAmmKeys, CpAmmKeysScylla};

pub struct LiquidityPoolScyllaDbClient {
    liquidity_pool_session: Session
}
impl LiquidityPoolScyllaDbClient {
    pub fn new(liquidity_pool_session: Session) -> Self {
        Self{
            liquidity_pool_session
        }
    }
    pub async fn fetch_cp_amm_keys(&self, cp_amm: &Pubkey) -> AnyResult<Option<CpAmmKeys>> {
        let rows = self
            .session()
            .query_unpaged("SELECT amms_config, base_mint, quote_mint, lp_mint FROM cp_amms_keys WHERE cp_amm = ?", (cp_amm.to_string(),))
            .await
            .context("failed to fetch cp_amm_keys")?
            .into_rows_result()?;

        if rows.rows_num() == 0{
            return Ok(None);
        }
        let cp_amm_keys: CpAmmKeys = rows.first_row::<CpAmmKeysScylla>()?.try_into()?;
        Ok(Some(cp_amm_keys))
    }
}
impl ScyllaDbClient for LiquidityPoolScyllaDbClient {
    fn session(&self) -> &Session{
        &self.liquidity_pool_session
    }
}