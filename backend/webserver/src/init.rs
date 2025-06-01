use std::env;
use std::sync::Arc;
use solana_sdk::pubkey::Pubkey;
use launchpool::accounts::{Launchpool, StakePosition};
use liquidity_pool::accounts::{AmmsConfig, CpAmm};
use crate::launchpool::models::{LaunchpoolKeys, LaunchpoolsConfigKeys, StakePositionKeys};
use crate::liquidity_pool::models::CpAmmKeys;
use crate::utils::clients::CacheRegistry;
use crate::utils::clients::models::TokenMint;

pub fn create_liquidity_pool_cache_registry() -> CacheRegistry {
    let mut registry = CacheRegistry::new();

    registry.register::<Pubkey, Arc<CpAmm>>(
        "cp_amm_cache",
        env::var("CP_AMM_CACHE_INITIAL_CAPACITY").unwrap().parse().unwrap(),
        env::var("CP_AMM_CACHE_MAX_CAPACITY").unwrap().parse().unwrap(),
        env::var("CP_AMM_CACHE_TTL_SECS").unwrap().parse().unwrap(),
        env::var("CP_AMM_CACHE_TTI_SECS").unwrap().parse().unwrap(),
    );

    registry.register::<Pubkey, Arc<CpAmmKeys>>(
        "cp_amm_keys_cache",
        env::var("CP_AMM_KEYS_CACHE_INITIAL_CAPACITY").unwrap().parse().unwrap(),
        env::var("CP_AMM_KEYS_CACHE_MAX_CAPACITY").unwrap().parse().unwrap(),
        env::var("CP_AMM_KEYS_CACHE_TTL_SECS").unwrap().parse().unwrap(),
        env::var("CP_AMM_KEYS_CACHE_TTI_SECS").unwrap().parse().unwrap(),
    );

    registry.register::<Pubkey, Arc<TokenMint>>(
        "token_mint_cache",
        env::var("LIQUIDITY_TOKEN_MINT_CACHE_INITIAL_CAPACITY").unwrap().parse().unwrap(),
        env::var("LIQUIDITY_TOKEN_MINT_CACHE_MAX_CAPACITY").unwrap().parse().unwrap(),
        env::var("LIQUIDITY_TOKEN_MINT_CACHE_TTL_SECS").unwrap().parse().unwrap(),
        env::var("LIQUIDITY_TOKEN_MINT_CACHE_TTI_SECS").unwrap().parse().unwrap(),
    );
    registry
}

pub fn create_launchpool_cache_registry() -> CacheRegistry {
    let mut registry = CacheRegistry::new();

    registry.register::<Pubkey, Arc<Launchpool>>(
        "launchpool_cache",
        env::var("LAUNCHPOOL_CACHE_INITIAL_CAPACITY").unwrap().parse().unwrap(),
        env::var("LAUNCHPOOL_CACHE_MAX_CAPACITY").unwrap().parse().unwrap(),
        env::var("LAUNCHPOOL_CACHE_TTL_SECS").unwrap().parse().unwrap(),
        env::var("LAUNCHPOOL_CACHE_TTI_SECS").unwrap().parse().unwrap(),
    );

    registry.register::<Pubkey, Arc<LaunchpoolKeys>>(
        "launchpool_keys_cache",
        env::var("LAUNCHPOOL_KEYS_CACHE_INITIAL_CAPACITY").unwrap().parse().unwrap(),
        env::var("LAUNCHPOOL_KEYS_CACHE_MAX_CAPACITY").unwrap().parse().unwrap(),
        env::var("LAUNCHPOOL_KEYS_CACHE_TTL_SECS").unwrap().parse().unwrap(),
        env::var("LAUNCHPOOL_KEYS_CACHE_TTI_SECS").unwrap().parse().unwrap(),
    );

    registry.register::<Pubkey, Arc<LaunchpoolsConfigKeys>>(
        "launchpools_config_keys_cache",
        env::var("LAUNCHPOOLS_CONFIG_KEYS_CACHE_INITIAL_CAPACITY").unwrap().parse().unwrap(),
        env::var("LAUNCHPOOLS_CONFIG_KEYS_CACHE_MAX_CAPACITY").unwrap().parse().unwrap(),
        env::var("LAUNCHPOOLS_CONFIG_KEYS_CACHE_TTL_SECS").unwrap().parse().unwrap(),
        env::var("LAUNCHPOOLS_CONFIG_KEYS_CACHE_TTI_SECS").unwrap().parse().unwrap(),
    );

    registry.register::<Pubkey, Arc<StakePosition>>(
        "stake_position_cache",
        env::var("STAKE_POSITION_CACHE_INITIAL_CAPACITY").unwrap().parse().unwrap(),
        env::var("STAKE_POSITION_CACHE_MAX_CAPACITY").unwrap().parse().unwrap(),
        env::var("STAKE_POSITION_CACHE_TTL_SECS").unwrap().parse().unwrap(),
        env::var("STAKE_POSITION_CACHE_TTI_SECS").unwrap().parse().unwrap(),
    );

    registry.register::<Pubkey, Arc<StakePositionKeys>>(
        "stake_position_keys_cache",
        env::var("STAKE_POSITION_KEYS_CACHE_INITIAL_CAPACITY").unwrap().parse().unwrap(),
        env::var("STAKE_POSITION_KEYS_CACHE_MAX_CAPACITY").unwrap().parse().unwrap(),
        env::var("STAKE_POSITION_KEYS_CACHE_TTL_SECS").unwrap().parse().unwrap(),
        env::var("STAKE_POSITION_KEYS_CACHE_TTI_SECS").unwrap().parse().unwrap(),
    );

    registry.register::<Pubkey, Arc<TokenMint>>(
        "token_mint_cache",
        env::var("LAUNCHPOOL_TOKEN_MINT_CACHE_INITIAL_CAPACITY").unwrap().parse().unwrap(),
        env::var("LAUNCHPOOL_TOKEN_MINT_CACHE_MAX_CAPACITY").unwrap().parse().unwrap(),
        env::var("LAUNCHPOOL_TOKEN_MINT_CACHE_TTL_SECS").unwrap().parse().unwrap(),
        env::var("LAUNCHPOOL_TOKEN_MINT_CACHE_TTI_SECS").unwrap().parse().unwrap(),
    );

    registry
}
pub fn init_dotenv() {
    dotenv::dotenv().ok();
    let env_scylla_path = env::var("ENV_SCYLLA_PATH").expect("ENV_SCYLLA_PATH must be set");
    dotenv::from_path(&env_scylla_path)
        .unwrap_or_else(|_| panic!("Error loading {} file", env_scylla_path));
    let env_routes_path = env::var("ENV_ROUTES_PATH").expect("ENV_ROUTES_PATH must be set");
    dotenv::from_path(&env_routes_path)
        .unwrap_or_else(|_| panic!("Error loading {} file", env_routes_path));
    let env_cache_path = env::var("ENV_CACHE_PATH").expect("ENV_CACHE_PATH must be set");
    dotenv::from_path(&env_cache_path)
        .unwrap_or_else(|_| panic!("Error loading {} file", env_cache_path));
}