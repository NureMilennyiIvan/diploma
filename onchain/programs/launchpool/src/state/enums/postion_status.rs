use std::fmt::{Display, Formatter, Result as FmtResult};
use anchor_lang::prelude::*;
#[repr(u8)]
#[derive(AnchorSerialize, AnchorDeserialize, InitSpace, Clone, Copy, PartialEq, Eq, Debug)]
pub enum PositionStatus {
    Uninitialized = 0,
    Initialized = 1,
    Opened = 2,
    Closed = 3,
}
impl Display for PositionStatus {
    fn fmt(&self, f: &mut Formatter<'_>) -> FmtResult {
        match self {
            PositionStatus::Uninitialized => write!(f, "Uninitialized"),
            PositionStatus::Initialized => write!(f, "Initialized"),
            PositionStatus::Opened => write!(f, "Opened"),
            PositionStatus::Closed => write!(f, "Closed"),
        }
    }
}
impl Default for PositionStatus {
    fn default() -> Self {
        Self::Uninitialized
    }
}