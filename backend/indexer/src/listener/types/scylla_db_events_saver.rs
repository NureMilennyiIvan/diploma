use std::marker::PhantomData;
use anyhow::{Result as AnyResult};
use async_trait::async_trait;
use tracing::debug;
use crate::listener::traits::EventsSaver;
use crate::macros::AnchorProgram;
use crate::programs::{LaunchpoolProgram, LiquidityPoolProgram};

pub struct ScyllaDbEventsSaver<T: AnchorProgram + 'static> {
    _phantom_data: PhantomData<T>,
}
impl<T: AnchorProgram + 'static> ScyllaDbEventsSaver<T> {
    pub fn new() -> ScyllaDbEventsSaver<T>{
        Self{
            _phantom_data: PhantomData,
        }
    }
}

#[async_trait]
impl EventsSaver<LiquidityPoolProgram> for ScyllaDbEventsSaver<LiquidityPoolProgram> {
    async fn save_events(&self, signature: String, events: Vec<LiquidityPoolProgram>) -> AnyResult<()> {
        todo!()
    }
}

#[async_trait]
impl EventsSaver<LaunchpoolProgram> for ScyllaDbEventsSaver<LaunchpoolProgram> {
    async fn save_events(&self, signature: String, events: Vec<LaunchpoolProgram>) -> AnyResult<()> {
        todo!()
    }
}

impl<T: AnchorProgram + 'static> Drop for ScyllaDbEventsSaver<T> {
    fn drop(&mut self) {
        debug!("ScyllaDbEventsSaver dropped");
    }
}