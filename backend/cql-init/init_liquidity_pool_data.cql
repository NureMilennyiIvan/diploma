CREATE KEYSPACE IF NOT EXISTS liquidity_pool_data
    WITH replication = {
        'class': 'SimpleStrategy',
        'replication_factor': 1
        };

USE liquidity_pool_data;

CREATE TABLE IF NOT EXISTS init_amms_cfg_mgr_events
(
    signature      text PRIMARY KEY,
    timestamp      bigint,
    signer         text,
    authority      text,
    head_authority text
);

CREATE TABLE IF NOT EXISTS upd_amms_cfg_mgr_auth_events
(
    signature     text PRIMARY KEY,
    timestamp     bigint,
    authority     text,
    new_authority text
);

CREATE TABLE IF NOT EXISTS upd_amms_cfg_mgr_head_auth_events
(
    signature          text PRIMARY KEY,
    timestamp          bigint,
    head_authority     text,
    new_head_authority text
);

CREATE TABLE IF NOT EXISTS init_amms_config_events
(
    signature                       text,
    timestamp                       bigint,
    amms_config                     text PRIMARY KEY,
    authority                       text,
    fee_authority                   text,
    protocol_fee_rate_basis_points  smallint,
    providers_fee_rate_basis_points smallint,
    id                              bigint
);

CREATE TABLE IF NOT EXISTS upd_amms_cfg_fee_auth_events
(
    signature         text,
    timestamp         bigint,
    event_id          timeuuid,
    authority         text,
    amms_config       text,
    new_fee_authority text,
    PRIMARY KEY ((amms_config), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC);

CREATE TABLE IF NOT EXISTS upd_amms_cfg_protocol_fee_events
(
    signature                          text,
    timestamp                          bigint,
    event_id                           timeuuid,
    authority                          text,
    amms_config                        text,
    new_protocol_fee_rate_basis_points smallint,
    PRIMARY KEY ((amms_config), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC);

CREATE TABLE IF NOT EXISTS upd_amms_cfg_prov_fee_events
(
    signature                           text,
    timestamp                           bigint,
    event_id                            timeuuid,
    authority                           text,
    amms_config                         text,
    new_providers_fee_rate_basis_points smallint,
    PRIMARY KEY ((amms_config), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC);

CREATE TABLE IF NOT EXISTS cp_amms_keys
(
    cp_amm      text PRIMARY KEY,
    amms_config text,
    base_mint   text,
    quote_mint  text,
    lp_mint     text
);

CREATE TABLE IF NOT EXISTS uninitialized_cp_amms
(
    signature   text,
    timestamp   bigint,
    event_id    timeuuid,
    creator     text,
    cp_amm      text,
    amms_config text,
    base_mint   text,
    quote_mint  text,
    lp_mint     text,
    PRIMARY KEY ((creator), event_id, cp_amm)
) WITH CLUSTERING ORDER BY (event_id DESC);

CREATE TABLE IF NOT EXISTS launched_cp_amms
(
    signature   text,
    timestamp   bigint,
    event_id    timeuuid,
    creator     text,
    cp_amm      text PRIMARY KEY,
    amms_config text,
    base_mint   text,
    quote_mint  text,
    lp_mint     text
);

CREATE TABLE IF NOT EXISTS launched_cp_amms_by_base_or_quote
(
    signature          text,
    timestamp          bigint,
    creator            text,
    cp_amm             text,
    amms_config        text,
    base_or_quote_mint text,
    remaining_mint     text,
    lp_mint            text,
    PRIMARY KEY ((base_or_quote_mint), cp_amm)
);

CREATE TABLE IF NOT EXISTS launched_cp_amms_by_base_and_quote
(
    signature   text,
    timestamp   bigint,
    creator     text,
    cp_amm      text,
    amms_config text,
    base_mint   text,
    quote_mint  text,
    lp_mint     text,
    PRIMARY KEY ((base_mint, quote_mint), cp_amm)
);

CREATE TABLE IF NOT EXISTS cp_amms_liquidity
(
    cp_amm    text PRIMARY KEY,
    liquidity blob
);

CREATE TABLE IF NOT EXISTS trades_by_cp_amm
(
    signature       text,
    timestamp       bigint,
    event_id        timeuuid,
    swapper         text,
    cp_amm          text,
    swapped_amount  blob,
    received_amount blob,
    is_in_out       boolean,
    PRIMARY KEY ((cp_amm), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC);

CREATE TABLE IF NOT EXISTS trades_by_user
(
    signature       text,
    timestamp       bigint,
    event_id        timeuuid,
    swapper         text,
    cp_amm          text,
    swapped_amount  blob,
    received_amount blob,
    is_in_out       boolean,
    PRIMARY KEY ((swapper), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC);

CREATE TABLE IF NOT EXISTS collect_fees_from_cp_amm_event
(
    signature                     text,
    timestamp                     bigint,
    event_id                      timeuuid,
    cp_amm                        text,
    signer                        text,
    fee_authority                 text,
    fee_authority_base_account    text,
    fee_authority_quote_account   text,
    withdrawn_protocol_base_fees  blob,
    withdrawn_protocol_quote_fees blob,
    PRIMARY KEY ((cp_amm), event_id)
) WITH CLUSTERING ORDER BY (event_id DESC);
