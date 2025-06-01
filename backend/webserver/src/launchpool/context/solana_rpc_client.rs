use solana_client::nonblocking::rpc_client::RpcClient as RpcClientNonBlocking;
use std::time::Duration;
use moka::future::Cache;
use solana_sdk::commitment_config::{CommitmentConfig, CommitmentLevel};
use solana_sdk::hash::Hash;
use solana_sdk::pubkey::Pubkey;
use anyhow::Result as AnyResult;
use async_trait::async_trait;
use solana_sdk::program_error::ProgramError;
use tracing::debug;
use launchpool::accounts::{Launchpool, LaunchpoolsConfig, LaunchpoolsConfigsManager, StakePosition};
use launchpool::programs::LAUNCHPOOL_ID;
use liquidity_pool::programs::LIQUIDITY_POOL_ID;
use crate::utils::clients::SolanaRpcClient;

pub struct LaunchpoolSolanaRpcClient {
    cached_blockhash: Cache<(), Hash>,
    rpc_client: RpcClientNonBlocking
}

impl LaunchpoolSolanaRpcClient {
    pub fn new(rpc_url: String, blockhash_lifetime_secs: u64, commitment_level: CommitmentLevel) -> Self {
        Self {
            cached_blockhash: Cache::builder()
                .time_to_live(Duration::from_secs(blockhash_lifetime_secs))
                .max_capacity(1)
                .build(),
            rpc_client: RpcClientNonBlocking::new_with_commitment(rpc_url,   CommitmentConfig { commitment: commitment_level, })
        }
    }
    pub async fn fetch_launchpools_configs_manager(&self, launchpools_configs_manager: &Pubkey) -> AnyResult<LaunchpoolsConfigsManager> {
        let account = self.rpc_client.get_account(launchpools_configs_manager).await?;
        if account.owner != LAUNCHPOOL_ID {
            return Err(ProgramError::IncorrectProgramId.into());
        }
        debug!(?launchpools_configs_manager, "Fetched LaunchpoolsConfigsManager account");
        let parsed = LaunchpoolsConfigsManager::from_bytes(account.data.as_slice())?;
        debug!(?launchpools_configs_manager, "Parsed LaunchpoolsConfigsManager");
        Ok(parsed)
    }

    pub async fn fetch_launchpools_config(&self, launchpools_config: &Pubkey) -> AnyResult<LaunchpoolsConfig> {
        let account = self.rpc_client.get_account(launchpools_config).await?;
        if account.owner != LAUNCHPOOL_ID {
            return Err(ProgramError::IncorrectProgramId.into());
        }
        debug!(?launchpools_config, "Fetched LaunchpoolsConfig account");
        let parsed = LaunchpoolsConfig::from_bytes(account.data.as_slice())?;
        debug!(?launchpools_config, "Parsed LaunchpoolsConfig");
        Ok(parsed)
    }

    pub async fn fetch_launchpool(&self, launchpool: &Pubkey) -> AnyResult<Launchpool> {
        let account = self.rpc_client.get_account(launchpool).await?;
        if account.owner != LAUNCHPOOL_ID {
            return Err(ProgramError::IncorrectProgramId.into());
        }
        debug!(?launchpool, "Fetched Launchpool account");
        let parsed = Launchpool::from_bytes(account.data.as_slice())?;
        debug!(?launchpool, "Parsed Launchpool");
        Ok(parsed)
    }

    pub async fn fetch_stake_position(&self, stake_position: &Pubkey) -> AnyResult<StakePosition> {
        let account = self.rpc_client.get_account(stake_position).await?;
        if account.owner != LAUNCHPOOL_ID {
            return Err(ProgramError::IncorrectProgramId.into());
        }
        debug!(?stake_position, "Fetched StakePosition account");
        let parsed = StakePosition::from_bytes(account.data.as_slice())?;
        debug!(?stake_position, "Parsed StakePosition");
        Ok(parsed)
    }
}

#[async_trait]
impl SolanaRpcClient for LaunchpoolSolanaRpcClient {
    fn cached_blockhash(&self) -> &Cache<(), Hash> {
        &self.cached_blockhash
    }

    fn rpc_client(&self) -> &RpcClientNonBlocking {
        &self.rpc_client
    }
}