use std::fmt::{Display, Formatter, Result as FmtResult};
use anchor_lang::prelude::*;

#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, InitSpace, Clone, Copy, PartialEq, Eq, Debug)]
pub enum LaunchpoolStatus {
    Uninitialized = 0,
    Initialized = 1,
    Launched = 2,
    Finished = 3,
    ClaimedProtocolReward = 4
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