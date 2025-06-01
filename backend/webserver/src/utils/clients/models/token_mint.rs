use std::ops::Deref;
use solana_sdk::account::Account;
use solana_sdk::program_error::ProgramError;
use solana_sdk::program_pack::Pack;
use solana_sdk::pubkey::Pubkey;
use spl_token::state::Mint;
use crate::utils::constants::{TOKEN_PROGRAM, TOKEN_PROGRAM_2022};

pub struct TokenMint{
    mint: Mint,
    program: Pubkey
}

impl TryFrom<Account> for TokenMint {
    type Error = ProgramError;

    fn try_from(value: Account) -> Result<Self, Self::Error> {
        let Account {mut data, owner, ..} = value;
        if owner != TOKEN_PROGRAM_2022 && owner != TOKEN_PROGRAM{
            return Err(ProgramError::IncorrectProgramId);
        }
        let mint_data = data.get(..Mint::LEN).ok_or_else(|| ProgramError::InvalidAccountData)?;
        let mint = Mint::unpack(&mint_data)?;
        Ok(TokenMint{mint, program: owner})
    }
}
impl Deref for TokenMint {
    type Target = Mint;
    fn deref(&self) -> &Self::Target {
        &self.mint
    }
}
impl TokenMint{
    pub fn program(&self) -> &Pubkey {
        &self.program
    }
}