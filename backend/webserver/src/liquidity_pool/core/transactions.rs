use crate::liquidity_pool::context::LiquidityPoolContext;
use crate::liquidity_pool::core::instructions::{
    collect_fees_from_cp_amm_ix, initialize_amms_config_ix, initialize_amms_configs_manager_ix,
    initialize_cp_amm_ix, launch_cp_amm_ix, provide_to_cp_amm_ix, swap_in_cp_amm_ix,
    update_amms_config_fee_authority_ix, update_amms_config_protocol_fee_rate_ix,
    update_amms_config_providers_fee_rate_ix, update_amms_configs_manager_authority_ix,
    update_amms_configs_manager_head_authority_ix, withdraw_from_cp_amm_ix,
};
use crate::utils::clients::{ProgramContext, SolanaRpcClient};
use crate::utils::instructions::set_compute_budget_ix;
use crate::utils::types::{
    build_unsigned_transaction, UnsignedTransaction, UnsignedTransactionBuilder,
};
use anyhow::Result as AnyResult;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::Keypair;

pub async fn initialize_amms_configs_manager_tx(
    context: &LiquidityPoolContext,
    signer: Pubkey,
    authority: Pubkey,
    head_authority: Pubkey,
) -> AnyResult<(UnsignedTransaction, Pubkey)> {
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let (ix, amms_configs_manager_pubkey) =
        initialize_amms_configs_manager_ix(signer, authority, head_authority);
    Ok((
        build_unsigned_transaction(&signer, [ix], blockhash, []),
        amms_configs_manager_pubkey,
    ))
}
pub async fn update_amms_configs_manager_authority_tx(
    context: &LiquidityPoolContext,
    authority: Pubkey,
    new_authority: Pubkey,
) -> AnyResult<UnsignedTransaction> {
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = update_amms_configs_manager_authority_ix(authority, new_authority);
    Ok(build_unsigned_transaction(&authority, [ix], blockhash, []))
}
pub async fn update_amms_configs_manager_head_authority_tx(
    context: &LiquidityPoolContext,
    head_authority: Pubkey,
    new_head_authority: Pubkey,
) -> AnyResult<UnsignedTransaction> {
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = update_amms_configs_manager_head_authority_ix(head_authority, new_head_authority);
    Ok(build_unsigned_transaction(
        &head_authority,
        [ix],
        blockhash,
        [],
    ))
}
pub async fn initialize_amms_config_tx(
    context: &LiquidityPoolContext,
    authority: Pubkey,
    amms_configs_manager: Pubkey,
    fee_authority: Pubkey,
    protocol_fee_rate_basis_points: u16,
    providers_fee_rate_basis_points: u16,
) -> AnyResult<(UnsignedTransaction, Pubkey)> {
    let amms_config_manager_account = context
        .solana_rpc_client()
        .fetch_amms_configs_manager(&amms_configs_manager)
        .await?;
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let (ix, amms_config_pubkey) = initialize_amms_config_ix(
        authority,
        amms_config_manager_account.configs_count,
        fee_authority,
        protocol_fee_rate_basis_points,
        providers_fee_rate_basis_points,
    );
    Ok((
        build_unsigned_transaction(&authority, [ix], blockhash, []),
        amms_config_pubkey,
    ))
}
pub async fn update_amms_config_fee_authority_tx(
    context: &LiquidityPoolContext,
    authority: Pubkey,
    amms_config: Pubkey,
    new_fee_authority: Pubkey,
) -> AnyResult<UnsignedTransaction> {
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = update_amms_config_fee_authority_ix(authority, amms_config, new_fee_authority);
    Ok(build_unsigned_transaction(&authority, [ix], blockhash, []))
}

pub async fn update_amms_config_protocol_fee_rate_tx(
    context: &LiquidityPoolContext,
    authority: Pubkey,
    amms_config: Pubkey,
    new_protocol_fee_rate_basis_points: u16,
) -> AnyResult<UnsignedTransaction> {
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = update_amms_config_protocol_fee_rate_ix(
        authority,
        amms_config,
        new_protocol_fee_rate_basis_points,
    );
    Ok(UnsignedTransactionBuilder::new()
        .recent_blockhash(blockhash)
        .instruction(ix)
        .payer(&authority)
        .build())
}

pub async fn update_amms_config_providers_fee_rate_tx(
    context: &LiquidityPoolContext,
    authority: Pubkey,
    amms_config: Pubkey,
    new_providers_fee_rate_basis_points: u16,
) -> AnyResult<UnsignedTransaction> {
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = update_amms_config_providers_fee_rate_ix(
        authority,
        amms_config,
        new_providers_fee_rate_basis_points,
    );
    Ok(UnsignedTransactionBuilder::new()
        .recent_blockhash(blockhash)
        .instruction(ix)
        .payer(&authority)
        .build())
}
pub async fn initialize_cp_amm_tx(
    context: &LiquidityPoolContext,
    signer: Pubkey,
    base_mint: Pubkey,
    quote_mint: Pubkey,
    amms_config: Pubkey,
) -> AnyResult<(UnsignedTransaction, Pubkey)> {
    let lp_mint_keypair = Keypair::new();
    let solana_rpc_client = context.solana_rpc_client();
    let (amms_config_account, base_mint_account, quote_mint_account) = tokio::try_join!(
        solana_rpc_client.fetch_amms_config(&amms_config),
        context.get_token_mint(&base_mint),
        context.get_token_mint(&quote_mint),
    )?;
    let blockhash = solana_rpc_client.get_blockhash().await?;
    let (ix, cp_amm_pubkey) = initialize_cp_amm_ix(
        signer,
        &lp_mint_keypair,
        amms_config_account.fee_authority,
        base_mint,
        quote_mint,
        amms_config,
        *base_mint_account.program(),
        *quote_mint_account.program(),
    );
    Ok((
        build_unsigned_transaction(&signer, [ix], blockhash, [&lp_mint_keypair]),
        cp_amm_pubkey,
    ))
}
pub async fn launch_cp_amm_tx(
    context: &LiquidityPoolContext,
    creator: Pubkey,
    creator_base_account: Option<Pubkey>,
    creator_quote_account: Option<Pubkey>,
    cp_amm: Pubkey,
    base_liquidity: u64,
    quote_liquidity: u64,
) -> AnyResult<(UnsignedTransaction, Pubkey)> {
    let cp_amm_keys = context.get_cp_amm_keys(&cp_amm).await?;
    let (lp_mint_account, base_mint_account, quote_mint_account) = tokio::try_join!(
        context.get_token_mint(&cp_amm_keys.lp_mint),
        context.get_token_mint(&cp_amm_keys.base_mint),
        context.get_token_mint(&cp_amm_keys.quote_mint),
    )?;
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let (ix, cp_amm_pubkey) = launch_cp_amm_ix(
        creator,
        creator_base_account,
        creator_quote_account,
        cp_amm_keys.amms_config,
        cp_amm,
        cp_amm_keys.base_mint,
        cp_amm_keys.quote_mint,
        cp_amm_keys.lp_mint,
        *base_mint_account.program(),
        *quote_mint_account.program(),
        *lp_mint_account.program(),
        base_liquidity,
        quote_liquidity,
    );
    Ok((build_unsigned_transaction(
        &creator,
        [set_compute_budget_ix(250_000), ix],
        blockhash,
        [],
    ), cp_amm_pubkey))
}
pub async fn provide_to_cp_amm_tx(
    context: &LiquidityPoolContext,
    signer: Pubkey,
    signer_base_account: Option<Pubkey>,
    signer_quote_account: Option<Pubkey>,
    cp_amm: Pubkey,
    base_liquidity: u64,
    quote_liquidity: u64,
) -> AnyResult<UnsignedTransaction> {
    let cp_amm_keys = context.get_cp_amm_keys(&cp_amm).await?;
    let (lp_mint_account, base_mint_account, quote_mint_account) = tokio::try_join!(
        context.get_token_mint(&cp_amm_keys.lp_mint),
        context.get_token_mint(&cp_amm_keys.base_mint),
        context.get_token_mint(&cp_amm_keys.quote_mint),
    )?;
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = provide_to_cp_amm_ix(
        signer,
        signer_base_account,
        signer_quote_account,
        cp_amm_keys.amms_config,
        cp_amm,
        cp_amm_keys.base_mint,
        cp_amm_keys.quote_mint,
        cp_amm_keys.lp_mint,
        *base_mint_account.program(),
        *quote_mint_account.program(),
        *lp_mint_account.program(),
        base_liquidity,
        quote_liquidity,
    );
    Ok(build_unsigned_transaction(
        &signer,
        [set_compute_budget_ix(250_000), ix],
        blockhash,
        [],
    ))
}

pub async fn withdraw_from_cp_amm_tx(
    context: &LiquidityPoolContext,
    signer: Pubkey,
    signer_lp_account: Option<Pubkey>,
    cp_amm: Pubkey,
    lp_tokens: u64,
) -> AnyResult<UnsignedTransaction> {
    let cp_amm_keys = context.get_cp_amm_keys(&cp_amm).await?;
    let (lp_mint_account, base_mint_account, quote_mint_account) = tokio::try_join!(
        context.get_token_mint(&cp_amm_keys.lp_mint),
        context.get_token_mint(&cp_amm_keys.base_mint),
        context.get_token_mint(&cp_amm_keys.quote_mint),
    )?;
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = withdraw_from_cp_amm_ix(
        signer,
        signer_lp_account,
        cp_amm_keys.amms_config,
        cp_amm,
        cp_amm_keys.base_mint,
        cp_amm_keys.quote_mint,
        cp_amm_keys.lp_mint,
        *base_mint_account.program(),
        *quote_mint_account.program(),
        *lp_mint_account.program(),
        lp_tokens,
    );
    Ok(build_unsigned_transaction(
        &signer,
        [set_compute_budget_ix(250_000), ix],
        blockhash,
        [],
    ))
}

pub async fn swap_in_cp_amm_tx(
    context: &LiquidityPoolContext,
    signer: Pubkey,
    cp_amm: Pubkey,
    swap_amount: u64,
    estimated_result: u64,
    allowed_slippage: u64,
    is_in_out: bool,
) -> AnyResult<UnsignedTransaction> {
    let cp_amm_keys = context.get_cp_amm_keys(&cp_amm).await?;
    let (base_mint_account, quote_mint_account) = tokio::try_join!(
        context.get_token_mint(&cp_amm_keys.base_mint),
        context.get_token_mint(&cp_amm_keys.quote_mint),
    )?;
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = swap_in_cp_amm_ix(
        signer,
        cp_amm_keys.amms_config,
        cp_amm,
        cp_amm_keys.base_mint,
        cp_amm_keys.quote_mint,
        *base_mint_account.program(),
        *quote_mint_account.program(),
        swap_amount,
        estimated_result,
        allowed_slippage,
        is_in_out,
    );
    Ok(build_unsigned_transaction(
        &signer,
        [set_compute_budget_ix(250_000), ix],
        blockhash,
        [],
    ))
}

pub async fn collect_fees_from_cp_amm_tx(
    context: &LiquidityPoolContext,
    signer: Pubkey,
    cp_amm: Pubkey,
) -> AnyResult<UnsignedTransaction> {
    let cp_amm_keys = context.get_cp_amm_keys(&cp_amm).await?;
    let solana_rpc_client = context.solana_rpc_client();
    let (amms_config_account, base_mint_account, quote_mint_account) = tokio::try_join!(
        solana_rpc_client.fetch_amms_config(&cp_amm_keys.amms_config),
        context.get_token_mint(&cp_amm_keys.base_mint),
        context.get_token_mint(&cp_amm_keys.quote_mint),
    )?;
    let blockhash = solana_rpc_client.get_blockhash().await?;
    let ix = collect_fees_from_cp_amm_ix(
        signer,
        amms_config_account.fee_authority,
        cp_amm_keys.amms_config,
        cp_amm,
        cp_amm_keys.base_mint,
        cp_amm_keys.quote_mint,
        *base_mint_account.program(),
        *quote_mint_account.program(),
    );
    Ok(build_unsigned_transaction(&signer, [ix], blockhash, []))
}
