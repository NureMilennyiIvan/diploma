use crate::liquidity_pool::api::dto::transactions::parameters::*;
use crate::liquidity_pool::api::dto::transactions::payloads::*;
use crate::liquidity_pool::context::LiquidityPoolContext;
use crate::liquidity_pool::core::*;
use crate::utils::web::send_result;
use axum::response::IntoResponse;
use axum::{
    extract::{Path, State},
    Json,
};
use std::sync::Arc;

pub(crate) async fn get_initialize_amms_configs_manager_tx(
    State(context): State<Arc<LiquidityPoolContext>>,
    Json(payload): Json<InitializeAmmsConfigsManagerPayload>,
) -> impl IntoResponse {
    let InitializeAmmsConfigsManagerPayload {
        signer,
        authority,
        head_authority,
    } = payload;
    let result = initialize_amms_configs_manager_tx(&context, signer, authority, head_authority)
        .await
        .and_then(|(tx, amms_configs_manager)| {
            tx.to_base64()
                .map(|tx_str| (tx_str, amms_configs_manager.to_string()))
        });
    send_result(result)
}

pub(crate) async fn get_update_amms_configs_manager_authority_tx(
    State(context): State<Arc<LiquidityPoolContext>>,
    Json(payload): Json<UpdateAmmsConfigsManagerAuthorityPayload>,
) -> impl IntoResponse {
    let UpdateAmmsConfigsManagerAuthorityPayload {
        authority,
        new_authority,
    } = payload;
    let result = update_amms_configs_manager_authority_tx(&context, authority, new_authority)
        .await
        .and_then(|tx| tx.to_base64());
    send_result(result)
}

pub(crate) async fn get_update_amms_configs_manager_head_authority_tx(
    State(context): State<Arc<LiquidityPoolContext>>,
    Json(payload): Json<UpdateAmmsConfigsManagerHeadAuthorityPayload>,
) -> impl IntoResponse {
    let UpdateAmmsConfigsManagerHeadAuthorityPayload {
        head_authority,
        new_head_authority,
    } = payload;
    let result =
        update_amms_configs_manager_head_authority_tx(&context, head_authority, new_head_authority)
            .await
            .and_then(|tx| tx.to_base64());
    send_result(result)
}

pub(crate) async fn get_initialize_amms_config_tx(
    State(context): State<Arc<LiquidityPoolContext>>,
    Path(params): Path<InitializeAmmsConfigParams>,
    Json(payload): Json<InitializeAmmsConfigPayload>,
) -> impl IntoResponse {
    let InitializeAmmsConfigPayload {
        authority,
        fee_authority,
        protocol_fee_rate_basis_points,
        providers_fee_rate_basis_points,
    } = payload;
    let InitializeAmmsConfigParams {
        amms_configs_manager,
    } = params;
    let result = initialize_amms_config_tx(
        &context,
        authority,
        amms_configs_manager,
        fee_authority,
        protocol_fee_rate_basis_points,
        providers_fee_rate_basis_points,
    )
    .await
    .and_then(|(tx, amms_config)| {
        tx.to_base64()
            .map(|tx_str| (tx_str, amms_config.to_string()))
    });
    send_result(result)
}

pub(crate) async fn get_update_amms_config_fee_authority_tx(
    State(context): State<Arc<LiquidityPoolContext>>,
    Path(params): Path<UpdateAmmsConfigFeeAuthorityParams>,
    Json(payload): Json<UpdateAmmsConfigFeeAuthorityPayload>,
) -> impl IntoResponse {
    let UpdateAmmsConfigFeeAuthorityPayload {
        authority,
        new_fee_authority,
    } = payload;
    let UpdateAmmsConfigFeeAuthorityParams { amms_config } = params;
    let result =
        update_amms_config_fee_authority_tx(&context, authority, amms_config, new_fee_authority)
            .await
            .and_then(|tx| tx.to_base64());
    send_result(result)
}

pub(crate) async fn get_update_amms_config_protocol_fee_rate_tx(
    State(context): State<Arc<LiquidityPoolContext>>,
    Path(params): Path<UpdateAmmsConfigProtocolFeeRateParams>,
    Json(payload): Json<UpdateAmmsConfigProtocolFeeRatePayload>,
) -> impl IntoResponse {
    let UpdateAmmsConfigProtocolFeeRatePayload {
        authority,
        new_protocol_fee_rate_basis_points,
    } = payload;
    let UpdateAmmsConfigProtocolFeeRateParams { amms_config } = params;
    let result = update_amms_config_protocol_fee_rate_tx(
        &context,
        authority,
        amms_config,
        new_protocol_fee_rate_basis_points,
    )
    .await
    .and_then(|tx| tx.to_base64());
    send_result(result)
}

pub(crate) async fn get_update_amms_config_providers_fee_rate_tx(
    State(context): State<Arc<LiquidityPoolContext>>,
    Path(params): Path<UpdateAmmsConfigProvidersFeeRateParams>,
    Json(payload): Json<UpdateAmmsConfigProvidersFeeRatePayload>,
) -> impl IntoResponse {
    let UpdateAmmsConfigProvidersFeeRatePayload {
        authority,
        new_providers_fee_rate_basis_points,
    } = payload;
    let UpdateAmmsConfigProvidersFeeRateParams { amms_config } = params;
    let result = update_amms_config_providers_fee_rate_tx(
        &context,
        authority,
        amms_config,
        new_providers_fee_rate_basis_points,
    )
    .await
    .and_then(|tx| tx.to_base64());
    send_result(result)
}

pub(crate) async fn get_initialize_cp_amm_tx(
    State(context): State<Arc<LiquidityPoolContext>>,
    Path(params): Path<InitializeCpAmmParams>,
    Json(payload): Json<InitializeCpAmmPayload>,
) -> impl IntoResponse {
    let InitializeCpAmmPayload {
        signer,
        base_mint,
        quote_mint,
    } = payload;
    let InitializeCpAmmParams { amms_config } = params;
    let result = initialize_cp_amm_tx(&context, signer, base_mint, quote_mint, amms_config)
        .await
        .and_then(|(tx, cp_amm)| tx.to_base64().map(|tx_str| (tx_str, cp_amm.to_string())));
    send_result(result)
}

pub(crate) async fn get_launch_cp_amm_tx(
    State(context): State<Arc<LiquidityPoolContext>>,
    Path(params): Path<LaunchCpAmmParams>,
    Json(payload): Json<LaunchCpAmmPayload>,
) -> impl IntoResponse {
    let LaunchCpAmmPayload {
        creator,
        creator_base_account,
        creator_quote_account,
        base_liquidity,
        quote_liquidity,
    } = payload;
    let LaunchCpAmmParams { cp_amm } = params;
    let result = launch_cp_amm_tx(
        &context,
        creator,
        creator_base_account,
        creator_quote_account,
        cp_amm,
        base_liquidity,
        quote_liquidity,
    )
    .await
    .and_then(|(tx, cp_amm)| tx.to_base64().map(|tx_str| (tx_str, cp_amm.to_string())));
    send_result(result)
}

pub(crate) async fn get_provide_to_cp_amm_tx(
    State(context): State<Arc<LiquidityPoolContext>>,
    Path(params): Path<ProvideToCpAmmParams>,
    Json(payload): Json<ProvideToCpAmmPayload>,
) -> impl IntoResponse {
    let ProvideToCpAmmPayload {
        signer,
        signer_base_account,
        signer_quote_account,
        base_liquidity,
        quote_liquidity,
    } = payload;
    let ProvideToCpAmmParams { cp_amm } = params;
    let result = provide_to_cp_amm_tx(
        &context,
        signer,
        signer_base_account,
        signer_quote_account,
        cp_amm,
        base_liquidity,
        quote_liquidity,
    )
    .await
    .and_then(|tx| tx.to_base64());
    send_result(result)
}

pub(crate) async fn get_withdraw_from_cp_amm_tx(
    State(context): State<Arc<LiquidityPoolContext>>,
    Path(params): Path<WithdrawFromCpAmmParams>,
    Json(payload): Json<WithdrawFromCpAmmPayload>,
) -> impl IntoResponse {
    let WithdrawFromCpAmmPayload {
        signer,
        signer_lp_account,
        lp_tokens,
    } = payload;
    let WithdrawFromCpAmmParams { cp_amm } = params;
    let result = withdraw_from_cp_amm_tx(&context, signer, signer_lp_account, cp_amm, lp_tokens)
        .await
        .and_then(|tx| tx.to_base64());
    send_result(result)
}

pub(crate) async fn get_swap_in_cp_amm_tx(
    State(context): State<Arc<LiquidityPoolContext>>,
    Path(params): Path<SwapInCpAmmParams>,
    Json(payload): Json<SwapInCpAmmPayload>,
) -> impl IntoResponse {
    let SwapInCpAmmPayload {
        signer,
        swap_amount,
        estimated_result,
        allowed_slippage,
        is_in_out,
    } = payload;
    let SwapInCpAmmParams { cp_amm } = params;
    let result = swap_in_cp_amm_tx(
        &context,
        signer,
        cp_amm,
        swap_amount,
        estimated_result,
        allowed_slippage,
        is_in_out,
    )
    .await
    .and_then(|tx| tx.to_base64());
    send_result(result)
}

pub(crate) async fn get_collect_fees_from_cp_amm_tx(
    State(context): State<Arc<LiquidityPoolContext>>,
    Path(params): Path<CollectFeesFromCpAmmParams>,
    Json(payload): Json<CollectFeesFromCpAmmPayload>,
) -> impl IntoResponse {
    let CollectFeesFromCpAmmPayload { signer } = payload;
    let CollectFeesFromCpAmmParams { cp_amm } = params;
    let result = collect_fees_from_cp_amm_tx(&context, signer, cp_amm)
        .await
        .and_then(|tx| tx.to_base64());
    send_result(result)
}
