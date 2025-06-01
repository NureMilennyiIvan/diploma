use crate::launchpool::context::LaunchpoolContext;
use crate::launchpool::core::instructions::{
    close_stake_position_ix, collect_protocol_reward_ix, increase_stake_position_ix,
    initialize_launchpool_ix, initialize_launchpools_config_ix,
    initialize_launchpools_configs_manager_ix, launch_launchpool_ix, open_stake_position_ix,
    update_launchpools_config_duration_ix, update_launchpools_config_position_sizes_ix,
    update_launchpools_config_protocol_reward_share_ix,
    update_launchpools_config_reward_authority_ix, update_launchpools_configs_manager_authority_ix,
    update_launchpools_configs_manager_head_authority_ix,
};
use crate::utils::clients::{ProgramContext, SolanaRpcClient};
use crate::utils::types::{build_unsigned_transaction, UnsignedTransaction};
use anyhow::Result as AnyResult;
use solana_sdk::pubkey::Pubkey;

pub async fn initialize_launchpools_configs_manager_tx(
    context: &LaunchpoolContext,
    signer: Pubkey,
    authority: Pubkey,
    head_authority: Pubkey,
) -> AnyResult<(UnsignedTransaction, Pubkey)> {
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let (ix, launchpools_configs_manager_pubkey) = initialize_launchpools_configs_manager_ix(signer, authority, head_authority);
    Ok((build_unsigned_transaction(&signer, [ix], blockhash, []), launchpools_configs_manager_pubkey))
}
pub async fn update_launchpools_configs_manager_authority_tx(
    context: &LaunchpoolContext,
    authority: Pubkey,
    new_authority: Pubkey,
) -> AnyResult<UnsignedTransaction> {
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = update_launchpools_configs_manager_authority_ix(authority, new_authority);
    Ok(build_unsigned_transaction(&authority, [ix], blockhash, []))
}
pub async fn update_launchpools_configs_manager_head_authority_tx(
    context: &LaunchpoolContext,
    head_authority: Pubkey,
    new_head_authority: Pubkey,
) -> AnyResult<UnsignedTransaction> {
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix =
        update_launchpools_configs_manager_head_authority_ix(head_authority, new_head_authority);
    Ok(build_unsigned_transaction(
        &head_authority,
        [ix],
        blockhash,
        [],
    ))
}
pub async fn initialize_launchpools_config_tx(
    context: &LaunchpoolContext,
    authority: Pubkey,
    launchpools_configs_manager: Pubkey,
    reward_authority: Pubkey,
    stakable_mint: Pubkey,
    min_position_size: u64,
    max_position_size: u64,
    protocol_reward_share_basis_points: u16,
    duration: u64,
) -> AnyResult<(UnsignedTransaction, Pubkey)> {
    let launchpools_configs_manager_account = context.solana_rpc_client().fetch_launchpools_configs_manager(&launchpools_configs_manager).await?;
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let (ix, launchpools_config_pubkey) = initialize_launchpools_config_ix(
        authority,
        launchpools_configs_manager_account.configs_count,
        reward_authority,
        stakable_mint,
        min_position_size,
        max_position_size,
        protocol_reward_share_basis_points,
        duration,
    );
    Ok((build_unsigned_transaction(&authority, [ix], blockhash, []), launchpools_config_pubkey))
}

pub async fn update_launchpools_config_reward_authority_tx(
    context: &LaunchpoolContext,
    authority: Pubkey,
    launchpools_config: Pubkey,
    new_reward_authority: Pubkey,
) -> AnyResult<UnsignedTransaction> {
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = update_launchpools_config_reward_authority_ix(
        authority,
        launchpools_config,
        new_reward_authority,
    );
    Ok(build_unsigned_transaction(&authority, [ix], blockhash, []))
}

pub async fn update_launchpools_config_protocol_reward_share_tx(
    context: &LaunchpoolContext,
    authority: Pubkey,
    launchpools_config: Pubkey,
    new_protocol_reward_share_basis_points: u16,
) -> AnyResult<UnsignedTransaction> {
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = update_launchpools_config_protocol_reward_share_ix(
        authority,
        launchpools_config,
        new_protocol_reward_share_basis_points,
    );
    Ok(build_unsigned_transaction(&authority, [ix], blockhash, []))
}

pub async fn update_launchpools_config_position_sizes_tx(
    context: &LaunchpoolContext,
    authority: Pubkey,
    launchpools_config: Pubkey,
    new_min_position_size: u64,
    new_max_position_size: u64,
) -> AnyResult<UnsignedTransaction> {
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = update_launchpools_config_position_sizes_ix(
        authority,
        launchpools_config,
        new_min_position_size,
        new_max_position_size,
    );
    Ok(build_unsigned_transaction(&authority, [ix], blockhash, []))
}

pub async fn update_launchpools_config_duration_tx(
    context: &LaunchpoolContext,
    authority: Pubkey,
    launchpools_config: Pubkey,
    new_duration: u64,
) -> AnyResult<UnsignedTransaction> {
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = update_launchpools_config_duration_ix(authority, launchpools_config, new_duration);
    Ok(build_unsigned_transaction(&authority, [ix], blockhash, []))
}

pub async fn initialize_launchpool_tx(
    context: &LaunchpoolContext,
    authority: Pubkey,
    launchpools_config: Pubkey,
    reward_mint: Pubkey,
    initial_reward_amount: u64,
) -> AnyResult<(UnsignedTransaction, Pubkey)> {
    let reward_mint_account = context.get_token_mint(&reward_mint).await?;
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let (ix, launchpool_pubkey) = initialize_launchpool_ix(
        authority,
        launchpools_config,
        reward_mint,
        *reward_mint_account.program(),
        initial_reward_amount,
    );
    Ok((build_unsigned_transaction(&authority, [ix], blockhash, []), launchpool_pubkey))
}

pub async fn launch_launchpool_tx(
    context: &LaunchpoolContext,
    authority: Pubkey,
    launchpool: Pubkey,
    start_timestamp: u64,
) -> AnyResult<UnsignedTransaction> {
    let launchpool_keys = context.get_launchpool_keys(&launchpool).await?;
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = launch_launchpool_ix(
        authority,
        launchpool_keys.launchpools_config,
        launchpool,
        launchpool_keys.reward_mint,
        start_timestamp,
    );
    Ok(build_unsigned_transaction(&authority, [ix], blockhash, []))
}

pub async fn open_stake_position_tx(
    context: &LaunchpoolContext,
    signer: Pubkey,
    signer_stakable_account: Option<Pubkey>,
    launchpool: Pubkey,
    stake_amount: u64,
) -> AnyResult<(UnsignedTransaction, Pubkey)> {
    let launchpool_keys = context.get_launchpool_keys(&launchpool).await?;
    let launchpools_config_keys = context
        .get_launchpools_config_keys(&launchpool_keys.launchpools_config)
        .await?;
    let stakable_token_account = context
        .get_token_mint(&launchpools_config_keys.stakable_mint)
        .await?;
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let (ix, stake_position_pubkey) = open_stake_position_ix(
        signer,
        signer_stakable_account,
        launchpool_keys.launchpools_config,
        launchpool,
        launchpools_config_keys.stakable_mint,
        *stakable_token_account.program(),
        stake_amount,
    );
    Ok((build_unsigned_transaction(&signer, [ix], blockhash, []), stake_position_pubkey))
}

pub async fn increase_stake_position_tx(
    context: &LaunchpoolContext,
    signer: Pubkey,
    signer_stakable_account: Option<Pubkey>,
    stake_position: Pubkey,
    stake_increase_amount: u64,
) -> AnyResult<UnsignedTransaction> {
    let stake_position_keys = context.get_stake_position_keys(&stake_position).await?;
    let launchpool_keys = context
        .get_launchpool_keys(&stake_position_keys.launchpool)
        .await?;
    let launchpools_config_keys = context
        .get_launchpools_config_keys(&launchpool_keys.launchpools_config)
        .await?;
    let stakable_token_account = context
        .get_token_mint(&launchpools_config_keys.stakable_mint)
        .await?;
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = increase_stake_position_ix(
        signer,
        signer_stakable_account,
        launchpool_keys.launchpools_config,
        stake_position_keys.launchpool,
        launchpools_config_keys.stakable_mint,
        stake_position,
        *stakable_token_account.program(),
        stake_increase_amount,
    );
    Ok(build_unsigned_transaction(&signer, [ix], blockhash, []))
}

pub async fn close_stake_position_tx(
    context: &LaunchpoolContext,
    signer: Pubkey,
    signer_stakable_account: Option<Pubkey>,
    stake_position: Pubkey,
) -> AnyResult<UnsignedTransaction> {
    let stake_position_keys = context.get_stake_position_keys(&stake_position).await?;
    let launchpool_keys = context
        .get_launchpool_keys(&stake_position_keys.launchpool)
        .await?;
    let launchpools_config_keys = context
        .get_launchpools_config_keys(&launchpool_keys.launchpools_config)
        .await?;
    let (stakable_token_account, reward_token_account) = tokio::try_join!(
        context.get_token_mint(&launchpools_config_keys.stakable_mint),
        context.get_token_mint(&launchpool_keys.reward_mint),
    )?;
    let blockhash = context.solana_rpc_client().get_blockhash().await?;
    let ix = close_stake_position_ix(
        signer,
        signer_stakable_account,
        launchpool_keys.launchpools_config,
        stake_position_keys.launchpool,
        launchpools_config_keys.stakable_mint,
        launchpool_keys.reward_mint,
        stake_position,
        *stakable_token_account.program(),
        *reward_token_account.program(),
    );
    Ok(build_unsigned_transaction(&signer, [ix], blockhash, []))
}

pub async fn collect_protocol_reward_tx(
    context: &LaunchpoolContext,
    signer: Pubkey,
    launchpool: Pubkey,
) -> AnyResult<UnsignedTransaction> {
    let launchpool_keys = context.get_launchpool_keys(&launchpool).await?;
    let solana_rpc_client = context.solana_rpc_client();
    let (launchpools_config_account, reward_mint_account) = tokio::try_join!(
        solana_rpc_client.fetch_launchpools_config(&launchpool_keys.launchpools_config),
        context.get_token_mint(&launchpool_keys.reward_mint)
    )?;
    let blockhash = solana_rpc_client.get_blockhash().await?;
    let ix = collect_protocol_reward_ix(
        signer,
        launchpools_config_account.reward_authority,
        launchpool_keys.launchpools_config,
        launchpool_keys.reward_mint,
        launchpool,
        *reward_mint_account.program(),
    );
    Ok(build_unsigned_transaction(&signer, [ix], blockhash, []))
}
