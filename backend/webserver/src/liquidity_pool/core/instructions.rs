use super::address_derive::{
    get_amms_config_pda, get_amms_configs_manager_pda, get_cp_amm_pda, get_cp_amm_vault_pda,
};
use crate::utils::address_derive::{get_ata, get_program_data};
use crate::utils::constants::{
    ASSOCIATED_TOKEN_PROGRAM_ID, RENT, SYSTEM_PROGRAM_ID, TOKEN_PROGRAM,
};
use liquidity_pool::instructions::{
    CollectFeesFromCpAmmBuilder, InitializeAmmsConfigBuilder, InitializeAmmsConfigsManagerBuilder,
    InitializeCpAmmBuilder, LaunchCpAmmBuilder, ProvideToCpAmmBuilder, SwapInCpAmmBuilder,
    UpdateAmmsConfigFeeAuthorityBuilder, UpdateAmmsConfigProtocolFeeRateBuilder,
    UpdateAmmsConfigProvidersFeeRateBuilder, UpdateAmmsConfigsManagerAuthorityBuilder,
    UpdateAmmsConfigsManagerHeadAuthorityBuilder, WithdrawFromCpAmmBuilder,
};
use liquidity_pool::programs::LIQUIDITY_POOL_ID;
use solana_sdk::instruction::Instruction;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Keypair;
use solana_sdk::signer::Signer;

pub fn initialize_amms_configs_manager_ix(
    signer: Pubkey,
    authority: Pubkey,
    head_authority: Pubkey,
) -> (Instruction, Pubkey) {
    let mut builder = InitializeAmmsConfigsManagerBuilder::new();
    let amms_configs_manager = get_amms_configs_manager_pda().0;
    builder.signer(signer);
    builder.amms_configs_manager(amms_configs_manager.clone());
    builder.authority(authority);
    builder.head_authority(head_authority);
    builder.program_data(get_program_data(&LIQUIDITY_POOL_ID).0);
    builder.liquidity_pool_program(LIQUIDITY_POOL_ID);
    builder.rent(RENT);
    builder.system_program(SYSTEM_PROGRAM_ID);
    (builder.instruction(), amms_configs_manager)
}
pub fn update_amms_configs_manager_authority_ix(
    authority: Pubkey,
    new_authority: Pubkey,
) -> Instruction {
    let mut builder = UpdateAmmsConfigsManagerAuthorityBuilder::new();
    builder.authority(authority);
    builder.amms_configs_manager(get_amms_configs_manager_pda().0);
    builder.new_authority(new_authority);
    builder.instruction()
}
pub fn update_amms_configs_manager_head_authority_ix(
    head_authority: Pubkey,
    new_head_authority: Pubkey,
) -> Instruction {
    let mut builder = UpdateAmmsConfigsManagerHeadAuthorityBuilder::new();
    builder.head_authority(head_authority);
    builder.amms_configs_manager(get_amms_configs_manager_pda().0);
    builder.new_head_authority(new_head_authority);
    builder.instruction()
}
pub fn initialize_amms_config_ix(
    authority: Pubkey,
    id: u64,
    fee_authority: Pubkey,
    protocol_fee_rate_basis_points: u16,
    providers_fee_rate_basis_points: u16,
) -> (Instruction, Pubkey) {
    let mut builder = InitializeAmmsConfigBuilder::new();
    let mut amms_config = get_amms_config_pda(id).0;
    builder.authority(authority);
    builder.amms_configs_manager(get_amms_configs_manager_pda().0);
    builder.amms_config(amms_config.clone());
    builder.fee_authority(fee_authority);
    builder.protocol_fee_rate_basis_points(protocol_fee_rate_basis_points);
    builder.providers_fee_rate_basis_points(providers_fee_rate_basis_points);
    builder.rent(RENT);
    builder.system_program(SYSTEM_PROGRAM_ID);
    (builder.instruction(), amms_config)
}
pub fn update_amms_config_fee_authority_ix(
    authority: Pubkey,
    amms_config: Pubkey,
    new_fee_authority: Pubkey,
) -> Instruction {
    let mut builder = UpdateAmmsConfigFeeAuthorityBuilder::new();
    builder.authority(authority);
    builder.amms_config(amms_config);
    builder.amms_configs_manager(get_amms_configs_manager_pda().0);
    builder.new_fee_authority(new_fee_authority);
    builder.instruction()
}
pub fn update_amms_config_protocol_fee_rate_ix(
    authority: Pubkey,
    amms_config: Pubkey,
    new_protocol_fee_rate_basis_points: u16,
) -> Instruction {
    let mut builder = UpdateAmmsConfigProtocolFeeRateBuilder::new();
    builder.authority(authority);
    builder.amms_config(amms_config);
    builder.amms_configs_manager(get_amms_configs_manager_pda().0);
    builder.new_protocol_fee_rate_basis_points(new_protocol_fee_rate_basis_points);
    builder.instruction()
}
pub fn update_amms_config_providers_fee_rate_ix(
    authority: Pubkey,
    amms_config: Pubkey,
    new_providers_fee_rate_basis_points: u16,
) -> Instruction {
    let mut builder = UpdateAmmsConfigProvidersFeeRateBuilder::new();
    builder.authority(authority);
    builder.amms_config(amms_config);
    builder.amms_configs_manager(get_amms_configs_manager_pda().0);
    builder.new_providers_fee_rate_basis_points(new_providers_fee_rate_basis_points);
    builder.instruction()
}
pub fn initialize_cp_amm_ix(
    signer: Pubkey,
    lp_mint_keypair: &Keypair,
    fee_authority: Pubkey,
    base_mint: Pubkey,
    quote_mint: Pubkey,
    amms_config: Pubkey,
    base_token_program: Pubkey,
    quote_token_program: Pubkey,
) -> (Instruction, Pubkey) {
    let mut builder = InitializeCpAmmBuilder::new();
    let lp_mint_pubkey = lp_mint_keypair.pubkey();
    let cp_amm = get_cp_amm_pda(&lp_mint_pubkey).0;

    builder.signer(signer);
    builder.fee_authority(fee_authority);
    builder.amms_config(amms_config);
    builder.cp_amm_base_vault(get_cp_amm_vault_pda(&cp_amm, &base_mint).0);
    builder.cp_amm_quote_vault(get_cp_amm_vault_pda(&cp_amm, &quote_mint).0);
    builder.cp_amm_locked_lp_vault(get_cp_amm_vault_pda(&cp_amm, &lp_mint_pubkey).0);
    builder.cp_amm(cp_amm.clone());
    builder.base_mint(base_mint);
    builder.quote_mint(quote_mint);
    builder.lp_mint(lp_mint_pubkey);
    builder.rent(RENT);
    builder.system_program(SYSTEM_PROGRAM_ID);
    builder.lp_token_program(TOKEN_PROGRAM);
    builder.base_token_program(base_token_program);
    builder.quote_token_program(quote_token_program);
    (builder.instruction(), cp_amm)
}
pub fn launch_cp_amm_ix(
    creator: Pubkey,
    creator_base_account: Option<Pubkey>,
    creator_quote_account: Option<Pubkey>,
    amms_config: Pubkey,
    cp_amm: Pubkey,
    base_mint: Pubkey,
    quote_mint: Pubkey,
    lp_mint: Pubkey,
    base_token_program: Pubkey,
    quote_token_program: Pubkey,
    lp_token_program: Pubkey,
    base_liquidity: u64,
    quote_liquidity: u64,
) -> Instruction {
    let mut builder = LaunchCpAmmBuilder::new();
    builder.amms_config(amms_config);
    builder.creator_base_account(
        creator_base_account.unwrap_or(get_ata(&creator, &base_mint, &base_token_program).0),
    );
    builder.creator_quote_account(
        creator_quote_account.unwrap_or(get_ata(&creator, &quote_mint, &quote_token_program).0),
    );
    builder.creator_lp_account(get_ata(&creator, &lp_mint, &lp_token_program).0);
    builder.creator(creator);
    builder.cp_amm_base_vault(get_cp_amm_vault_pda(&cp_amm, &base_mint).0);
    builder.cp_amm_quote_vault(get_cp_amm_vault_pda(&cp_amm, &quote_mint).0);
    builder.cp_amm_locked_lp_vault(get_cp_amm_vault_pda(&cp_amm, &lp_mint).0);
    builder.cp_amm(cp_amm);
    builder.base_mint(base_mint);
    builder.quote_mint(quote_mint);
    builder.lp_mint(lp_mint);
    builder.lp_token_program(lp_token_program);
    builder.base_token_program(base_token_program);
    builder.quote_token_program(quote_token_program);
    builder.system_program(SYSTEM_PROGRAM_ID);
    builder.associated_token_program(ASSOCIATED_TOKEN_PROGRAM_ID);
    builder.base_liquidity(base_liquidity);
    builder.quote_liquidity(quote_liquidity);
    builder.instruction()
}

pub fn provide_to_cp_amm_ix(
    signer: Pubkey,
    signer_base_account: Option<Pubkey>,
    signer_quote_account: Option<Pubkey>,
    amms_config: Pubkey,
    cp_amm: Pubkey,
    base_mint: Pubkey,
    quote_mint: Pubkey,
    lp_mint: Pubkey,
    base_token_program: Pubkey,
    quote_token_program: Pubkey,
    lp_token_program: Pubkey,
    base_liquidity: u64,
    quote_liquidity: u64,
) -> Instruction {
    let mut builder = ProvideToCpAmmBuilder::new();
    builder.amms_config(amms_config);
    builder.signer_base_account(
        signer_base_account.unwrap_or(get_ata(&signer, &base_mint, &base_token_program).0),
    );
    builder.signer_quote_account(
        signer_quote_account.unwrap_or(get_ata(&signer, &quote_mint, &quote_token_program).0),
    );
    builder.signer_lp_account(get_ata(&signer, &lp_mint, &lp_token_program).0);
    builder.signer(signer);
    builder.cp_amm_base_vault(get_cp_amm_vault_pda(&cp_amm, &base_mint).0);
    builder.cp_amm_quote_vault(get_cp_amm_vault_pda(&cp_amm, &quote_mint).0);
    builder.cp_amm(cp_amm);
    builder.base_mint(base_mint);
    builder.quote_mint(quote_mint);
    builder.lp_mint(lp_mint);
    builder.lp_token_program(lp_token_program);
    builder.base_token_program(base_token_program);
    builder.quote_token_program(quote_token_program);
    builder.system_program(SYSTEM_PROGRAM_ID);
    builder.associated_token_program(ASSOCIATED_TOKEN_PROGRAM_ID);
    builder.base_liquidity(base_liquidity);
    builder.quote_liquidity(quote_liquidity);
    builder.instruction()
}
pub fn withdraw_from_cp_amm_ix(
    signer: Pubkey,
    signer_lp_account: Option<Pubkey>,
    amms_config: Pubkey,
    cp_amm: Pubkey,
    base_mint: Pubkey,
    quote_mint: Pubkey,
    lp_mint: Pubkey,
    base_token_program: Pubkey,
    quote_token_program: Pubkey,
    lp_token_program: Pubkey,
    lp_tokens: u64,
) -> Instruction {
    let mut builder = WithdrawFromCpAmmBuilder::new();
    builder.amms_config(amms_config);
    builder.signer_base_account(get_ata(&signer, &base_mint, &base_token_program).0);
    builder.signer_quote_account(get_ata(&signer, &quote_mint, &quote_token_program).0);
    builder.signer_lp_account(
        signer_lp_account.unwrap_or(get_ata(&signer, &lp_mint, &lp_token_program).0),
    );
    builder.signer(signer);
    builder.cp_amm_base_vault(get_cp_amm_vault_pda(&cp_amm, &base_mint).0);
    builder.cp_amm_quote_vault(get_cp_amm_vault_pda(&cp_amm, &quote_mint).0);
    builder.cp_amm(cp_amm);
    builder.base_mint(base_mint);
    builder.quote_mint(quote_mint);
    builder.lp_mint(lp_mint);
    builder.lp_token_program(lp_token_program);
    builder.base_token_program(base_token_program);
    builder.quote_token_program(quote_token_program);
    builder.system_program(SYSTEM_PROGRAM_ID);
    builder.associated_token_program(ASSOCIATED_TOKEN_PROGRAM_ID);
    builder.lp_tokens(lp_tokens);
    builder.instruction()
}
pub fn swap_in_cp_amm_ix(
    signer: Pubkey,
    amms_config: Pubkey,
    cp_amm: Pubkey,
    base_mint: Pubkey,
    quote_mint: Pubkey,
    base_token_program: Pubkey,
    quote_token_program: Pubkey,
    swap_amount: u64,
    estimated_result: u64,
    allowed_slippage: u64,
    is_in_out: bool,
) -> Instruction {
    let mut builder = SwapInCpAmmBuilder::new();
    builder.amms_config(amms_config);
    builder.signer_base_account(get_ata(&signer, &base_mint, &base_token_program).0);
    builder.signer_quote_account(get_ata(&signer, &quote_mint, &quote_token_program).0);
    builder.signer(signer);
    builder.cp_amm_base_vault(get_cp_amm_vault_pda(&cp_amm, &base_mint).0);
    builder.cp_amm_quote_vault(get_cp_amm_vault_pda(&cp_amm, &quote_mint).0);
    builder.cp_amm(cp_amm);
    builder.base_mint(base_mint);
    builder.quote_mint(quote_mint);
    builder.base_token_program(base_token_program);
    builder.quote_token_program(quote_token_program);
    builder.system_program(SYSTEM_PROGRAM_ID);
    builder.associated_token_program(ASSOCIATED_TOKEN_PROGRAM_ID);
    builder.swap_amount(swap_amount);
    builder.estimated_result(estimated_result);
    builder.allowed_slippage(allowed_slippage);
    builder.is_in_out(is_in_out);
    builder.instruction()
}
pub fn collect_fees_from_cp_amm_ix(
    signer: Pubkey,
    fee_authority: Pubkey,
    amms_config: Pubkey,
    cp_amm: Pubkey,
    base_mint: Pubkey,
    quote_mint: Pubkey,
    base_token_program: Pubkey,
    quote_token_program: Pubkey,
) -> Instruction {
    let mut builder = CollectFeesFromCpAmmBuilder::new();
    builder.signer(signer);
    builder.amms_config(amms_config);
    builder.fee_authority_base_account(get_ata(&fee_authority, &base_mint, &base_token_program).0);
    builder
        .fee_authority_quote_account(get_ata(&fee_authority, &quote_mint, &quote_token_program).0);
    builder.fee_authority(fee_authority);
    builder.cp_amm_base_vault(get_cp_amm_vault_pda(&cp_amm, &base_mint).0);
    builder.cp_amm_quote_vault(get_cp_amm_vault_pda(&cp_amm, &quote_mint).0);
    builder.base_mint(base_mint);
    builder.quote_mint(quote_mint);
    builder.cp_amm(cp_amm);
    builder.base_token_program(base_token_program);
    builder.quote_token_program(quote_token_program);
    builder.system_program(SYSTEM_PROGRAM_ID);
    builder.associated_token_program(ASSOCIATED_TOKEN_PROGRAM_ID);
    builder.instruction()
}
