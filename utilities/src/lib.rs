// math-only
#[cfg(feature = "math")]
pub mod math;

// solana = all кроме math
#[cfg(feature = "solana")]
pub mod system_instructions;

#[cfg(feature = "solana")]
pub mod token_instructions;

#[cfg(feature = "solana")]
pub mod token_accounts_instructions;

#[cfg(feature = "solana")]
pub mod helpers;

#[cfg(feature = "solana")]
pub mod error;

#[cfg(feature = "solana")]
pub mod constants;