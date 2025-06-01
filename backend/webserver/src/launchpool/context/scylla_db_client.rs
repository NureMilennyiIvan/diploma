use scylla::client::session::Session;
use solana_sdk::pubkey::Pubkey;
use anyhow::{Context, Result as AnyResult};
use tracing::debug;
use crate::launchpool::models::{LaunchpoolKeys, LaunchpoolKeysScylla, LaunchpoolsConfigKeys, LaunchpoolsConfigKeysScylla, StakePositionKeys, StakePositionKeysScylla};
use crate::utils::clients::ScyllaDbClient;

pub struct LaunchpoolScyllaDbClient {
    launchpool_session: Session
}
impl LaunchpoolScyllaDbClient {
    pub fn new(launchpool_session: Session) -> Self {
        Self{
            launchpool_session
        }
    }

    pub async fn fetch_launchpool_keys(&self, launchpool: &Pubkey) -> AnyResult<Option<LaunchpoolKeys>> {
        let rows = self
            .launchpool_session
            .query_unpaged(
                "SELECT launchpools_config, reward_mint FROM launchpools WHERE launchpool = ?",
                (launchpool.to_string(),),
            )
            .await
            .context("failed to fetch launchpool keys")?
            .into_rows_result()?;

        debug!(?launchpool, rows = rows.rows_num(), "Fetched launchpool keys rows");

        if rows.rows_num() == 0 {
            return Ok(None);
        }

        let launchpool_keys: LaunchpoolKeys = rows.first_row::<LaunchpoolKeysScylla>()?.try_into()?;
        debug!(?launchpool, "Parsed LaunchpoolKeys");
        Ok(Some(launchpool_keys))
    }

    pub async fn fetch_launchpools_config_keys(&self, launchpools_config: &Pubkey) -> AnyResult<Option<LaunchpoolsConfigKeys>> {
        let rows = self
            .launchpool_session
            .query_unpaged(
                "SELECT stakable_mint FROM initialize_launchpools_config_events WHERE launchpools_config = ?",
                (launchpools_config.to_string(),),
            )
            .await
            .context("failed to fetch launchpools_config keys")?
            .into_rows_result()?;

        debug!(?launchpools_config, rows = rows.rows_num(), "Fetched launchpools_config keys rows");

        if rows.rows_num() == 0 {
            return Ok(None);
        }

        let keys: LaunchpoolsConfigKeys = rows.first_row::<LaunchpoolsConfigKeysScylla>()?.try_into()?;
        debug!(?launchpools_config, "Parsed LaunchpoolsConfigKeys");
        Ok(Some(keys))
    }

    pub async fn fetch_stake_position_keys(&self, stake_position: &Pubkey) -> AnyResult<Option<StakePositionKeys>> {
        let rows = self
            .launchpool_session
            .query_unpaged(
                "SELECT user, launchpool FROM stake_positions WHERE stake_position = ?",
                (stake_position.to_string(),),
            )
            .await
            .context("failed to fetch stake_position keys")?
            .into_rows_result()?;

        debug!(?stake_position, rows = rows.rows_num(), "Fetched stake_position keys rows");

        if rows.rows_num() == 0 {
            return Ok(None);
        }

        let keys: StakePositionKeys = rows.first_row::<StakePositionKeysScylla>()?.try_into()?;
        debug!(?stake_position, "Parsed StakePositionKeys");
        Ok(Some(keys))
    }
}
impl ScyllaDbClient for LaunchpoolScyllaDbClient {
    fn session(&self) -> &Session{
        &self.launchpool_session
    }
}