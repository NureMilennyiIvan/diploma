use std::sync::Arc;
use moka::future::Cache;
use solana_sdk::hash::Hash;
use anyhow::Result as AnyResult;
use async_trait::async_trait;
use solana_sdk::pubkey::Pubkey;
use solana_client::nonblocking::rpc_client::RpcClient as RpcClientNonBlocking;
use tracing::debug;
use crate::utils::clients::models::TokenMint;

#[async_trait]
pub trait SolanaRpcClient: Send + Sync {
    fn cached_blockhash(&self) -> &Cache<(), Hash>;
    fn rpc_client(&self) -> &RpcClientNonBlocking;
    async fn get_blockhash(&self) -> AnyResult<Hash> {
        if let Some(blockhash) = self.cached_blockhash().get(&()).await {
            return Ok(blockhash);
        }
        let blockhash = self.rpc_client().get_latest_blockhash().await?;
        self.cached_blockhash().insert((), blockhash).await;
        Ok(blockhash)
    }
    async fn fetch_token_mint(&self, mint: &Pubkey) -> AnyResult<TokenMint> {
        let account = self.rpc_client().get_account(mint).await?;
        debug!(?mint, "Fetched token mint");
        let token_mint = TokenMint::try_from(account)?;
        debug!(?mint, "Parsed token mint");
        Ok(token_mint)
    }
}