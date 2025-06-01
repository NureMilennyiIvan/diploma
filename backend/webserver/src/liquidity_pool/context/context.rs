use super::{LiquidityPoolScyllaDbClient, LiquidityPoolSolanaRpcClient};
use crate::liquidity_pool::models::CpAmmKeys;
use crate::utils::clients::{CacheRegistry, ProgramContext};
use anyhow::Result as AnyResult;
use async_trait::async_trait;
use solana_sdk::pubkey::Pubkey;
use std::sync::Arc;

pub struct LiquidityPoolContext {
    solana_rpc_client: Arc<LiquidityPoolSolanaRpcClient>,
    scylla_db_client: Arc<LiquidityPoolScyllaDbClient>,
    cache_registry: Arc<CacheRegistry>,
}

impl LiquidityPoolContext {
    pub fn new(
        solana_rpc_client: Arc<LiquidityPoolSolanaRpcClient>,
        scylla_db_client: Arc<LiquidityPoolScyllaDbClient>,
        cache_registry: Arc<CacheRegistry>,
    ) -> Self {
        Self {
            solana_rpc_client,
            scylla_db_client,
            cache_registry
        }
    }
    pub async fn get_cp_amm_keys(&self, cp_amm_key: &Pubkey) -> AnyResult<Arc<CpAmmKeys>> {

        let cp_amm_keys_cache = self
            .cache_registry()
            .get::<Pubkey, Arc<CpAmmKeys>>("cp_amm_keys_cache")
            .expect("cp_amm_keys_cache must be registered");

        if let Some(cp_amm_keys) = self
            .scylla_db_client()
            .fetch_cp_amm_keys(cp_amm_key)
            .await
            .ok()
            .flatten()
            .map(Arc::new)
        {
            cp_amm_keys_cache
                .insert(*cp_amm_key, cp_amm_keys.clone())
                .await;
            return Ok(cp_amm_keys);
        }

        let cp_amm_account = self.solana_rpc_client().fetch_cp_amm(cp_amm_key).await?;

        let cp_amm_keys = Arc::new(CpAmmKeys::from(cp_amm_account));
        cp_amm_keys_cache
            .insert(*cp_amm_key, cp_amm_keys.clone())
            .await;

        Ok(cp_amm_keys)
    }
}
#[async_trait]
impl ProgramContext<LiquidityPoolScyllaDbClient, LiquidityPoolSolanaRpcClient>
    for LiquidityPoolContext
{
    fn scylla_db_client(&self) -> Arc<LiquidityPoolScyllaDbClient> {
        self.scylla_db_client.clone()
    }

    fn solana_rpc_client(&self) -> Arc<LiquidityPoolSolanaRpcClient> {
        self.solana_rpc_client.clone()
    }

    fn cache_registry(&self) -> Arc<CacheRegistry> {
        self.cache_registry.clone()
    }
}
