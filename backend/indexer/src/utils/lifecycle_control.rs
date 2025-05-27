use tokio::sync::watch::Receiver;
use crate::utils::ShutdownSignal;
use anyhow::{Result as AnyResult, anyhow};

pub trait LifecycleControl<'a> {
    fn shutdown_signal(&'a self) -> &'a ShutdownSignal;

    #[cfg(test)]
    fn is_active(&'a self) -> bool {
        self.shutdown_handler().is_running()
    }

    fn shutdown_instance(&'a self) -> AnyResult<()> {
        let shutdown_signal = self.shutdown_signal();
        shutdown_signal.send_shutdown_signal()?;
        shutdown_signal.set_is_running(false);
        Ok(())
    }

    fn try_start_instance(&'a self) -> AnyResult<Receiver<()>> {
        let shutdown_signal = self.shutdown_signal();
        if shutdown_signal.is_running() {
            return Err(anyhow!("Instance is already started!"));
        }
        shutdown_signal.set_is_running(true);
        Ok(shutdown_signal.subscribe())
    }
}