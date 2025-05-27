use anchor_lang::prelude::*;

#[error_code(offset = 13000)]
pub enum StakePositionError {
    #[msg("Stake position is already initialized.")]
    StakePositionAlreadyInitialized,

    #[msg("Invalid state for opening a stake position.")]
    InvalidStakePositionStateForOpen,

    #[msg("Stake position is not opened.")]
    StakePositionNotOpened,

    #[msg("Launchpool provided does not match the one stored in the position.")]
    MismatchedLaunchpool,

    #[msg("Stake amount must be greater than zero.")]
    StakeAmountIsZero,

    #[msg("Stake amount is below the minimum allowed.")]
    StakeBelowMinimum,

    #[msg("Stake amount exceeds the maximum allowed.")]
    StakeAboveMaximum,

    #[msg("Overflow occurred during reward accumulation.")]
    RewardAccumulationOverflow,

    #[msg("Reward debt is greater than total accrued reward.")]
    RewardDebtExceedsAccrued,

    #[msg("Overflow occurred while adding pending reward.")]
    RewardOverflow,

    #[msg("Overflow occurred while increasing staked amount.")]
    StakeOverflow,

    #[msg("Overflow occurred while calculating reward debt.")]
    RewardDebtCalculationOverflow,
}
