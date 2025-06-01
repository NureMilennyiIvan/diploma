use std::sync::Arc;
use async_trait::async_trait;
use solana_sdk::pubkey::Pubkey;
use crate::utils::clients::{CacheRegistry, ScyllaDbClient, SolanaRpcClient};
use crate::utils::clients::models::TokenMint;
use anyhow::Result as AnyResult;
use tracing::debug;

#[async_trait]
pub trait ProgramContext<SC: ScyllaDbClient, SO: SolanaRpcClient>: Send + Sync{
    fn scylla_db_client(&self) -> Arc<SC>;
    fn solana_rpc_client(&self) -> Arc<SO>;
    fn cache_registry(&self) -> Arc<CacheRegistry>;
    async fn get_token_mint(&self, token_mint_key: &Pubkey) -> AnyResult<Arc<TokenMint>> {
        debug!(?token_mint_key, "Fetching token mint from cache");
        let result = self.cache_registry()
            .get_or_fetch_from_cache::<Pubkey, Arc<TokenMint>, _, _>(
                "token_mint_cache",
                token_mint_key,
                 || async {
                    debug!(?token_mint_key, "Token mint not in cache — fetching from Solana RPC");
                    self.solana_rpc_client().fetch_token_mint(token_mint_key).await.map(Arc::new)
                },
            )
            .await;

        result
    }
}
/*
mod tests{
    use std::env;
    use std::str::FromStr;
    use std::sync::Arc;
    use async_trait::async_trait;
    use solana_sdk::commitment_config::CommitmentLevel;
    use solana_sdk::pubkey::Pubkey;
    use crate::init::{create_launchpool_cache_registry, init_dotenv};
    use crate::launchpool::context::{LaunchpoolScyllaDbClient, LaunchpoolSolanaRpcClient};
    use crate::utils::clients::{CacheRegistry, ProgramContext};
    use crate::utils::clients::models::TokenMint;

    struct TestContext {
        rpc: Arc<LaunchpoolSolanaRpcClient>,
        registry: CacheRegistry,
    }

    #[async_trait]
    impl ProgramContext<LaunchpoolScyllaDbClient, LaunchpoolSolanaRpcClient> for TestContext {
        fn scylla_db_client(&self) -> Arc<LaunchpoolScyllaDbClient> {
            panic!()
        }

        fn solana_rpc_client(&self) -> Arc<LaunchpoolSolanaRpcClient> {
            self.rpc.clone()
        }

        fn cache_registry(&self) -> &CacheRegistry {
            &self.registry
        }
    }

    #[tokio::test]
    async fn test_get_token_mint_fetches_and_caches() {
        init_dotenv();
/*        let mut registry = CacheRegistry::new();
        registry.register::<Pubkey, Arc<TokenMint>>("token_mint_cache", 10, 10, 60, 30);*/
        let mut registry = create_launchpool_cache_registry();
        let launchpool_solana_rpc_client = Arc::new(LaunchpoolSolanaRpcClient::new(
            env::var("LAUNCHPOOL_PROGRAM_SOLANA_RPC_ENDPOINT")
                .expect("LAUNCHPOOL_PROGRAM_SOLANA_RPC_ENDPOINT must be set"),
            env::var("LAUNCHPOOL_PROGRAM_BLOCKHASH_LIFETIME_SECS")
                .expect("LAUNCHPOOL_PROGRAM_BLOCKHASH_LIFETIME_SECS must be set")
                .parse().expect(""),
            CommitmentLevel::from_str(
                env::var("LAUNCHPOOL_PROGRAM_RPC_COMMITMENT_LEVEL")
                    .expect("LAUNCHPOOL_PROGRAM_RPC_COMMITMENT_LEVEL must be set")
                    .as_str(),
            )
                .expect("LAUNCHPOOL_PROGRAM_RPC_COMMITMENT_LEVEL must be valid variant"),
        ));

        let ctx = TestContext {
            rpc: launchpool_solana_rpc_client,
            registry,
        };

        let pubkey = Pubkey::new_unique();

        let mint = ctx.get_token_mint(&pubkey).await.expect("should work");
        let mint_cached = ctx.get_token_mint(&pubkey).await.expect("should work");
        assert!(Arc::ptr_eq(&mint, &mint_cached));
    }

}*/