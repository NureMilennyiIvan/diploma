use anchor_lang::prelude::*;

#[error_code]
pub(crate) enum ErrorCode {
    #[msg("Mint has freeze authority.")]
    MintHasFreezeAuthority,

    #[msg("Provided mint owned by unsupported token program.")]
    UnsupportedMint,

    #[msg("Mint has unsupported token extension.")]
    UnsupportedMintTokenExtension,

    #[msg("Mint with TransferFee extension failed to calculate fee")]
    MintTransferFeeCalculationFailed,
    
    #[msg("Insufficient balance in the token account to complete the transfer.")]
    InsufficientBalanceForTransfer,

    #[msg("Mint and Token Program mismatch")]
    MintAndTokenProgramMismatch
}