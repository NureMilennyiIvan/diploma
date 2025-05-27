use anchor_lang::error_code;

#[error_code(offset = 11000)]
pub enum ErrorCode {
    // LaunchpoolsConfig
    #[msg("The protocol reward share for LaunchpoolsConfig exceeds the maximum allowed value of 10000 basis points (100%).")]
    ConfigRewardShareExceeded,

    #[msg("Duration must be greater than 0.")]
    InvalidDuration,

    #[msg("Minimum position size must be greater than 0.")]
    InvalidMinPositionSize,

    #[msg("Maximum position size must be greater than or equal to minimum.")]
    InvalidMaxPositionSize,
}