use std::sync::Arc;
use axum::{Router, routing::post, Router as AxumRouter};
use axum::routing::IntoMakeService;

use crate::liquidity_pool::api::endpoints::transactions::*;
use crate::liquidity_pool::context::LiquidityPoolContext;

#[derive(Clone)]
pub struct LiquidityPoolRoutes {
    pub scope_path: String,
    pub initialize_config_manager: String,
    pub update_manager_authority: String,
    pub update_manager_head_authority: String,
    pub initialize_config: String,
    pub update_fee_authority: String,
    pub update_protocol_fee_rate: String,
    pub update_providers_fee_rate: String,
    pub initialize_cp_amm: String,
    pub launch_cp_amm: String,
    pub provide: String,
    pub withdraw: String,
    pub swap: String,
    pub collect_fees: String,
}

impl LiquidityPoolRoutes {
    pub fn new(
        scope_path: String,
        initialize_config_manager: String,
        update_manager_authority: String,
        update_manager_head_authority: String,
        initialize_config: String,
        update_fee_authority: String,
        update_protocol_fee_rate: String,
        update_providers_fee_rate: String,
        initialize_cp_amm: String,
        launch_cp_amm: String,
        provide: String,
        withdraw: String,
        swap: String,
        collect_fees: String,
    ) -> Self {
        Self {
            scope_path,
            initialize_config_manager,
            update_manager_authority,
            update_manager_head_authority,
            initialize_config,
            update_fee_authority,
            update_protocol_fee_rate,
            update_providers_fee_rate,
            initialize_cp_amm,
            launch_cp_amm,
            provide,
            withdraw,
            swap,
            collect_fees,
        }
    }
}

pub struct LiquidityPoolApp {
    pub context: Arc<LiquidityPoolContext>,
    pub routes: LiquidityPoolRoutes,
}

impl LiquidityPoolApp {
    pub fn new(context: Arc<LiquidityPoolContext>, routes: LiquidityPoolRoutes) -> Self {
        Self { context, routes }
    }

    pub fn into_make_service(self) -> IntoMakeService<AxumRouter> {
        let state = self.context.clone();
        let r = &self.routes;

        let scoped = Router::new()
            .route(&r.initialize_config_manager, post(get_initialize_amms_configs_manager_tx))
            .route(&r.update_manager_authority, post(get_update_amms_configs_manager_authority_tx))
            .route(&r.update_manager_head_authority, post(get_update_amms_configs_manager_head_authority_tx))
            .route(&r.initialize_config, post(get_initialize_amms_config_tx))
            .route(&r.update_fee_authority, post(get_update_amms_config_fee_authority_tx))
            .route(&r.update_protocol_fee_rate, post(get_update_amms_config_protocol_fee_rate_tx))
            .route(&r.update_providers_fee_rate, post(get_update_amms_config_providers_fee_rate_tx))
            .route(&r.initialize_cp_amm, post(get_initialize_cp_amm_tx))
            .route(&r.launch_cp_amm, post(get_launch_cp_amm_tx))
            .route(&r.provide, post(get_provide_to_cp_amm_tx))
            .route(&r.withdraw, post(get_withdraw_from_cp_amm_tx))
            .route(&r.swap, post(get_swap_in_cp_amm_tx))
            .route(&r.collect_fees, post(get_collect_fees_from_cp_amm_tx))
            .with_state(state);

        Router::new()
            .nest(&r.scope_path, scoped)
            .into_make_service()
    }
}
