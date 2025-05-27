use anchor_lang::prelude::*;

#[error_code(offset = 12000)]
pub enum LaunchpoolError {
    #[msg("Invalid initial reward amount provided during initialization.")]
    InvalidInitialRewardAmount,

    #[msg("Launchpool is already initialized.")]
    LaunchpoolAlreadyInitialized,

    #[msg("Launchpool must be in 'Launched' status.")]
    LaunchpoolNotLaunched,

    #[msg("Launchpool has not started yet.")]
    LaunchpoolNotStartedYet,

    #[msg("Launchpool has already ended.")]
    LaunchpoolAlreadyEnded,

    #[msg("Launchpool has not ended yet.")]
    LaunchpoolNotEndedYet,

    #[msg("Launchpool is not finished yet.")]
    LaunchpoolNotFinished,

    #[msg("Launchpool is not initialized.")]
    LaunchpoolNotInitialized,

    #[msg("Provided start time is in the past.")]
    StartTimeInPast,

    #[msg("Overflow occurred when calculating end time.")]
    EndTimeOverflow,

    #[msg("Effective time is before the last update timestamp.")]
    EffectiveTimeBeforeLastAccrual,

    #[msg("Overflow occurred during reward calculation.")]
    RewardCalculationOverflow,

    #[msg("Division by zero during reward calculation.")]
    DivisionByZeroDuringRewardCalculation,

    #[msg("Overflow occurred while calculating reward rate.")]
    RewardRateOverflow,

    #[msg("Overflow occurred while updating reward per token.")]
    RewardPerTokenOverflow,

    #[msg("Overflow occurred while updating staked amount.")]
    StakedAmountOverflow,

    #[msg("Overflow occurred while distributing rewards.")]
    RewardDistributionOverflow,

    #[msg("Overflow occurred while redeeming participant rewards.")]
    RewardObtentionOverflow,
}