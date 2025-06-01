CREATE KEYSPACE IF NOT EXISTS launchpool_data
    WITH replication = {
        'class': 'SimpleStrategy',
        'replication_factor': 1
        };

USE launchpool_data;

CREATE TABLE IF NOT EXISTS initialize_launchpools_configs_manager_events
(
    signature      text PRIMARY KEY,
    timestamp      bigint,
    signer         text,
    authority      text,
    head_authority text
);

CREATE TABLE IF NOT EXISTS update_lp_cfg_mgr_auth_events
(
    signature     text PRIMARY KEY,
    timestamp     bigint,
    authority     text,
    new_authority text
);

CREATE TABLE IF NOT EXISTS update_lp_cfg_mgr_head_auth_events
(
    signature          text PRIMARY KEY,
    timestamp          bigint,
    head_authority     text,
    new_head_authority text
);

CREATE TABLE IF NOT EXISTS initialize_launchpools_config_events
(
    signature                          text,
    timestamp                          bigint,
    authority                          text,
    launchpools_config                 text PRIMARY KEY,
    reward_authority                   text,
    stakable_mint                      text,
    min_position_size                  blob,
    max_position_size                  blob,
    protocol_reward_share_basis_points smallint,
    duration                           blob,
    id                                 bigint,
);

CREATE TABLE IF NOT EXISTS update_launchpools_config_duration_events
(
    signature          text,
    timestamp          bigint,
    event_id           timeuuid,
    authority          text,
    launchpools_config text,
    new_duration       blob,
    PRIMARY KEY ((launchpools_config), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC);

CREATE TABLE IF NOT EXISTS update_launchpools_config_position_sizes_events
(
    signature             text,
    timestamp             bigint,
    event_id              timeuuid,
    authority             text,
    launchpools_config    text,
    new_min_position_size blob,
    new_max_position_size blob,
    PRIMARY KEY ((launchpools_config), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC);

CREATE TABLE IF NOT EXISTS upd_lp_cfg_protocol_reward_events
(
    signature                              text,
    timestamp                              bigint,
    event_id                               timeuuid,
    authority                              text,
    launchpools_config                     text,
    new_protocol_reward_share_basis_points smallint,
    PRIMARY KEY ((launchpools_config), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC);

CREATE TABLE IF NOT EXISTS upd_lp_cfg_reward_auth_events
(
    signature            text,
    timestamp            bigint,
    event_id             timeuuid,
    authority            text,
    launchpools_config   text,
    new_reward_authority text,
    PRIMARY KEY ((launchpools_config), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC);

CREATE TABLE IF NOT EXISTS launchpools
(
    signature          text,
    timestamp          bigint,
    authority          text,
    launchpool         text PRIMARY KEY,
    launchpools_config text,
    reward_mint        text,
    reward_vault       text
);

CREATE TABLE IF NOT EXISTS launchpools_status
(
    launchpool text PRIMARY KEY,
    status     tinyint
);

CREATE TABLE IF NOT EXISTS stake_positions
(
    signature      text,
    timestamp      bigint,
    user           text,
    launchpool     text,
    stake_position text  PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS stake_positions_by_user
(
    signature      text,
    event_id       timeuuid,
    timestamp      bigint,
    user           text,
    launchpool     text,
    stake_position text,
    PRIMARY KEY ((user), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC);

CREATE TABLE IF NOT EXISTS stake_positions_by_launchpool
(
    signature      text,
    event_id       timeuuid,
    timestamp      bigint,
    launchpool     text,
    owner          text,
    stake_position text,
    PRIMARY KEY ((launchpool), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC);

CREATE TABLE IF NOT EXISTS stake_positions_status
(
    stake_position text PRIMARY KEY,
    status         tinyint,
);