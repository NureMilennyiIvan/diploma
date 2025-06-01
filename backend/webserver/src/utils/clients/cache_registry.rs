use std::any::Any;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use moka::future::{Cache, CacheBuilder};
use anyhow::Result as AnyResult;

pub struct CacheRegistry {
    caches: HashMap<&'static str, Arc<dyn Any + Send + Sync>>,
}

impl CacheRegistry {
    pub fn new() -> Self {
        Self {
            caches: HashMap::new(),
        }
    }

    pub fn register<K, V>(&mut self, name: &'static str, initial_capacity: usize, max_capacity: u64, ttl_secs: u64, tti_secs: u64)
    where
        K: std::hash::Hash + Eq + Clone + Send + Sync + 'static,
        V: Clone + Send + Sync + 'static,
    {
        self.caches.insert(name, Arc::new(
            CacheBuilder::<K, V, Cache<K, V>>::new(max_capacity)
                .name(name)
                .initial_capacity(initial_capacity)
                .max_capacity(max_capacity)
                .time_to_idle(Duration::from_secs(tti_secs))
                .time_to_live(Duration::from_secs(ttl_secs))
                .build()
        ));
    }

    pub fn get<K, V>(&self, name: &str) -> Option<Arc<Cache<K, V>>>
    where
        K: std::hash::Hash + Eq + Clone + Send + Sync + 'static,
        V: Clone + Send + Sync + 'static,
    {
        self.caches.get(name)?.clone().downcast::<Cache<K, V>>().ok()
    }

    pub async fn get_or_fetch_from_cache<K, V, F, Fut>(
        &self,
        cache_name: &str,
        key: &K,
        fetch_fn: F,
    ) -> AnyResult<V>
    where
        K: Clone + Eq + std::hash::Hash + Send + Sync + 'static,
        V: Clone + Send + Sync + 'static,
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = AnyResult<V>>,
    {
        let cache = self
            .get::<K, V>(cache_name)
            .unwrap_or_else(|| panic!("{} must be registered", cache_name));

        if let Some(value) = cache.get(key).await {
            return Ok(value);
        }

        let fetched = fetch_fn().await?;
        cache.insert(key.clone(), fetched.clone()).await;
        Ok(fetched)
    }
}