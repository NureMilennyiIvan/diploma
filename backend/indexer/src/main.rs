use std::env;
use std::str::FromStr;
use std::sync::Arc;
use anyhow::{Result as AnyResult};
use scylla::client::session::Session;
use scylla::client::session_builder::SessionBuilder;
use solana_sdk::commitment_config::CommitmentLevel;
use tokio::signal::unix::{signal, SignalKind};
use tracing::{debug, info};
use crate::listener::configs::SolanaTransactionsListenerConfig;
use crate::listener::SolanaTransactionsListener;
use crate::listener::types::{ScyllaDbEventsSaver, TransactionHandler, TransactionProcessor};
use crate::macros::AnchorProgram;
use crate::programs::{LaunchpoolProgram, LiquidityPoolProgram};
use crate::utils::LifecycleControl;

mod macros;
mod programs;
mod listener;
mod utils;

#[tokio::main]
async fn main() -> AnyResult<()> {
    dotenv::dotenv().ok();
    tracing_subscriber::fmt::init();
    let scylla_uri = env::var("SCYLLA_URI").expect("SCYLLA_URI must be set");
    let liquidity_pool_scylla_session: Session = SessionBuilder::new()
        .known_node(
            &scylla_uri
        )
        .use_keyspace(
            env::var("LIQUIDITY_POOL_KEYSPACE").expect("LIQUIDITY_POOL_KEYSPACE must be set"),
            false
        )
        .build()
        .await?;
    let launchpool_scylla_session: Session = SessionBuilder::new()
        .known_node(
            scylla_uri
        )
        .use_keyspace(
            env::var("LAUNCHPOOL_KEYSPACE").expect("LAUNCHPOOL_KEYSPACE must be set"),
            false
        )
        .build()
        .await?;

    let liquidity_pool_listener_config = SolanaTransactionsListenerConfig::new(
        env::var("LIQUIDITY_POOL_PROGRAM_WSS_ENDPOINT").expect("LIQUIDITY_POOL_PROGRAM_WSS_ENDPOINT must be set"),
        LiquidityPoolProgram::PUBKEY.to_string(),
        CommitmentLevel::from_str(
            env::var("LIQUIDITY_POOL_PROGRAM_WS_COMMITMENT_LEVEL")
                .expect("LIQUIDITY_POOL_PROGRAM_WS_COMMITMENT_LEVEL must be set")
                .as_str(),
        ).expect("LIQUIDITY_POOL_PROGRAM_WS_COMMITMENT_LEVEL must be valid variant"),
    );
    let launchpool_listener_config = SolanaTransactionsListenerConfig::new(
        env::var("LAUNCHPOOL_PROGRAM_WSS_ENDPOINT").expect("LAUNCHPOOL_PROGRAM_WSS_ENDPOINT must be set"),
        LaunchpoolProgram::PUBKEY.to_string(),
        CommitmentLevel::from_str(
            env::var("LAUNCHPOOL_PROGRAM_WS_COMMITMENT_LEVEL")
                .expect("LAUNCHPOOL_PROGRAM_WS_COMMITMENT_LEVEL must be set")
                .as_str(),
        ).expect("LAUNCHPOOL_PROGRAM_WS_COMMITMENT_LEVEL must be valid variant"),
    );

    let liquidity_pool_transaction_handler: TransactionHandler<LiquidityPoolProgram> = TransactionHandler::new(
        TransactionProcessor::new(),
        Box::new(ScyllaDbEventsSaver::new(liquidity_pool_scylla_session)),
    );
    let launchpool_transaction_handler: TransactionHandler<LaunchpoolProgram> = TransactionHandler::new(
        TransactionProcessor::new(),
        Box::new(ScyllaDbEventsSaver::new(launchpool_scylla_session)),
    );

    let liquidity_pool_listener = Arc::new(SolanaTransactionsListener::new(liquidity_pool_listener_config, liquidity_pool_transaction_handler));
    let launchpool_listener = Arc::new(SolanaTransactionsListener::new(launchpool_listener_config, launchpool_transaction_handler));

    let liquidity_pool_listener_shutdown_ref = liquidity_pool_listener.clone();
    let launchpool_listener_shutdown_ref = launchpool_listener.clone();

    let liquidity_pool_listener_handle = tokio::spawn(async move {
        liquidity_pool_listener
            .start()
            .await
            .expect("Liquidity pool listener panicked");
    });
    let launchpool_listener_handle = tokio::spawn(async move {
        launchpool_listener
            .start()
            .await
            .expect("Launchpool listener panicked");
    });

    let shutdown_handle = tokio::spawn(async move {
        let mut sigterm =
            signal(SignalKind::terminate()).expect("Could not register SIGTERM handler");
        let mut sigint =
            signal(SignalKind::interrupt()).expect("Could not register SIGINT handler");

        info!("Setting shutdown handler - Waiting for interrupt...");
        tokio::select! {
            _ = sigint.recv() => {
                debug!("Received SIGINT");
            }
            _ = sigterm.recv() => {
                debug!("Received SIGTERM");
            }
        }

        info!("Initiating shutdown...");

        liquidity_pool_listener_shutdown_ref
            .shutdown_instance()
            .expect("Liquidity pool listener shutdown panicked");
        let _ = liquidity_pool_listener_handle.await;

        launchpool_listener_shutdown_ref
            .shutdown_instance()
            .expect("Launchpool listener shutdown panicked");
        let _ = launchpool_listener_handle.await;

        drop(liquidity_pool_listener_shutdown_ref);
        drop(launchpool_listener_shutdown_ref);

        info!("Shutdown complete");
        std::process::exit(0);
    });
    shutdown_handle.await?;
    Ok(())
}