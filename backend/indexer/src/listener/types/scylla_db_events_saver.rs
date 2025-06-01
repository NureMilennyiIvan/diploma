use crate::listener::traits::EventsSaver;
use crate::macros::AnchorProgram;
use crate::programs::{LaunchpoolProgram, LiquidityPoolProgram};
use anyhow::Result as AnyResult;
use async_trait::async_trait;
use launchpool::types::{LaunchpoolStatus, PositionStatus};
use scylla::client::session::Session;
use scylla::statement::batch::{Batch, BatchType};
use scylla::value::CqlTimeuuid;
use std::marker::PhantomData;
use tracing::debug;
use utilities::math::U192;
use uuid::{Context, Timestamp, Uuid};

pub struct ScyllaDbEventsSaver<T: AnchorProgram + 'static> {
    _phantom_data: PhantomData<T>,
    scylla_session: Session,
}
impl<T: AnchorProgram + 'static> ScyllaDbEventsSaver<T> {
    const NODE_ID: [u8; 6] = [1, 1, 1, 1, 1, 1];

    pub fn new(scylla_session: Session) -> ScyllaDbEventsSaver<T> {
        Self {
            _phantom_data: PhantomData,
            scylla_session,
        }
    }
    fn get_uuid(timestamp: u64) -> CqlTimeuuid {
        CqlTimeuuid::from(Uuid::new_v1(
            Timestamp::from_unix(Context::new(1), timestamp, 0),
            &Self::NODE_ID,
        ))
    }
}

#[async_trait]
impl EventsSaver<LiquidityPoolProgram> for ScyllaDbEventsSaver<LiquidityPoolProgram> {
    async fn save_event(&self, signature: &String, event: LiquidityPoolProgram) -> AnyResult<()> {
        let scylla_session = &self.scylla_session;
        match event {
            LiquidityPoolProgram::SwapInCpAmmEvent(event) => {
                let mut batch = Batch::new(BatchType::Unlogged);

                batch.append_statement(
                    "INSERT INTO trades_by_cp_amm \
                    (signature, timestamp, event_id, swapper, cp_amm, swapped_amount, received_amount, is_in_out) \
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                );

                batch.append_statement(
                    "INSERT INTO trades_by_user \
                    (signature, timestamp, event_id, swapper, cp_amm, swapped_amount, received_amount, is_in_out) \
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                );

                batch.append_statement(
                    "INSERT INTO cp_amms_liquidity \
                    (cp_amm, liquidity)\
                    VALUES (?, ?)",
                );

                let timestamp = event.timestamp;
                let event_id = Self::get_uuid(event.timestamp as u64);
                let swapper = event.swapper.to_string();
                let cp_amm = event.cp_amm.to_string();

                let swapped_amount: [u8; 8] = event.swapped_amount.to_be_bytes();
                let received_amount: [u8; 8] = event.received_amount.to_be_bytes();
                let is_in_out = event.is_in_out;

                let liquidity = U192(event.constant_product_sqrt.value).to_little_endian();

                let values = (
                    (
                        &signature,
                        timestamp,
                        event_id,
                        &swapper,
                        &cp_amm,
                        swapped_amount.as_slice(),
                        received_amount.as_slice(),
                        is_in_out,
                    ),
                    (
                        &signature,
                        timestamp,
                        event_id,
                        &swapper,
                        &cp_amm,
                        swapped_amount.as_slice(),
                        received_amount.as_slice(),
                        is_in_out,
                    ),
                    (&cp_amm, liquidity.as_slice()),
                );
                scylla_session.batch(&batch, values).await?;
                debug!("Saving SwapInCpAmmEvent from signature {}", signature);
            }
            LiquidityPoolProgram::ProvideToCpAmmEvent(event) => {
                let liquidity = U192(event.constant_product_sqrt.value).to_little_endian();
                scylla_session
                    .query_unpaged(
                        "INSERT INTO cp_amms_liquidity (cp_amm, liquidity) VALUES (?, ?)",
                        (event.cp_amm.to_string(), liquidity.as_slice()),
                    )
                    .await?;
                debug!("Saving ProvideToCpAmmEvent from signature {}", signature);
            }
            LiquidityPoolProgram::WithdrawFromCpAmmEvent(event) => {
                let liquidity = U192(event.constant_product_sqrt.value).to_little_endian();
                scylla_session
                    .query_unpaged(
                        "INSERT INTO cp_amms_liquidity (cp_amm, liquidity) VALUES (?, ?)",
                        (event.cp_amm.to_string(), liquidity.as_slice()),
                    )
                    .await?;
                debug!("Saving WithdrawFromCpAmmEvent from signature {}", signature);
            }
            LiquidityPoolProgram::CollectFeesFromCpAmmEvent(event) => {
                let withdrawn_protocol_base_fees: [u8; 8] =
                    event.withdrawn_protocol_base_fees.to_be_bytes();
                let withdrawn_protocol_quote_fees: [u8; 8] =
                    event.withdrawn_protocol_quote_fees.to_be_bytes();
                scylla_session
                    .query_unpaged(
                        "INSERT INTO collect_fees_from_cp_amm_event \
                        (signature, timestamp, event_id, cp_amm, signer, fee_authority, \
                        fee_authority_base_account, fee_authority_quote_account, \
                        withdrawn_protocol_base_fees, withdrawn_protocol_quote_fees) \
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        (
                            &signature,
                            event.timestamp,
                            Self::get_uuid(event.timestamp as u64),
                            event.cp_amm.to_string(),
                            event.signer.to_string(),
                            event.fee_authority.to_string(),
                            event.fee_authority_base_account.to_string(),
                            event.fee_authority_quote_account.to_string(),
                            withdrawn_protocol_base_fees.as_slice(),
                            withdrawn_protocol_quote_fees.as_slice(),
                        ),
                    )
                    .await?;
                debug!(
                    "Saving CollectFeesFromCpAmmEvent from signature {}",
                    signature
                );
            }
            LiquidityPoolProgram::LaunchCpAmmEvent(event) => {
                let mut batch = Batch::new(BatchType::Unlogged);

                batch.append_statement(
                    "INSERT INTO launched_cp_amms \
                    (signature, timestamp, event_id, creator, cp_amm, amms_config, base_mint, quote_mint, lp_mint) \
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                );

                batch.append_statement(
                    "INSERT INTO launched_cp_amms_by_base_or_quote \
                    (signature, timestamp, creator, cp_amm, amms_config, base_or_quote_mint, remaining_mint, lp_mint) \
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                );

                batch.append_statement(
                    "INSERT INTO launched_cp_amms_by_base_or_quote \
                    (signature, timestamp, creator, cp_amm, amms_config, base_or_quote_mint, remaining_mint, lp_mint) \
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                );

                batch.append_statement(
                    "INSERT INTO launched_cp_amms_by_base_and_quote \
                    (signature, timestamp, creator, cp_amm, amms_config, base_mint, quote_mint, lp_mint) \
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                );

                batch.append_statement(
                    "INSERT INTO cp_amms_liquidity (cp_amm, liquidity) VALUES (?, ?)",
                );

                let timestamp = event.timestamp;
                let creator = event.creator.to_string();
                let cp_amm = event.cp_amm.to_string();
                let amms_config = event.amms_config.to_string();
                let base_mint = event.base_mint.to_string();
                let quote_mint = event.quote_mint.to_string();
                let lp_mint = event.lp_mint.to_string();
                let liquidity = U192(event.constant_product_sqrt.value).to_little_endian();

                let values = (
                    (
                        &signature,
                        timestamp,
                        Self::get_uuid(timestamp as u64),
                        &creator,
                        &cp_amm,
                        &amms_config,
                        &base_mint,
                        &quote_mint,
                        &lp_mint,
                    ),
                    (
                        &signature,
                        timestamp,
                        &creator,
                        &cp_amm,
                        &amms_config,
                        &base_mint,
                        &quote_mint,
                        &lp_mint,
                    ),
                    (
                        &signature,
                        timestamp,
                        &creator,
                        &cp_amm,
                        &amms_config,
                        &quote_mint,
                        &base_mint,
                        &lp_mint,
                    ),
                    (
                        &signature,
                        timestamp,
                        &creator,
                        &cp_amm,
                        &amms_config,
                        &base_mint,
                        &quote_mint,
                        &lp_mint,
                    ),
                    (&cp_amm, liquidity.as_slice()),
                );

                scylla_session.batch(&batch, values).await?;
                debug!("Saving LaunchCpAmmEvent from signature {}", signature);
            }
            LiquidityPoolProgram::InitializeCpAmmEvent(event) => {
                let mut batch = Batch::new(BatchType::Unlogged);
                batch.append_statement(
                    "INSERT INTO uninitialized_cp_amms (signature, timestamp, event_id, creator, cp_amm, amms_config, base_mint, quote_mint, lp_mint) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                );
                batch.append_statement(
                    "INSERT INTO cp_amms_keys \
                    (cp_amm, amms_config, base_mint, quote_mint, lp_mint) \
                    VALUES (?, ?, ?, ?, ?)",
                );

                let values = (
                    (
                        &signature,
                        event.timestamp,
                        Self::get_uuid(event.timestamp as u64),
                        event.creator.to_string(),
                        event.cp_amm.to_string(),
                        event.amms_config.to_string(),
                        event.base_mint.to_string(),
                        event.quote_mint.to_string(),
                        event.lp_mint.to_string(),
                    ),
                    (
                        event.cp_amm.to_string(),
                        event.amms_config.to_string(),
                        event.base_mint.to_string(),
                        event.quote_mint.to_string(),
                        event.lp_mint.to_string(),
                    )
                );

                scylla_session.batch(&batch, values).await?;
                debug!("Saving InitializeCpAmmEvent from signature {}", signature);
            }
            LiquidityPoolProgram::UpdateAmmsConfigFeeAuthorityEvent(event) => {
                scylla_session
                        .query_unpaged(
                            "INSERT INTO upd_amms_cfg_fee_auth_events \
                            (signature, timestamp, event_id, authority, amms_config, new_fee_authority) \
                            VALUES (?, ?, ?, ?, ?, ?)",
                            (
                                &signature,
                                event.timestamp,
                                Self::get_uuid(event.timestamp as u64),
                                event.authority.to_string(),
                                event.amms_config.to_string(),
                                event.new_fee_authority.to_string(),
                            ),
                        )
                        .await?;
                debug!(
                    "Saving UpdateAmmsConfigFeeAuthorityEvent from signature {}",
                    signature
                );
            }
            LiquidityPoolProgram::UpdateAmmsConfigProtocolFeeRateEvent(event) => {
                scylla_session
                        .query_unpaged(
                            "INSERT INTO upd_amms_cfg_protocol_fee_events \
                            (signature, timestamp, event_id, authority, amms_config, new_protocol_fee_rate_basis_points) \
                            VALUES (?, ?, ?, ?, ?, ?)",
                            (
                                &signature,
                                event.timestamp,
                                Self::get_uuid(event.timestamp as u64),
                                event.authority.to_string(),
                                event.amms_config.to_string(),
                                event.new_protocol_fee_rate_basis_points as i16,
                            ),
                        )
                        .await?;
                debug!(
                    "Saving UpdateAmmsConfigProtocolFeeRateEvent from signature {}",
                    signature
                );
            }
            LiquidityPoolProgram::UpdateAmmsConfigProvidersFeeRateEvent(event) => {
                scylla_session
                        .query_unpaged(
                            "INSERT INTO upd_amms_cfg_prov_fee_events \
                            (signature, timestamp, event_id, authority, amms_config, new_providers_fee_rate_basis_points) \
                            VALUES (?, ?, ?, ?, ?, ?)",
                            (
                                &signature,
                                event.timestamp,
                                Self::get_uuid(event.timestamp as u64),
                                event.authority.to_string(),
                                event.amms_config.to_string(),
                                event.new_providers_fee_rate_basis_points as i16,
                            ),
                        )
                        .await?;
                debug!(
                    "Saving UpdateAmmsConfigProvidersFeeRateEvent from signature {}",
                    signature
                );
            }
            LiquidityPoolProgram::UpdateAmmsConfigsManagerAuthorityEvent(event) => {
                scylla_session
                    .query_unpaged(
                        "INSERT INTO upd_amms_cfg_mgr_auth_events \
                            (signature, timestamp, authority, new_authority) \
                            VALUES (?, ?, ?, ?)",
                        (
                            &signature,
                            event.timestamp,
                            event.authority.to_string(),
                            event.new_authority.to_string(),
                        ),
                    )
                    .await?;
                debug!(
                    "Saving UpdateAmmsConfigsManagerAuthorityEvent from signature {}",
                    signature
                );
            }
            LiquidityPoolProgram::UpdateAmmsConfigsManagerHeadAuthorityEvent(event) => {
                scylla_session
                    .query_unpaged(
                        "INSERT INTO upd_amms_cfg_mgr_head_auth_events \
                            (signature, timestamp, head_authority, new_head_authority) \
                            VALUES (?, ?, ?, ?)",
                        (
                            &signature,
                            event.timestamp,
                            event.head_authority.to_string(),
                            event.new_head_authority.to_string(),
                        ),
                    )
                    .await?;
                debug!(
                    "Saving UpdateAmmsConfigsManagerHeadAuthorityEvent from signature {}",
                    signature
                );
            }
            LiquidityPoolProgram::InitializeAmmsConfigEvent(event) => {
                scylla_session
                    .query_unpaged(
                        "INSERT INTO init_amms_config_events \
                            (signature, timestamp, authority, amms_config, fee_authority, \
                            protocol_fee_rate_basis_points, providers_fee_rate_basis_points, id) \
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        (
                            &signature,
                            event.timestamp,
                            event.authority.to_string(),
                            event.amms_config.to_string(),
                            event.fee_authority.to_string(),
                            event.protocol_fee_rate_basis_points as i16,
                            event.providers_fee_rate_basis_points as i16,
                            event.id as i64,
                        ),
                    )
                    .await?;
                debug!(
                    "Saving InitializeAmmsConfigEvent from signature {}",
                    signature
                );
            }
            LiquidityPoolProgram::InitializeAmmsConfigsManagerEvent(event) => {
                scylla_session
                    .query_unpaged(
                        "INSERT INTO init_amms_cfg_mgr_events \
                            (signature, timestamp, signer, authority, head_authority) \
                            VALUES (?, ?, ?, ?, ?)",
                        (
                            &signature,
                            event.timestamp,
                            event.signer.to_string(),
                            event.authority.to_string(),
                            event.head_authority.to_string(),
                        ),
                    )
                    .await?;
                debug!(
                    "Saving InitializeAmmsConfigsManagerEvent from signature {}",
                    signature
                );
            }
        }
        Ok(())
    }
}

#[async_trait]
impl EventsSaver<LaunchpoolProgram> for ScyllaDbEventsSaver<LaunchpoolProgram> {
    async fn save_event(&self, signature: &String, event: LaunchpoolProgram) -> AnyResult<()> {
        let scylla_session = &self.scylla_session;
        match event {
            LaunchpoolProgram::OpenStakePositionEvent(event) => {
                let mut batch = Batch::new(BatchType::Unlogged);

                batch.append_statement(
                    "INSERT INTO stake_positions_by_user \
                        (signature, event_id, timestamp, user, launchpool, stake_position) \
                        VALUES (?, ?, ?, ?, ?, ?)",
                );
                batch.append_statement(
                    "INSERT INTO stake_positions_by_launchpool \
                        (signature, event_id, timestamp, launchpool, owner, stake_position) \
                        VALUES (?, ?, ?, ?, ?, ?)",
                );
                batch.append_statement(
                    "INSERT INTO stake_positions \
                        (signature, timestamp, user, launchpool, stake_position) \
                        VALUES (?, ?, ?, ?, ?)",
                );
                batch.append_statement(
                    "INSERT INTO stake_positions_status (stake_position, status) VALUES (?, ?)",
                );

                let timestamp = event.stake_timestamp;
                let timeuuid = Self::get_uuid(timestamp);
                let stake_position = event.stake_position.to_string();
                let user = event.signer.to_string();
                let launchpool = event.launchpool.to_string();

                let values = (
                    (
                        &signature,
                        timeuuid,
                        timestamp as i64,
                        &user,
                        &launchpool,
                        &stake_position,
                    ),
                    (
                        &signature,
                        timeuuid,
                        timestamp as i64,
                        &launchpool,
                        &user,
                        &stake_position,
                    ),
                    (
                        &signature,
                        timestamp as i64,
                        &user,
                        &launchpool,
                        &stake_position,
                    ),
                    (&stake_position, PositionStatus::Opened as i8),
                );
                scylla_session.batch(&batch, values).await?;
                debug!("Saving OpenStakePositionEvent from signature {}", signature);
            }
            LaunchpoolProgram::IncreaseStakePositionEvent(_) => {}
            LaunchpoolProgram::CloseStakePositionEvent(event) => {
                let mut batch = Batch::new(BatchType::Unlogged);
                batch.append_statement(
                    "INSERT INTO stake_positions_status (stake_position, status) VALUES (?, ?)",
                );
                batch.append_statement(
                    "INSERT INTO launchpools_status (launchpool, status) VALUES (?, ?)",
                );
                let values = (
                    (
                        event.stake_position.to_string(),
                        PositionStatus::Closed as i8,
                    ),
                    (
                        event.launchpool.to_string(),
                        LaunchpoolStatus::Finished as i8,
                    ),
                );
                scylla_session.batch(&batch, values).await?;
                debug!(
                    "Saving CloseStakePositionEvent from signature {}",
                    signature
                );
            }
            LaunchpoolProgram::CollectProtocolRewardEvent(event) => {
                scylla_session
                    .query_unpaged(
                        "INSERT INTO launchpools_status (launchpool, status) VALUES (?, ?)",
                        (
                            event.launchpool.to_string(),
                            LaunchpoolStatus::ClaimedProtocolReward as i8,
                        ),
                    )
                    .await?;
                debug!(
                    "Saving CollectProtocolRewardEvent from signature {}",
                    signature
                );
            }
            LaunchpoolProgram::LaunchLaunchpoolEvent(event) => {
                scylla_session
                    .query_unpaged(
                        "INSERT INTO launchpools_status (launchpool, status) VALUES (?, ?)",
                        (
                            event.launchpool.to_string(),
                            LaunchpoolStatus::Launched as i8,
                        ),
                    )
                    .await?;
                debug!("Saving LaunchLaunchpoolEvent from signature {}", signature);
            }
            LaunchpoolProgram::InitializeLaunchpoolEvent(event) => {
                let launchpool = event.launchpool.to_string();

                let mut batch = Batch::new(BatchType::Unlogged);

                batch.append_statement(
                        "INSERT INTO launchpools \
                        (signature, timestamp, authority, launchpool, launchpools_config, reward_mint, reward_vault) \
                        VALUES (?, ?, ?, ?, ?, ?, ?)",
                    );
                batch.append_statement(
                    "INSERT INTO launchpools_status (launchpool, status) VALUES (?, ?)",
                );

                let values = (
                    (
                        &signature,
                        event.timestamp,
                        event.authority.to_string(),
                        &launchpool,
                        event.launchpools_config.to_string(),
                        event.reward_mint.to_string(),
                        event.reward_vault.to_string(),
                    ),
                    (&launchpool, LaunchpoolStatus::Initialized as i8),
                );

                scylla_session.batch(&batch, values).await?;
                debug!(
                    "Saving InitializeLaunchpoolEvent from signature {}",
                    signature
                );
            }
            LaunchpoolProgram::InitializeLaunchpoolsConfigEvent(event) => {
                scylla_session
                        .query_unpaged(
                            "INSERT INTO initialize_launchpools_config_events \
                            (signature, timestamp, authority, launchpools_config, reward_authority, stakable_mint, \
                            min_position_size, max_position_size, protocol_reward_share_basis_points, duration, id) \
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            (
                                &signature,
                                event.timestamp,
                                event.authority.to_string(),
                                event.launchpools_config.to_string(),
                                event.reward_authority.to_string(),
                                event.stakable_mint.to_string(),
                                event.min_position_size.to_le_bytes().to_vec(),
                                event.max_position_size.to_le_bytes().to_vec(),
                                event.protocol_reward_share_basis_points as i16,
                                event.duration.to_le_bytes().to_vec(),
                                event.id as i64,
                            ),
                        )
                        .await?;
                debug!(
                    "Saving InitializeLaunchpoolsConfigEvent from signature {}",
                    signature
                );
            }
            LaunchpoolProgram::UpdateLaunchpoolsConfigRewardAuthorityEvent(event) => {
                scylla_session
                        .query_unpaged(
                            "INSERT INTO upd_lp_cfg_reward_auth_events \
                            (signature, timestamp, event_id, authority, launchpools_config, new_reward_authority) \
                            VALUES (?, ?, ?, ?, ?, ?)",
                            (
                                &signature,
                                event.timestamp,
                                Self::get_uuid(event.timestamp as u64),
                                event.authority.to_string(),
                                event.launchpools_config.to_string(),
                                event.new_reward_authority.to_string(),
                            ),
                        )
                        .await?;
                debug!(
                    "Saving UpdateLaunchpoolsConfigRewardAuthorityEvent from signature {}",
                    signature
                );
            }
            LaunchpoolProgram::UpdateLaunchpoolsConfigProtocolRewardShareEvent(event) => {
                scylla_session
                        .query_unpaged(
                            "INSERT INTO upd_lp_cfg_protocol_reward_events \
                            (signature, timestamp, event_id, authority, launchpools_config, new_protocol_reward_share_basis_points) \
                            VALUES (?, ?, ?, ?, ?, ?)",
                            (
                                &signature,
                                event.timestamp,
                                Self::get_uuid(event.timestamp as u64),
                                event.authority.to_string(),
                                event.launchpools_config.to_string(),
                                event.new_protocol_reward_share_basis_points as i16,
                            ),
                        )
                        .await?;
                debug!(
                    "Saving UpdateLaunchpoolsConfigProtocolRewardShareEvent from signature {}",
                    signature
                );
            }
            LaunchpoolProgram::UpdateLaunchpoolsConfigPositionSizesEvent(event) => {
                scylla_session
                        .query_unpaged(
                            "INSERT INTO update_launchpools_config_position_sizes_events \
                            (signature, timestamp, event_id, authority, launchpools_config, new_min_position_size, new_max_position_size) \
                            VALUES (?, ?, ?, ?, ?, ?, ?)",
                            (
                                &signature,
                                event.timestamp,
                                Self::get_uuid(event.timestamp as u64),
                                event.authority.to_string(),
                                event.launchpools_config.to_string(),
                                event.new_min_position_size.to_be_bytes().as_slice(),
                                event.new_max_position_size.to_be_bytes().as_slice(),
                            ),
                        )
                        .await?;
                debug!(
                    "Saving UpdateLaunchpoolsConfigPositionSizesEvent from signature {}",
                    signature
                );
            }
            LaunchpoolProgram::UpdateLaunchpoolsConfigDurationEvent(event) => {
                scylla_session
                        .query_unpaged(
                            "INSERT INTO update_launchpools_config_duration_events \
                            (signature, timestamp, event_id, authority, launchpools_config, new_duration) \
                            VALUES (?, ?, ?, ?, ?, ?)",
                            (
                                &signature,
                                event.timestamp,
                                Self::get_uuid(event.timestamp as u64),
                                event.authority.to_string(),
                                event.launchpools_config.to_string(),
                                event.new_duration.to_be_bytes().as_slice(),
                            ),
                        )
                        .await?;
                debug!(
                    "Saving UpdateLaunchpoolsConfigDurationEvent from signature {}",
                    signature
                );
            }
            LaunchpoolProgram::UpdateLaunchpoolsConfigsManagerAuthorityEvent(event) => {
                scylla_session
                    .query_unpaged(
                        "INSERT INTO update_lp_cfg_mgr_auth_events \
                            (signature, timestamp, authority, new_authority) \
                            VALUES (?, ?, ?, ?)",
                        (
                            &signature,
                            event.timestamp,
                            event.authority.to_string(),
                            event.new_authority.to_string(),
                        ),
                    )
                    .await?;
                debug!(
                    "Saving UpdateLaunchpoolsConfigsManagerAuthorityEvent from signature {}",
                    signature
                );
            }
            LaunchpoolProgram::UpdateLaunchpoolsConfigsManagerHeadAuthorityEvent(event) => {
                scylla_session
                    .query_unpaged(
                        "INSERT INTO update_lp_cfg_mgr_head_auth_events \
                            (signature, timestamp, head_authority, new_head_authority) \
                            VALUES (?, ?, ?, ?)",
                        (
                            &signature,
                            event.timestamp,
                            event.head_authority.to_string(),
                            event.new_head_authority.to_string(),
                        ),
                    )
                    .await?;
                debug!(
                    "Saving UpdateLaunchpoolsConfigsManagerHeadAuthorityEvent from signature {}",
                    signature
                );
            }
            LaunchpoolProgram::InitializeLaunchpoolsConfigsManagerEvent(event) => {
                scylla_session
                    .query_unpaged(
                        "INSERT INTO initialize_launchpools_configs_manager_events \
                            (signature, timestamp, signer, authority, head_authority) \
                            VALUES (?, ?, ?, ?, ?)",
                        (
                            &signature,
                            event.timestamp,
                            event.signer.to_string(),
                            event.authority.to_string(),
                            event.head_authority.to_string(),
                        ),
                    )
                    .await?;
                debug!(
                    "Saving InitializeLaunchpoolsConfigsManagerEvent from signature {}",
                    signature
                );
            }
        }
        Ok(())
    }
}

impl<T: AnchorProgram + 'static> Drop for ScyllaDbEventsSaver<T> {
    fn drop(&mut self) {
        debug!("ScyllaDbEventsSaver dropped");
    }
}
