use async_trait::async_trait;
use anyhow::{Result as AnyResult};
use crate::macros::AnchorProgram;

#[async_trait]
pub trait EventsSaver<T: AnchorProgram + 'static>: Send + Sync {
    async fn save_events(&self, signature: String, events: Vec<T>) -> AnyResult<()>{
        for event in events {
            self.save_event(&signature, event).await?;
        }
        Ok(())
    }
    async fn save_event(&self, signature: &String, event: T) -> AnyResult<()>;
}