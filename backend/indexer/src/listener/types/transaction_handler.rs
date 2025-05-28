use crate::macros::AnchorProgram;
use anyhow::{Result as AnyResult};
use solana_client::rpc_response::RpcLogsResponse;
use tracing::debug;
use crate::listener::traits::EventsSaver;
use crate::listener::types::TransactionProcessor;

pub struct TransactionHandler<T: AnchorProgram + 'static> {
    transaction_processor: TransactionProcessor<T>,
    scylla_db_events_saver: Box<dyn EventsSaver<T>>
}
impl<T: AnchorProgram + 'static> TransactionHandler<T> {
    pub fn new(transaction_processor: TransactionProcessor<T>, scylla_db_events_saver: Box<dyn EventsSaver<T>>) -> Self {
        Self{
            transaction_processor,
            scylla_db_events_saver
        }
    }
    pub async fn handle_rpc_logs_response(&self, rpc_logs_response: RpcLogsResponse) -> AnyResult<()> {
        let RpcLogsResponse { logs, err, signature } = rpc_logs_response;
        if err.is_some(){
            return Ok(());
        }
        let events = self.transaction_processor.process_log(logs)?;
        self.scylla_db_events_saver.save_events(signature, events).await
    }
}

impl<T: AnchorProgram + 'static> Drop for TransactionHandler<T> {
    fn drop(&mut self) {
        debug!("TransactionHandler dropped");
    }
}