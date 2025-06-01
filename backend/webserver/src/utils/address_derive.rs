use solana_sdk::pubkey::Pubkey;
use crate::utils::constants::{BPF_LOADER_UPGRADABLE_V3, ASSOCIATED_TOKEN_PROGRAM_ID};

pub fn get_ata(owner: &Pubkey, mint: &Pubkey, token_program: &Pubkey) -> (Pubkey, u8){
    let seeds = &[owner.as_ref(), token_program.as_ref(), mint.as_ref()];
    Pubkey::find_program_address(seeds, &ASSOCIATED_TOKEN_PROGRAM_ID)
}
pub fn get_program_data(program: &Pubkey) -> (Pubkey, u8) {
    let seeds = &[program.as_ref()];
    Pubkey::find_program_address(seeds, &BPF_LOADER_UPGRADABLE_V3)
}