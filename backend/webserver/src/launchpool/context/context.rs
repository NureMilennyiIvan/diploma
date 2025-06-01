use super::{LaunchpoolScyllaDbClient, LaunchpoolSolanaRpcClient};
use crate::launchpool::models::{LaunchpoolKeys, LaunchpoolsConfigKeys, StakePositionKeys};
use crate::utils::clients::{CacheRegistry, ProgramContext};
use anyhow::Result as AnyResult;
use async_trait::async_trait;
use launchpool::accounts::{Launchpool, LaunchpoolsConfig, StakePosition};
use solana_sdk::pubkey::Pubkey;
use std::ops::Deref;
use std::sync::Arc;
use tracing::debug;

pub struct LaunchpoolContext {
    solana_rpc_client: Arc<LaunchpoolSolanaRpcClient>,
    scylla_db_client: Arc<LaunchpoolScyllaDbClient>,
    cache_registry: Arc<CacheRegistry>,
}
impl LaunchpoolContext {
    pub fn new(
        solana_rpc_client: Arc<LaunchpoolSolanaRpcClient>,
        scylla_db_client: Arc<LaunchpoolScyllaDbClient>,
        cache_registry: Arc<CacheRegistry>,
    ) -> Self {
        Self {
            solana_rpc_client,
            scylla_db_client,
            cache_registry,
        }
    }
    pub async fn get_launchpool_keys(
        &self,
        launchpool_key: &Pubkey,
    ) -> AnyResult<Arc<LaunchpoolKeys>> {
        debug!(?launchpool_key, "Fetching launchpool keys from launchpool_keys_cache");
        let launchpool_keys_cache = self
            .cache_registry
            .get::<Pubkey, Arc<LaunchpoolKeys>>("launchpool_keys_cache")
            .expect("launchpool_keys_cache must be registered");
        if let Some(launchpool_keys) = launchpool_keys_cache.get(launchpool_key).await {
            debug!(?launchpool_key, "Fetched launchpool keys");
            return Ok(launchpool_keys);
        }

        debug!(?launchpool_key, "Launchpool keys not in launchpool_keys_cache — fetching from launchpool_cache");
        let launchpool_cache = self
            .cache_registry()
            .get::<Pubkey, Arc<Launchpool>>("launchpool_cache")
            .expect("launchpool_cache must be registered");
        if let Some(launchpool) = launchpool_cache.get(launchpool_key).await {
            let launchpool_keys = Arc::new(LaunchpoolKeys::from(launchpool.deref().clone()));
            launchpool_keys_cache
                .insert(*launchpool_key, launchpool_keys.clone())
                .await;
            debug!(?launchpool_key, "Fetched launchpool keys");
            return Ok(launchpool_keys);
        }

        debug!(?launchpool_key, "Launchpool keys not in launchpool_cache — fetching from ScyllaDB");
        if let Some(launchpool_keys) = self
            .scylla_db_client()
            .fetch_launchpool_keys(launchpool_key)
            .await
            .ok()
            .flatten()
            .map(Arc::new)
        {
            launchpool_keys_cache
                .insert(*launchpool_key, launchpool_keys.clone())
                .await;
            return Ok(launchpool_keys);
        }

        debug!(?launchpool_key, "Launchpool keys not in Scylla DB — fetching from Solana RPC");
        let launchpool_account = self
            .solana_rpc_client()
            .fetch_launchpool(launchpool_key)
            .await?;
        launchpool_cache
            .insert(*launchpool_key, Arc::new(launchpool_account.clone()))
            .await;
        let launchpool_keys = Arc::new(LaunchpoolKeys::from(launchpool_account));
        launchpool_keys_cache
            .insert(*launchpool_key, launchpool_keys.clone())
            .await;
        Ok(launchpool_keys)
    }

    pub async fn get_launchpools_config_keys(
        &self,
        config_key: &Pubkey,
    ) -> AnyResult<Arc<LaunchpoolsConfigKeys>> {
        debug!(?config_key, "Fetching launchpools config keys from launchpools_config_keys_cache");
        let config_keys_cache = self
            .cache_registry()
            .get::<Pubkey, Arc<LaunchpoolsConfigKeys>>("launchpools_config_keys_cache")
            .expect("launchpools_config_keys_cache must be registered");

        if let Some(config_keys) = config_keys_cache.get(config_key).await {
            debug!(?config_key, "Fetched launchpools config keys");
            return Ok(config_keys);
        }

        debug!(?config_key, "Launchpools config keys not in keys cache — fetching from ScyllaDB");
        if let Some(config_keys) = self
            .scylla_db_client()
            .fetch_launchpools_config_keys(config_key)
            .await
            .ok()
            .flatten()
            .map(Arc::new)
        {
            config_keys_cache.insert(*config_key, config_keys.clone()).await;
            return Ok(config_keys);
        }

        debug!(?config_key, "Launchpools config keys not in Scylla DB — fetching from Solana RPC");
        let config_account = self
            .solana_rpc_client()
            .fetch_launchpools_config(config_key)
            .await?;

        let config_keys = Arc::new(LaunchpoolsConfigKeys::from(config_account));
        config_keys_cache.insert(*config_key, config_keys.clone()).await;
        Ok(config_keys)
    }

    pub async fn get_stake_position_keys(
        &self,
        stake_position_key: &Pubkey,
    ) -> AnyResult<Arc<StakePositionKeys>> {
        debug!(?stake_position_key, "Fetching stake position keys from stake_position_keys_cache");
        let position_keys_cache = self
            .cache_registry()
            .get::<Pubkey, Arc<StakePositionKeys>>("stake_position_keys_cache")
            .expect("stake_position_keys_cache must be registered");

        if let Some(position_keys) = position_keys_cache.get(stake_position_key).await {
            debug!(?stake_position_key, "Fetched stake position keys");
            return Ok(position_keys);
        }

        debug!(?stake_position_key, "Stake position keys not in keys cache — fetching from stake_position_cache");
        let position_cache = self
            .cache_registry()
            .get::<Pubkey, Arc<StakePosition>>("stake_position_cache")
            .expect("stake_position_cache must be registered");

        if let Some(position) = position_cache.get(stake_position_key).await {
            let position_keys = Arc::new(StakePositionKeys::from(position.deref().clone()));
            position_keys_cache
                .insert(*stake_position_key, position_keys.clone())
                .await;
            debug!(?stake_position_key, "Fetched stake position keys");
            return Ok(position_keys);
        }

        debug!(?stake_position_key, "Stake position keys not in position cache — fetching from ScyllaDB");
        if let Some(position_keys) = self
            .scylla_db_client()
            .fetch_stake_position_keys(stake_position_key)
            .await
            .ok()
            .flatten()
            .map(Arc::new)
        {
            position_keys_cache
                .insert(*stake_position_key, position_keys.clone())
                .await;
            return Ok(position_keys);
        }

        debug!(?stake_position_key, "Stake position keys not in Scylla DB — fetching from Solana RPC");
        let position_account = self
            .solana_rpc_client()
            .fetch_stake_position(stake_position_key)
            .await?;

        position_cache
            .insert(*stake_position_key, Arc::new(position_account.clone()))
            .await;

        let position_keys = Arc::new(StakePositionKeys::from(position_account));
        position_keys_cache
            .insert(*stake_position_key, position_keys.clone())
            .await;

        Ok(position_keys)
    }
}

#[async_trait]
impl ProgramContext<LaunchpoolScyllaDbClient, LaunchpoolSolanaRpcClient> for LaunchpoolContext {
    fn scylla_db_client(&self) -> Arc<LaunchpoolScyllaDbClient> {
        self.scylla_db_client.clone()
    }

    fn solana_rpc_client(&self) -> Arc<LaunchpoolSolanaRpcClient> {
        self.solana_rpc_client.clone()
    }

    fn cache_registry(&self) -> Arc<CacheRegistry> {
        self.cache_registry.clone()
    }
}
