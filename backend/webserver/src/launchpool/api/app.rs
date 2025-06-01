use std::sync::Arc;
use axum::{Router, ServiceExt};
use axum::routing::{post, IntoMakeService};
use crate::launchpool::api::endpoints::transactions::{get_close_stake_position_tx, get_collect_protocol_reward_tx, get_increase_stake_position_tx, get_initialize_launchpool_tx, get_initialize_launchpools_config_manager_tx, get_initialize_launchpools_config_tx, get_launch_launchpool_tx, get_open_stake_position_tx, get_update_launchpools_config_duration_tx, get_update_launchpools_config_position_sizes_tx, get_update_launchpools_config_protocol_reward_share_tx, get_update_launchpools_config_reward_authority_tx, get_update_launchpools_configs_manager_authority_tx, get_update_launchpools_configs_manager_head_authority_tx};
use crate::launchpool::context::LaunchpoolContext;
pub struct LaunchpoolApp {
    pub context: Arc<LaunchpoolContext>,
    pub routes: LaunchpoolRoutes,
}

impl LaunchpoolApp {
    pub fn new(context: Arc<LaunchpoolContext>, routes: LaunchpoolRoutes) -> Self {
        Self { context, routes }
    }

    pub fn into_make_service(self) -> IntoMakeService<Router> {
        let state = self.context.clone();
        let r = &self.routes;

        let scoped = Router::new()
            .route(&r.initialize_config_manager, post(get_initialize_launchpools_config_manager_tx))
            .route(&r.update_manager_authority, post(get_update_launchpools_configs_manager_authority_tx))
            .route(&r.update_manager_head_authority, post(get_update_launchpools_configs_manager_head_authority_tx))
            .route(&r.initialize_config, post(get_initialize_launchpools_config_tx))
            .route(&r.update_reward_authority, post(get_update_launchpools_config_reward_authority_tx))
            .route(&r.update_protocol_reward_share, post(get_update_launchpools_config_protocol_reward_share_tx))
            .route(&r.update_duration, post(get_update_launchpools_config_duration_tx))
            .route(&r.update_position_sizes, post(get_update_launchpools_config_position_sizes_tx))
            .route(&r.initialize, post(get_initialize_launchpool_tx))
            .route(&r.launch, post(get_launch_launchpool_tx))
            .route(&r.open, post(get_open_stake_position_tx))
            .route(&r.increase, post(get_increase_stake_position_tx))
            .route(&r.close, post(get_close_stake_position_tx))
            .route(&r.collect, post(get_collect_protocol_reward_tx))
            .with_state(state);

        Router::new().nest(&r.scope_path, scoped).into_make_service()
    }
}

#[derive(Clone)]
pub struct LaunchpoolRoutes {
    scope_path: String,
    initialize_config_manager: String,
    update_manager_authority: String,
    update_manager_head_authority: String,
    initialize_config: String,
    update_reward_authority: String,
    update_protocol_reward_share: String,
    update_duration: String,
    update_position_sizes: String,
    initialize: String,
    launch: String,
    open: String,
    increase: String,
    close: String,
    collect: String,
}

impl LaunchpoolRoutes {
    pub fn new(
        scope_path: String,
        initialize_config_manager: String,
        update_manager_authority: String,
        update_manager_head_authority: String,
        initialize_config: String,
        update_reward_authority: String,
        update_protocol_reward_share: String,
        update_duration: String,
        update_position_sizes: String,
        initialize: String,
        launch: String,
        open: String,
        increase: String,
        close: String,
        collect: String,
    ) -> Self {
        Self {
            scope_path,
            initialize_config_manager,
            update_manager_authority,
            update_manager_head_authority,
            initialize_config,
            update_reward_authority,
            update_protocol_reward_share,
            update_duration,
            update_position_sizes,
            initialize,
            launch,
            open,
            increase,
            close,
            collect,
        }
    }
}