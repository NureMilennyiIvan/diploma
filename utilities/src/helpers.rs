use anchor_lang::prelude::*;
use crate::error::ErrorCode;
use anchor_spl::{
    token::{ID as TOKEN_PROGRAM_ID},
    token_2022::{ID as TOKEN_2022_PROGRAM_ID},
    token_interface::Mint
};
use anchor_spl::token_2022::spl_token_2022;
use anchor_spl::token_2022::spl_token_2022::extension::{BaseStateWithExtensions, ExtensionType, StateWithExtensions};

/// A list of allowed token extensions for tradable SPL Token 2022 mints.
pub const ALLOWED_TRADABLE_TOKEN_EXTENSIONS: &[ExtensionType] = &[
    ExtensionType::TransferFeeConfig,
    ExtensionType::ImmutableOwner,
    ExtensionType::TransferHook,
    ExtensionType::MetadataPointer,
    ExtensionType::TokenMetadata,
    ExtensionType::GroupPointer,
    ExtensionType::TokenGroup,
    ExtensionType::GroupMemberPointer,
    ExtensionType::TokenGroupMember
];

/// A list of allowed token extensions for stakable SPL Token 2022 mints.
pub const ALLOWED_STAKABLE_TOKEN_EXTENSIONS: &[ExtensionType] = &[
    ExtensionType::ImmutableOwner,
    ExtensionType::TransferHook,
    ExtensionType::MetadataPointer,
    ExtensionType::TokenMetadata,
    ExtensionType::GroupPointer,
    ExtensionType::TokenGroup,
    ExtensionType::GroupMemberPointer,
    ExtensionType::TokenGroupMember
];

/// Validates a given token mint to ensure it adheres to specific criteria.
///
/// # Parameters
/// - `tradable_mint`: A reference to an `InterfaceAccount<Mint>` representing the token mint to validate.
///
/// # Returns
/// - `Ok(())`: If the token mint passes all validation checks.
/// - `Err(ErrorCode)`: If the token mint fails any validation check.
///
/// # Validation Steps
/// 1. Ensure the mint does not have a freeze authority.
/// 2. Check the owner of the mint account.
///    - If the owner is `TOKEN_PROGRAM_ID`, validation passes.
///    - If the owner is `TOKEN_2022_PROGRAM_ID`, validate against allowed extensions.
/// 3. Reject unsupported owners.
pub fn validate_tradable_mint(tradable_mint: &InterfaceAccount<Mint>) -> Result<()>{
    // Ensure the mint does not have a freeze authority.
    require!(tradable_mint.freeze_authority.is_none(), ErrorCode::MintHasFreezeAuthority);
    
    let mint_account_info = tradable_mint.to_account_info();
    
    // Validate based on the owner of the mint account.
    match mint_account_info.owner.key() {
        TOKEN_2022_PROGRAM_ID => {
            require!(
                StateWithExtensions::<spl_token_2022::state::Mint>::unpack(&mint_account_info.data.borrow())?
                    .get_extension_types()?.iter().all(|x| ALLOWED_TRADABLE_TOKEN_EXTENSIONS.contains(x)),
                ErrorCode::UnsupportedMintTokenExtension
            );
            Ok(())
        },
        TOKEN_PROGRAM_ID => Ok(()),
        _ => Err(ErrorCode::UnsupportedMint.into()),
    }
}

pub fn validate_stakable_mint(stakable_mint: &InterfaceAccount<Mint>) -> Result<()>{
    // Ensure the mint does not have a freeze authority.
    require!(stakable_mint.freeze_authority.is_none(), ErrorCode::MintHasFreezeAuthority);

    let mint_account_info = stakable_mint.to_account_info();

    // Validate based on the owner of the mint account.
    match mint_account_info.owner.key() {
        TOKEN_2022_PROGRAM_ID => {
            require!(
                StateWithExtensions::<spl_token_2022::state::Mint>::unpack(&mint_account_info.data.borrow())?
                    .get_extension_types()?.iter().all(|x| ALLOWED_STAKABLE_TOKEN_EXTENSIONS.contains(x)),
                ErrorCode::UnsupportedMintTokenExtension
            );
            Ok(())
        },
        TOKEN_PROGRAM_ID => Ok(()),
        _ => Err(ErrorCode::UnsupportedMint.into()),
    }
}