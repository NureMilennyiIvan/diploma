use std::marker::PhantomData;
use crate::macros::AnchorProgram;
use anyhow::{anyhow, Result as AnyResult};
use base64::{engine::general_purpose::STANDARD as base64, Engine};
use tracing::{debug, error};

pub struct TransactionProcessor<T: AnchorProgram + 'static> {
    _phantom_data: PhantomData<T>,
    find: String
}
impl<T: AnchorProgram + 'static> TransactionProcessor<T> {
    pub fn new() -> Self {
        Self{
            _phantom_data: PhantomData,
            find: format!("Program {} invoke", T::PUBKEY.to_string())
        }
    }

    pub fn process_log(&self, logs: Vec<String>) -> AnyResult<Vec<T>> {
        if logs.is_empty() {
            return Err(anyhow!("Logs are empty"));
        }

        let mut results = Vec::new();
        let mut index = 0;

        while index + 1 < logs.len() {
            if logs[index].starts_with(&self.find) {
                index += 1;
                while index + 1 < logs.len() {
                    if logs[index].starts_with("Event:") && logs[index + 1].starts_with("Program data:") {
                        let base64_data = logs[index + 1]
                            .trim_start_matches("Program data:")
                            .trim();

                        let decoded = match base64.decode(base64_data){
                            Ok(decoded) => decoded,
                            Err(error) => {
                                error!("Failed to decode base64 {}. Error {:?}", base64_data, error);
                                break;
                            }
                        };

                        let parsed = match T::try_deserialize(&decoded){
                            Ok(parsed) => parsed,
                            Err(error) => {
                                error!("Failed to deserialize {:?}. Error {:?}", decoded, error);
                                break;
                            }
                        };
                        results.push(parsed);
                        break;
                    }
                    index += 1;
                }
            } else {
                index += 1;
            }
        }
        Ok(results)
    }
}

impl<T: AnchorProgram + 'static> Drop for TransactionProcessor<T> {
    fn drop(&mut self) {
        debug!("TransactionProcessor dropped");
    }
}