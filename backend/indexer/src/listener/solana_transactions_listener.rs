use crate::listener::configs::SolanaTransactionsListenerConfig;
use crate::listener::types::{TransactionHandler};
use crate::macros::AnchorProgram;
use crate::utils::{LifecycleControl, ShutdownSignal};
use anyhow::{anyhow, Result as AnyResult};
use futures::future::BoxFuture;
use futures::stream::BoxStream;
use futures::StreamExt;
use solana_client::{
    nonblocking::pubsub_client::PubsubClient as PubsubClientNonBlocking,
    rpc_response::{Response, RpcLogsResponse},
};
use std::ops::Deref;
use std::sync::Arc;
use tracing::{debug, error, info, warn};

pub struct SolanaTransactionsListener<T: AnchorProgram + 'static> {
    config: SolanaTransactionsListenerConfig,
    transaction_handler: Arc<TransactionHandler<T>>,
    shutdown_signal: ShutdownSignal,
}
impl<T: AnchorProgram + 'static> SolanaTransactionsListener<T> {
    pub fn new(
        config: SolanaTransactionsListenerConfig,
        transaction_handler: TransactionHandler<T>,
    ) -> Self {
        Self {
            config,
            transaction_handler: Arc::new(transaction_handler),
            shutdown_signal: ShutdownSignal::new(),
        }
    }
    pub async fn get_websocket_client(&self) -> AnyResult<PubsubClientNonBlocking> {
        match PubsubClientNonBlocking::new(&self.ws_url()).await {
            Ok(ws_client) => {
                info!("WebSocket client initialized successfully.");
                Ok(ws_client)
            }
            Err(e) => {
                error!(
                    "Failed to initialize WebSocket client for {}: {:?}",
                    self.ws_url(),
                    e
                );
                Err(anyhow!(e))
            }
        }
    }

    pub async fn get_websocket_subscription<'a>(
        &'a self,
        websocket_client: &'a PubsubClientNonBlocking,
    ) -> AnyResult<(
        BoxStream<'a, Response<RpcLogsResponse>>,
        Box<dyn FnOnce() -> BoxFuture<'static, ()> + Send>,
    )> {
        match websocket_client
            .logs_subscribe(self.rpc_filter().clone(), self.rpc_config().clone())
            .await
        {
            Ok(subscription) => {
                info!("Subscription to {} established.", self.ws_url());
                Ok(subscription)
            }
            Err(e) => {
                error!("Failed to subscribe to websocket: {}", e);
                Err(anyhow!(e))
            }
        }
    }

    pub async fn spawn_processing_task(&self, rpc_logs_response: RpcLogsResponse) -> AnyResult<()> {
        let transaction_handler = self.transaction_handler.clone();
        tokio::spawn(async move {
            match transaction_handler.handle_rpc_logs_response(rpc_logs_response).await {
                Ok(_) => {
                }
                Err(error) => {
                    error!("handle_rpc_logs_response failed: {:?}", error);
                }
            };
        });
        Ok(())
    }

    pub async fn start(&self) -> AnyResult<()> {
        let pubkey_string = T::PUBKEY.to_string();

        info!("Starting SolanaTransactionsListener for {}...", pubkey_string);
        let mut shutdown_receiver = self.try_start_instance()?;

        info!(
            "Attempting to subscribe to {} for {} account logs with commitment {:?}",
            self.ws_url(),
            pubkey_string,
            self.rpc_config().commitment
        );

        let websocket_client = self.get_websocket_client().await?;
        let (mut subscription, unsubscribe_fn) =
            self.get_websocket_subscription(&websocket_client).await?;

        loop {
            tokio::select! {
                biased;
                option_rpc_logs_response = subscription.next() => {
                    match option_rpc_logs_response {
                        Some(rpc_logs_response) => {
                            self.spawn_processing_task(rpc_logs_response.value).await?;
                        },
                        None => {
                            warn!("SolanaTransactionsListener for {} connection closed", pubkey_string);
                            break;
                        }
                    }
                },
                _ = shutdown_receiver.changed() => {
                    info!("Stopping data receiving in SolanaTransactionsListener for {}", pubkey_string);
                    break;
                }
            }
        }
        unsubscribe_fn().await;
        info!("Logs subscription cancelled");
        info!("Shutting down SolanaTransactionsListener for {}", pubkey_string);
        info!("Logs stream closed");
        Ok(())
    }
}

impl<'a, T: AnchorProgram + 'static> LifecycleControl<'a> for SolanaTransactionsListener<T> {
    fn shutdown_signal(&'a self) -> &'a ShutdownSignal {
        &self.shutdown_signal
    }
}

impl<T: AnchorProgram + 'static> Deref for SolanaTransactionsListener<T> {
    type Target = SolanaTransactionsListenerConfig;

    fn deref(&self) -> &Self::Target {
        &self.config
    }
}

impl<T: AnchorProgram + 'static> Drop for SolanaTransactionsListener<T> {
    fn drop(&mut self) {
        debug!("SolanaTransactionsListener dropped");
    }
}