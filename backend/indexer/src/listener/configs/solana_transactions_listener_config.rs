use solana_client::rpc_config::{RpcTransactionLogsConfig, RpcTransactionLogsFilter};
use solana_sdk::commitment_config::{CommitmentConfig, CommitmentLevel};

pub struct SolanaTransactionsListenerConfig {
    ws_url: String,
    rpc_filter: RpcTransactionLogsFilter,
    rpc_config: RpcTransactionLogsConfig
}
impl SolanaTransactionsListenerConfig {
    pub fn new(ws_url: String, program_id: String, commitment_level: CommitmentLevel) -> Self{
        Self{
            ws_url,
            rpc_filter: RpcTransactionLogsFilter::Mentions(vec![program_id]),
            rpc_config: RpcTransactionLogsConfig {
                commitment: Some(CommitmentConfig {
                    commitment: commitment_level,
                }),
            },
        }
    }
    pub fn ws_url(&self) -> &String {
        &self.ws_url
    }
    pub fn rpc_filter(&self) -> &RpcTransactionLogsFilter {
        &self.rpc_filter
    }
    pub fn rpc_config(&self) -> &RpcTransactionLogsConfig {
        &self.rpc_config
    }
}