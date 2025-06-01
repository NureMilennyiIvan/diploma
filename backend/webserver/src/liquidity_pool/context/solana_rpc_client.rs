use solana_client::nonblocking::rpc_client::RpcClient as RpcClientNonBlocking;
use std::time::Duration;
use moka::future::Cache;
use solana_sdk::commitment_config::{CommitmentConfig, CommitmentLevel};
use solana_sdk::hash::Hash;
use solana_sdk::pubkey::Pubkey;
use liquidity_pool::accounts::{AmmsConfig, AmmsConfigsManager, CpAmm};
use anyhow::Result as AnyResult;
use async_trait::async_trait;
use solana_sdk::program_error::ProgramError;
use liquidity_pool::programs::LIQUIDITY_POOL_ID;
use crate::utils::clients::SolanaRpcClient;

pub struct LiquidityPoolSolanaRpcClient {
    cached_blockhash: Cache<(), Hash>,
    rpc_client: RpcClientNonBlocking
}

impl LiquidityPoolSolanaRpcClient {
    pub fn new(rpc_url: String, blockhash_lifetime_secs: u64, commitment_level: CommitmentLevel) -> Self {
        Self {
            cached_blockhash: Cache::builder()
                .time_to_live(Duration::from_secs(blockhash_lifetime_secs))
                .max_capacity(1)
                .build(),
            rpc_client: RpcClientNonBlocking::new_with_commitment(rpc_url,   CommitmentConfig { commitment: commitment_level, })
        }
    }
    pub async fn fetch_amms_configs_manager(
        &self,
        amms_configs_manager: &Pubkey,
    ) -> AnyResult<AmmsConfigsManager> {
        let account = self.rpc_client.get_account(amms_configs_manager).await?;
        if account.owner != LIQUIDITY_POOL_ID {
            return Err(ProgramError::IncorrectProgramId.into());
        }
        let result = AmmsConfigsManager::from_bytes(account.data.as_slice())?;
        Ok(result)
    }

    pub async fn fetch_amms_config(&self, amms_config: &Pubkey) -> AnyResult<AmmsConfig> {
        let account = self.rpc_client.get_account(amms_config).await?;
        if account.owner != LIQUIDITY_POOL_ID {
            return Err(ProgramError::IncorrectProgramId.into());
        }
        let result = AmmsConfig::from_bytes(account.data.as_slice())?;
        Ok(result)
    }

    pub async fn fetch_cp_amm(&self, cp_amm: &Pubkey) -> AnyResult<CpAmm> {
        let account = self.rpc_client().get_account(cp_amm).await?;
        if account.owner != LIQUIDITY_POOL_ID {
            return Err(ProgramError::IncorrectProgramId.into());
        }
        let result = CpAmm::from_bytes(account.data.as_slice())?;
        Ok(result)
    }
}

#[async_trait]
impl SolanaRpcClient for LiquidityPoolSolanaRpcClient {
    fn cached_blockhash(&self) -> &Cache<(), Hash> {
        &self.cached_blockhash
    }

    fn rpc_client(&self) -> &RpcClientNonBlocking {
        &self.rpc_client
    }
}