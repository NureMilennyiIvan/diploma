use std::sync::atomic::{AtomicBool, Ordering};
use tokio::sync::watch;
use tokio::sync::watch::{error, Receiver, Sender};
pub(crate) struct ShutdownSignal {
    sender: Sender<()>,
    receiver: Receiver<()>,
    is_running: AtomicBool,
}

impl ShutdownSignal {
    pub(crate) fn new() -> ShutdownSignal {
        let (sender, receiver) = watch::channel(());
        Self {
            sender,
            receiver,
            is_running: AtomicBool::new(false),
        }
    }
    pub(crate) fn send_shutdown_signal(&self) -> Result<(), error::SendError<()>> {
        self.sender.send(())
    }
    pub(crate) fn subscribe(&self) -> Receiver<()> {
        self.receiver.clone()
    }
    pub(crate) fn is_running(&self) -> bool {
        self.is_running.load(Ordering::Relaxed)
    }
    pub(crate) fn set_is_running(&self, is_running: bool) {
        self.is_running.store(is_running, Ordering::SeqCst);
    }
}