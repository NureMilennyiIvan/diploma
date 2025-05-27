use std::fmt::{Display, Formatter, Result as FmtResult};
use anchor_lang::prelude::*;
#[derive(AnchorSerialize, AnchorDeserialize, InitSpace, Clone, Copy, PartialEq, Eq, Debug)]
pub enum LaunchpoolStatus {
    Uninitialized,
    Initialized,
    Launched,
    Finished,
    ClaimedProtocolReward
}
impl Display for LaunchpoolStatus {
    fn fmt(&self, f: &mut Formatter<'_>) -> FmtResult {
        match self {
            LaunchpoolStatus::Uninitialized => write!(f, "Uninitialized"),
            LaunchpoolStatus::Initialized => write!(f, "Initialized"),
            LaunchpoolStatus::Launched => write!(f, "Launched"),
            LaunchpoolStatus::Finished => write!(f, "Finished"),
            LaunchpoolStatus::ClaimedProtocolReward => write!(f, "ClaimedProtocolReward"),
        }
    }
}
impl Default for LaunchpoolStatus {
    fn default() -> Self {
        Self::Uninitialized
    }
}