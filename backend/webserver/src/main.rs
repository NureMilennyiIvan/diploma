use crate::init::{
    create_launchpool_cache_registry, create_liquidity_pool_cache_registry, init_dotenv,
};
use crate::launchpool::api::app::{LaunchpoolApp, LaunchpoolRoutes};
use crate::launchpool::context::{
    LaunchpoolContext, LaunchpoolScyllaDbClient, LaunchpoolSolanaRpcClient,
};
use crate::liquidity_pool::api::app::{LiquidityPoolApp, LiquidityPoolRoutes};
use crate::liquidity_pool::context::{
    LiquidityPoolContext, LiquidityPoolScyllaDbClient, LiquidityPoolSolanaRpcClient,
};
use crate::utils::clients::CacheRegistry;
use anyhow::Result as AnyResult;
use scylla::client::session::Session;
use scylla::client::session_builder::SessionBuilder;
use solana_sdk::commitment_config::CommitmentLevel;
use std::env;
use std::net::{IpAddr, SocketAddr};
use std::str::FromStr;
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::try_join;
use tracing::info;

mod init;
mod launchpool;
mod liquidity_pool;
mod utils;

#[tokio::main]
async fn main() -> AnyResult<()> {
    tracing_subscriber::fmt::init();
    init_dotenv();

    let launchpool_server_addr = SocketAddr::new(
        env::var("LAUNCHPOOL_SERVER_HOST")?.parse::<IpAddr>()?,
        env::var("LAUNCHPOOL_SERVER_PORT")?.parse::<u16>()?,
    );
    let liquidity_pool_server_addr = SocketAddr::new(
        env::var("LIQUIDITY_POOL_SERVER_HOST")?.parse::<IpAddr>()?,
        env::var("LIQUIDITY_POOL_SERVER_PORT")?.parse::<u16>()?,
    );
    let launchpool_routes = LaunchpoolRoutes::new(
        env::var("LAUNCHPOOL_SCOPE").expect("LAUNCHPOOL_SCOPE must be set"),
        env::var("INIT_LAUNCHPOOL_CONFIGS_MANAGER")
            .expect("INIT_LAUNCHPOOL_CONFIGS_MANAGER must be set"),
        env::var("UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_AUTHORITY")
            .expect("UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_AUTHORITY must be set"),
        env::var("UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_HEAD_AUTHORITY")
            .expect("UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_HEAD_AUTHORITY must be set"),
        env::var("INIT_LAUNCHPOOLS_CONFIG").expect("INIT_LAUNCHPOOLS_CONFIG must be set"),
        env::var("UPDATE_LAUNCHPOOLS_CONFIG_REWARD_AUTHORITY")
            .expect("UPDATE_LAUNCHPOOLS_CONFIG_REWARD_AUTHORITY must be set"),
        env::var("UPDATE_LAUNCHPOOLS_CONFIG_PROTOCOL_REWARD_SHARE")
            .expect("UPDATE_LAUNCHPOOLS_CONFIG_PROTOCOL_REWARD_SHARE must be set"),
        env::var("UPDATE_LAUNCHPOOLS_CONFIG_DURATION")
            .expect("UPDATE_LAUNCHPOOLS_CONFIG_DURATION must be set"),
        env::var("UPDATE_LAUNCHPOOLS_CONFIG_POSITION_SIZES")
            .expect("UPDATE_LAUNCHPOOLS_CONFIG_POSITION_SIZES must be set"),
        env::var("INIT_LAUNCHPOOL").expect("INIT_LAUNCHPOOL must be set"),
        env::var("LAUNCH_LAUNCHPOOL").expect("LAUNCH_LAUNCHPOOL must be set"),
        env::var("OPEN_STAKE_POSITION").expect("OPEN_STAKE_POSITION must be set"),
        env::var("INCREASE_STAKE_POSITION").expect("INCREASE_STAKE_POSITION must be set"),
        env::var("CLOSE_STAKE_POSITION").expect("CLOSE_STAKE_POSITION must be set"),
        env::var("COLLECT_PROTOCOL_REWARD").expect("COLLECT_PROTOCOL_REWARD must be set"),
    );

    let liquidity_pool_routes = LiquidityPoolRoutes::new(
        env::var("LIQUIDITY_POOL_SCOPE").expect("LIQUIDITY_POOL_SCOPE must be set"),
        env::var("INIT_AMMS_CONFIGS_MANAGER").expect("INIT_AMMS_CONFIGS_MANAGER must be set"),
        env::var("UPDATE_AMMS_CONFIGS_MANAGER_AUTHORITY")
            .expect("UPDATE_AMMS_CONFIGS_MANAGER_AUTHORITY must be set"),
        env::var("UPDATE_AMMS_CONFIGS_MANAGER_HEAD_AUTHORITY")
            .expect("UPDATE_AMMS_CONFIGS_MANAGER_HEAD_AUTHORITY must be set"),
        env::var("INIT_AMMS_CONFIG").expect("INIT_AMMS_CONFIG must be set"),
        env::var("UPDATE_AMMS_CONFIG_FEE_AUTHORITY")
            .expect("UPDATE_AMMS_CONFIG_FEE_AUTHORITY must be set"),
        env::var("UPDATE_AMMS_CONFIG_PROTOCOL_FEE_RATE")
            .expect("UPDATE_AMMS_CONFIG_PROTOCOL_FEE_RATE must be set"),
        env::var("UPDATE_AMMS_CONFIG_PROVIDERS_FEE_RATE")
            .expect("UPDATE_AMMS_CONFIG_PROVIDERS_FEE_RATE must be set"),
        env::var("INIT_CP_AMM").expect("INIT_CP_AMM must be set"),
        env::var("LAUNCH_CP_AMM").expect("LAUNCH_CP_AMM must be set"),
        env::var("PROVIDE_TO_CP_AMM").expect("PROVIDE_TO_CP_AMM must be set"),
        env::var("WITHDRAW_FROM_CP_AMM").expect("WITHDRAW_FROM_CP_AMM must be set"),
        env::var("SWAP_IN_CP_AMM").expect("SWAP_IN_CP_AMM must be set"),
        env::var("COLLECT_FEES_FROM_CP_AMM").expect("COLLECT_FEES_FROM_CP_AMM must be set"),
    );

    let liquidity_pool_solana_rpc_client = Arc::new(LiquidityPoolSolanaRpcClient::new(
        env::var("LIQUIDITY_POOL_PROGRAM_SOLANA_RPC_ENDPOINT")
            .expect("LIQUIDITY_POOL_PROGRAM_SOLANA_RPC_ENDPOINT must be set"),
        env::var("LIQUIDITY_POOL_PROGRAM_BLOCKHASH_LIFETIME_SECS")
            .expect("LIQUIDITY_POOL_PROGRAM_BLOCKHASH_LIFETIME_SECS must be set")
            .parse()?,
        CommitmentLevel::from_str(
            env::var("LIQUIDITY_POOL_PROGRAM_RPC_COMMITMENT_LEVEL")
                .expect("LIQUIDITY_POOL_PROGRAM_RPC_COMMITMENT_LEVEL must be set")
                .as_str(),
        )
        .expect("LIQUIDITY_POOL_PROGRAM_RPC_COMMITMENT_LEVEL must be valid variant"),
    ));

    info!("Created Liquidity Pool Solana RPC client");

    let launchpool_solana_rpc_client = Arc::new(LaunchpoolSolanaRpcClient::new(
        env::var("LAUNCHPOOL_PROGRAM_SOLANA_RPC_ENDPOINT")
            .expect("LAUNCHPOOL_PROGRAM_SOLANA_RPC_ENDPOINT must be set"),
        env::var("LAUNCHPOOL_PROGRAM_BLOCKHASH_LIFETIME_SECS")
            .expect("LAUNCHPOOL_PROGRAM_BLOCKHASH_LIFETIME_SECS must be set")
            .parse()?,
        CommitmentLevel::from_str(
            env::var("LAUNCHPOOL_PROGRAM_RPC_COMMITMENT_LEVEL")
                .expect("LAUNCHPOOL_PROGRAM_RPC_COMMITMENT_LEVEL must be set")
                .as_str(),
        )
        .expect("LAUNCHPOOL_PROGRAM_RPC_COMMITMENT_LEVEL must be valid variant"),
    ));

    info!("Created Launchpool Solana RPC client");
    let liquidity_pool_cache_registry = Arc::new(create_liquidity_pool_cache_registry());
    let launchpool_cache_registry = Arc::new(create_launchpool_cache_registry());
    let scylla_uri = env::var("SCYLLA_URI").expect("SCYLLA_URI must be set");
    let liquidity_pool_scylla_session = Arc::new(LiquidityPoolScyllaDbClient::new(
        SessionBuilder::new()
            .known_node(&scylla_uri)
            .use_keyspace(
                env::var("LIQUIDITY_POOL_KEYSPACE").expect("LIQUIDITY_POOL_KEYSPACE must be set"),
                false,
            )
            .build()
            .await?,
    ));

    info!("Started Liquidity Pool Scylla DB session");

    let launchpool_scylla_session = Arc::new(LaunchpoolScyllaDbClient::new(
        SessionBuilder::new()
            .known_node(scylla_uri)
            .use_keyspace(
                env::var("LAUNCHPOOL_KEYSPACE").expect("LAUNCHPOOL_KEYSPACE must be set"),
                false,
            )
            .build()
            .await?,
    ));

    info!("Started Launchpool Scylla DB session");

    let liquidity_pool_app = LiquidityPoolApp::new(
        Arc::new(LiquidityPoolContext::new(
            liquidity_pool_solana_rpc_client,
            liquidity_pool_scylla_session,
            liquidity_pool_cache_registry,
        )),
        liquidity_pool_routes,
    );
    let launchpool_app = LaunchpoolApp::new(
        Arc::new(LaunchpoolContext::new(
            launchpool_solana_rpc_client,
            launchpool_scylla_session,
            launchpool_cache_registry,
        )),
        launchpool_routes,
    );

    let launchpool_server = axum::serve(
        TcpListener::bind(launchpool_server_addr).await?,
        launchpool_app.into_make_service(),
    );
    info!("Launchpool server running on {}", launchpool_server_addr);
    let liquidity_pool_server = axum::serve(
        TcpListener::bind(liquidity_pool_server_addr).await?,
        liquidity_pool_app.into_make_service(),
    );
    info!(
        "Liquidity Pool server running on {}",
        liquidity_pool_server_addr
    );

    info!("Launchpool server starting on {}", launchpool_server_addr);
    info!(
        "Liquidity Pool server starting on {}",
        liquidity_pool_server_addr
    );

    try_join!(launchpool_server, liquidity_pool_server)?;

    Ok(())
}
