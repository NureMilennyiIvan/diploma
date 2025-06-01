use solana_sdk::pubkey::Pubkey;
use liquidity_pool::programs::LIQUIDITY_POOL_ID;

pub fn get_amms_configs_manager_pda() -> (Pubkey, u8){
    let seed = b"amms_configs_manager";
    let seeds = &[seed.as_ref()];
    Pubkey::find_program_address(seeds, &LIQUIDITY_POOL_ID)
}
pub fn get_amms_config_pda(id: u64) -> (Pubkey, u8){
    let seed = b"amms_config";
    let dynamic_seed: [u8; 8] = u64::to_le_bytes(id);
    let seeds = &[seed.as_ref(), dynamic_seed.as_ref()];
    Pubkey::find_program_address(seeds, &LIQUIDITY_POOL_ID)
}
pub fn get_cp_amm_pda(lp_mint: &Pubkey) -> (Pubkey, u8){
    let seed = b"cp_amm";
    let seeds = &[seed.as_ref(), lp_mint.as_ref()];
    Pubkey::find_program_address(seeds, &LIQUIDITY_POOL_ID)
}
pub fn get_cp_amm_vault_pda(cp_amm: &Pubkey, mint: &Pubkey) -> (Pubkey, u8){
    let seed = b"vault";
    let seeds = &[seed.as_ref(), cp_amm.as_ref(), mint.as_ref()];
    Pubkey::find_program_address(seeds, &LIQUIDITY_POOL_ID)
}