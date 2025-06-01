use solana_sdk::pubkey::Pubkey;
use launchpool::programs::LAUNCHPOOL_ID;

pub fn get_launchpools_configs_manager_pda() -> (Pubkey, u8){
    let seed = b"launchpools_configs_manager";
    let seeds = &[seed.as_ref()];
    Pubkey::find_program_address(seeds, &LAUNCHPOOL_ID)
}
pub fn get_launchpools_config_pda(id: u64) -> (Pubkey, u8){
    let seed = b"launchpools_config";
    let dynamic_seed: [u8; 8] = u64::to_le_bytes(id);
    let seeds = &[seed.as_ref(), dynamic_seed.as_ref()];
    Pubkey::find_program_address(seeds, &LAUNCHPOOL_ID)
}
pub fn get_launchpool_pda(reward_mint: &Pubkey) -> (Pubkey, u8){
    let seed = b"launchpool";
    let seeds = &[seed.as_ref(), reward_mint.as_ref()];
    Pubkey::find_program_address(seeds, &LAUNCHPOOL_ID)
}
pub fn get_launchpool_vault_pda(launchpool: &Pubkey) -> (Pubkey, u8){
    let seed = b"vault";
    let seeds = &[seed.as_ref(), launchpool.as_ref()];
    Pubkey::find_program_address(seeds, &LAUNCHPOOL_ID)
}
pub fn get_stake_position_pda(owner: &Pubkey, launchpool: &Pubkey) -> (Pubkey, u8){
    let seed = b"stake_position";
    let seeds = &[seed.as_ref(), owner.as_ref(), launchpool.as_ref()];
    Pubkey::find_program_address(seeds, &LAUNCHPOOL_ID)
}
pub fn get_stake_position_vault_pda(stake_position: &Pubkey) -> (Pubkey, u8){
    let seed = b"vault";
    let seeds = &[seed.as_ref(), stake_position.as_ref()];
    Pubkey::find_program_address(seeds, &LAUNCHPOOL_ID)
}