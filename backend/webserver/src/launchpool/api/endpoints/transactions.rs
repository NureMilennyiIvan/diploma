use crate::launchpool::api::dto::transactions::parameters::{
    CloseStakePositionParams, CollectProtocolRewardParams, IncreaseStakePositionParams,
    InitializeLaunchpoolParams, InitializeLaunchpoolsConfigParams, LaunchLaunchpoolParams,
    OpenStakePositionParams, UpdateLaunchpoolsConfigDurationParams,
    UpdateLaunchpoolsConfigPositionSizesParams, UpdateLaunchpoolsConfigProtocolRewardShareParams,
    UpdateLaunchpoolsConfigRewardAuthorityParams,
};
use crate::launchpool::api::dto::transactions::payloads::{
    CloseStakePositionPayload, CollectProtocolRewardPayload, IncreaseStakePositionPayload,
    InitializeLaunchpoolPayload, InitializeLaunchpoolsConfigPayload,
    InitializeLaunchpoolsConfigsManagerPayload, LaunchLaunchpoolPayload, OpenStakePositionPayload,
    UpdateLaunchpoolsConfigDurationPayload, UpdateLaunchpoolsConfigPositionSizesPayload,
    UpdateLaunchpoolsConfigProtocolRewardSharePayload,
    UpdateLaunchpoolsConfigRewardAuthorityPayload, UpdateLaunchpoolsConfigsManagerAuthorityPayload,
    UpdateLaunchpoolsConfigsManagerHeadAuthorityPayload,
};
use crate::launchpool::context::LaunchpoolContext;
use crate::launchpool::core::{
    close_stake_position_tx, collect_protocol_reward_tx, increase_stake_position_tx,
    initialize_launchpool_tx, initialize_launchpools_config_tx,
    initialize_launchpools_configs_manager_tx, launch_launchpool_tx, open_stake_position_tx,
    update_launchpools_config_duration_tx, update_launchpools_config_position_sizes_tx,
    update_launchpools_config_protocol_reward_share_tx,
    update_launchpools_config_reward_authority_tx, update_launchpools_configs_manager_authority_tx,
    update_launchpools_configs_manager_head_authority_tx,
};
use crate::utils::web::send_result;
use axum::extract::{Path, State};
use axum::response::IntoResponse;
use axum::Json;
use std::sync::Arc;
use tracing::debug;

pub async fn get_initialize_launchpools_config_manager_tx(
    State(context): State<Arc<LaunchpoolContext>>,
    Json(payload): Json<InitializeLaunchpoolsConfigsManagerPayload>,
) -> impl IntoResponse {
    let InitializeLaunchpoolsConfigsManagerPayload {
        signer,
        authority,
        head_authority,
    } = payload;
    debug!(
        ?signer,
        ?authority,
        ?head_authority,
        "Calling initialize_launchpools_configs_manager_tx"
    );

    let result = initialize_launchpools_configs_manager_tx(
        context.as_ref(),
        signer,
        authority,
        head_authority,
    )
    .await
    .and_then(|(tx, launchpools_configs_manager)| {
        tx.to_base64()
            .map(|tx_str| (tx_str, launchpools_configs_manager.to_string()))
    });
    send_result(result)
}

pub async fn get_update_launchpools_configs_manager_authority_tx(
    State(context): State<Arc<LaunchpoolContext>>,
    Json(payload): Json<UpdateLaunchpoolsConfigsManagerAuthorityPayload>,
) -> impl IntoResponse {
    let UpdateLaunchpoolsConfigsManagerAuthorityPayload {
        authority,
        new_authority,
    } = payload;
    debug!(
        ?authority,
        ?new_authority,
        "Calling update_launchpools_configs_manager_authority_tx"
    );
    let result =
        update_launchpools_configs_manager_authority_tx(context.as_ref(), authority, new_authority)
            .await
            .and_then(|tx| tx.to_base64());
    send_result(result)
}

pub async fn get_update_launchpools_configs_manager_head_authority_tx(
    State(context): State<Arc<LaunchpoolContext>>,
    Json(payload): Json<UpdateLaunchpoolsConfigsManagerHeadAuthorityPayload>,
) -> impl IntoResponse {
    let UpdateLaunchpoolsConfigsManagerHeadAuthorityPayload {
        head_authority,
        new_head_authority,
    } = payload;
    debug!(
        ?head_authority,
        ?new_head_authority,
        "Calling update_launchpools_configs_manager_head_authority_tx"
    );
    let result = update_launchpools_configs_manager_head_authority_tx(
        context.as_ref(),
        head_authority,
        new_head_authority,
    )
    .await
    .and_then(|tx| tx.to_base64());
    send_result(result)
}

pub async fn get_initialize_launchpools_config_tx(
    State(context): State<Arc<LaunchpoolContext>>,
    Path(params): Path<InitializeLaunchpoolsConfigParams>,
    Json(payload): Json<InitializeLaunchpoolsConfigPayload>,
) -> impl IntoResponse {
    let InitializeLaunchpoolsConfigPayload {
        authority,
        reward_authority,
        stakable_mint,
        min_position_size,
        max_position_size,
        protocol_reward_share_basis_points,
        duration,
    } = payload;
    let InitializeLaunchpoolsConfigParams {
        launchpools_configs_manager,
    } = params;
    debug!(
        ?authority,
        ?reward_authority,
        ?stakable_mint,
        min_position_size,
        max_position_size,
        protocol_reward_share_basis_points,
        duration,
        ?launchpools_configs_manager,
        "Calling initialize_launchpools_config_tx"
    );
    let result = initialize_launchpools_config_tx(
        context.as_ref(),
        authority,
        launchpools_configs_manager,
        reward_authority,
        stakable_mint,
        min_position_size,
        max_position_size,
        protocol_reward_share_basis_points,
        duration,
    )
    .await
    .and_then(|(tx, launchpools_config)| {
        tx.to_base64()
            .map(|tx_str| (tx_str, launchpools_config.to_string()))
    });
    send_result(result)
}

pub async fn get_update_launchpools_config_reward_authority_tx(
    State(context): State<Arc<LaunchpoolContext>>,
    Path(params): Path<UpdateLaunchpoolsConfigRewardAuthorityParams>,
    Json(payload): Json<UpdateLaunchpoolsConfigRewardAuthorityPayload>,
) -> impl IntoResponse {
    let UpdateLaunchpoolsConfigRewardAuthorityPayload {
        authority,
        new_reward_authority,
    } = payload;
    let UpdateLaunchpoolsConfigRewardAuthorityParams { launchpools_config } = params;
    debug!(
        ?authority,
        ?new_reward_authority,
        ?launchpools_config,
        "Calling update_launchpools_config_reward_authority_tx"
    );
    let result = update_launchpools_config_reward_authority_tx(
        context.as_ref(),
        authority,
        launchpools_config,
        new_reward_authority,
    )
    .await
    .and_then(|tx| tx.to_base64());
    send_result(result)
}

pub async fn get_update_launchpools_config_protocol_reward_share_tx(
    State(context): State<Arc<LaunchpoolContext>>,
    Path(params): Path<UpdateLaunchpoolsConfigProtocolRewardShareParams>,
    Json(payload): Json<UpdateLaunchpoolsConfigProtocolRewardSharePayload>,
) -> impl IntoResponse {
    let UpdateLaunchpoolsConfigProtocolRewardSharePayload {
        authority,
        new_protocol_reward_share_basis_points,
    } = payload;
    let UpdateLaunchpoolsConfigProtocolRewardShareParams { launchpools_config } = params;
    debug!(
        ?authority,
        new_protocol_reward_share_basis_points,
        ?launchpools_config,
        "Calling update_launchpools_config_protocol_reward_share_tx"
    );
    let result = update_launchpools_config_protocol_reward_share_tx(
        context.as_ref(),
        authority,
        launchpools_config,
        new_protocol_reward_share_basis_points,
    )
    .await
    .and_then(|tx| tx.to_base64());
    send_result(result)
}

pub async fn get_update_launchpools_config_duration_tx(
    State(context): State<Arc<LaunchpoolContext>>,
    Path(params): Path<UpdateLaunchpoolsConfigDurationParams>,
    Json(payload): Json<UpdateLaunchpoolsConfigDurationPayload>,
) -> impl IntoResponse {
    let UpdateLaunchpoolsConfigDurationPayload {
        authority,
        new_duration,
    } = payload;
    let UpdateLaunchpoolsConfigDurationParams { launchpools_config } = params;
    debug!(
        ?authority,
        new_duration,
        ?launchpools_config,
        "Calling update_launchpools_config_duration_tx"
    );
    let result = update_launchpools_config_duration_tx(
        context.as_ref(),
        authority,
        launchpools_config,
        new_duration,
    )
    .await
    .and_then(|tx| tx.to_base64());
    send_result(result)
}

pub async fn get_update_launchpools_config_position_sizes_tx(
    State(context): State<Arc<LaunchpoolContext>>,
    Path(params): Path<UpdateLaunchpoolsConfigPositionSizesParams>,
    Json(payload): Json<UpdateLaunchpoolsConfigPositionSizesPayload>,
) -> impl IntoResponse {
    let UpdateLaunchpoolsConfigPositionSizesPayload {
        authority,
        new_min_position_size,
        new_max_position_size,
    } = payload;
    let UpdateLaunchpoolsConfigPositionSizesParams { launchpools_config } = params;
    debug!(
        ?authority,
        new_min_position_size,
        new_max_position_size,
        ?launchpools_config,
        "Calling update_launchpools_config_position_sizes_tx"
    );
    let result = update_launchpools_config_position_sizes_tx(
        context.as_ref(),
        authority,
        launchpools_config,
        new_min_position_size,
        new_max_position_size,
    )
    .await
    .and_then(|tx| tx.to_base64());
    send_result(result)
}

pub async fn get_initialize_launchpool_tx(
    State(context): State<Arc<LaunchpoolContext>>,
    Path(params): Path<InitializeLaunchpoolParams>,
    Json(payload): Json<InitializeLaunchpoolPayload>,
) -> impl IntoResponse {
    let InitializeLaunchpoolPayload {
        authority,
        reward_mint,
        initial_reward_amount,
    } = payload;
    let InitializeLaunchpoolParams { launchpools_config } = params;
    debug!(
        ?authority,
        ?reward_mint,
        initial_reward_amount,
        ?launchpools_config,
        "Calling initialize_launchpool_tx"
    );
    let result = initialize_launchpool_tx(
        context.as_ref(),
        authority,
        launchpools_config,
        reward_mint,
        initial_reward_amount,
    )
    .await
    .and_then(|(tx, launchpool)| {
        tx.to_base64()
            .map(|tx_str| (tx_str, launchpool.to_string()))
    });
    send_result(result)
}

pub async fn get_launch_launchpool_tx(
    State(context): State<Arc<LaunchpoolContext>>,
    Path(params): Path<LaunchLaunchpoolParams>,
    Json(payload): Json<LaunchLaunchpoolPayload>,
) -> impl IntoResponse {
    let LaunchLaunchpoolPayload {
        authority,
        start_timestamp,
    } = payload;
    let LaunchLaunchpoolParams { launchpool } = params;
    debug!(
        ?authority,
        start_timestamp,
        ?launchpool,
        "Calling launch_launchpool_tx"
    );
    let result = launch_launchpool_tx(context.as_ref(), authority, launchpool, start_timestamp)
        .await
        .and_then(|tx| tx.to_base64());
    send_result(result)
}

pub async fn get_open_stake_position_tx(
    State(context): State<Arc<LaunchpoolContext>>,
    Path(params): Path<OpenStakePositionParams>,
    Json(payload): Json<OpenStakePositionPayload>,
) -> impl IntoResponse {
    let OpenStakePositionPayload {
        signer,
        stake_amount,
        signer_stakable_account,
    } = payload;
    let OpenStakePositionParams { launchpool } = params;
    debug!(
        ?signer,
        stake_amount,
        ?signer_stakable_account,
        ?launchpool,
        "Calling open_stake_position_tx"
    );
    let result = open_stake_position_tx(
        context.as_ref(),
        signer,
        signer_stakable_account,
        launchpool,
        stake_amount,
    )
    .await
    .and_then(|(tx, stake_position)| {
        tx.to_base64()
            .map(|tx_str| (tx_str, stake_position.to_string()))
    });
    send_result(result)
}
pub async fn get_increase_stake_position_tx(
    State(context): State<Arc<LaunchpoolContext>>,
    Path(params): Path<IncreaseStakePositionParams>,
    Json(payload): Json<IncreaseStakePositionPayload>,
) -> impl IntoResponse {
    let IncreaseStakePositionPayload {
        signer,
        stake_increase_amount,
        signer_stakable_account,
    } = payload;
    let IncreaseStakePositionParams { stake_position } = params;
    debug!(
        ?signer,
        stake_increase_amount,
        ?signer_stakable_account,
        ?stake_position,
        "Calling increase_stake_position_tx"
    );
    let result = increase_stake_position_tx(
        context.as_ref(),
        signer,
        signer_stakable_account,
        stake_position,
        stake_increase_amount,
    )
    .await
    .and_then(|tx| tx.to_base64());
    send_result(result)
}
pub async fn get_close_stake_position_tx(
    State(context): State<Arc<LaunchpoolContext>>,
    Path(params): Path<CloseStakePositionParams>,
    Json(payload): Json<CloseStakePositionPayload>,
) -> impl IntoResponse {
    let CloseStakePositionPayload {
        signer,
        signer_stakable_account,
    } = payload;
    let CloseStakePositionParams { stake_position } = params;
    debug!(
        ?signer,
        ?signer_stakable_account,
        ?stake_position,
        "Calling close_stake_position_tx"
    );
    let result = close_stake_position_tx(
        context.as_ref(),
        signer,
        signer_stakable_account,
        stake_position,
    )
    .await
    .and_then(|tx| tx.to_base64());
    send_result(result)
}
pub async fn get_collect_protocol_reward_tx(
    State(context): State<Arc<LaunchpoolContext>>,
    Path(params): Path<CollectProtocolRewardParams>,
    Json(payload): Json<CollectProtocolRewardPayload>,
) -> impl IntoResponse {
    let CollectProtocolRewardPayload { signer } = payload;
    let CollectProtocolRewardParams { launchpool } = params;
    debug!(?signer, ?launchpool, "Calling collect_protocol_reward_tx");
    let result = collect_protocol_reward_tx(context.as_ref(), signer, launchpool)
        .await
        .and_then(|tx| tx.to_base64());
    send_result(result)
}
