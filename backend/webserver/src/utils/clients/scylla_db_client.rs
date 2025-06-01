use scylla::client::session::Session;

pub trait ScyllaDbClient: Send + Sync {
   fn session(&self) -> &Session;
}
