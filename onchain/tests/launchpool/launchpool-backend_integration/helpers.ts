import fs from "fs";
import path from "path";
import {config as loadEnv} from "dotenv";
import {createTestUser, post, postBase64Tx, postBase64TxAndPubkey, requireEnv, RpcClient} from "../../helpers";
import {
    Address,
    createKeyPairSignerFromBytes,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    KeyPairSigner
} from "@solana/kit";

loadEnv({
    path: path.resolve(__dirname, "../../../../.env.routes"),
});



export type LaunchpoolBackendIntegrationTestingEnvironment = {
    owner: KeyPairSigner;
    headAuthority: KeyPairSigner;
    launchpoolsConfigsManagerAuthority: KeyPairSigner;
    user: KeyPairSigner;
    rpcClient: RpcClient;
    baseUrl: string;
    routes: {
        LAUNCHPOOL_SCOPE: string;
        INIT_LAUNCHPOOL_CONFIGS_MANAGER: string;
        UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_AUTHORITY: string;
        UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_HEAD_AUTHORITY: string;
        INIT_LAUNCHPOOLS_CONFIG: string;
        UPDATE_LAUNCHPOOLS_CONFIG_REWARD_AUTHORITY: string;
        UPDATE_LAUNCHPOOLS_CONFIG_PROTOCOL_REWARD_SHARE: string;
        UPDATE_LAUNCHPOOLS_CONFIG_DURATION: string;
        UPDATE_LAUNCHPOOLS_CONFIG_POSITION_SIZES: string;
        INIT_LAUNCHPOOL: string;
        LAUNCH_LAUNCHPOOL: string;
        OPEN_STAKE_POSITION: string;
        INCREASE_STAKE_POSITION: string;
        CLOSE_STAKE_POSITION: string;
        COLLECT_PROTOCOL_REWARD: string;
    };
};

export const createLaunchpoolBackendIntegrationTestingEnvironment = async (): Promise<LaunchpoolBackendIntegrationTestingEnvironment> => {
    const owner = await createKeyPairSignerFromBytes(
        Buffer.from(JSON.parse(fs.readFileSync("./owner.json", "utf8")))
    );
    const baseUrl = "http://localhost:8081";
    const httpEndpoint = 'http://127.0.0.1:8899';
    const wsEndpoint = 'ws://127.0.0.1:8900';
    const rpcClient: RpcClient = {
        rpc: createSolanaRpc(httpEndpoint),
        rpcSubscriptions: createSolanaRpcSubscriptions(wsEndpoint)
    };

    const headAuthority = await createTestUser(rpcClient, 100);
    const launchpoolsConfigsManagerAuthority = await createTestUser(rpcClient, 100);
    const user = await createTestUser(rpcClient, 100);

    const routes = {
        LAUNCHPOOL_SCOPE: requireEnv("LAUNCHPOOL_SCOPE"),
        INIT_LAUNCHPOOL_CONFIGS_MANAGER: requireEnv("INIT_LAUNCHPOOL_CONFIGS_MANAGER"),
        UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_AUTHORITY: requireEnv("UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_AUTHORITY"),
        UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_HEAD_AUTHORITY: requireEnv("UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_HEAD_AUTHORITY"),
        INIT_LAUNCHPOOLS_CONFIG: requireEnv("INIT_LAUNCHPOOLS_CONFIG"),
        UPDATE_LAUNCHPOOLS_CONFIG_REWARD_AUTHORITY: requireEnv("UPDATE_LAUNCHPOOLS_CONFIG_REWARD_AUTHORITY"),
        UPDATE_LAUNCHPOOLS_CONFIG_PROTOCOL_REWARD_SHARE: requireEnv("UPDATE_LAUNCHPOOLS_CONFIG_PROTOCOL_REWARD_SHARE"),
        UPDATE_LAUNCHPOOLS_CONFIG_DURATION: requireEnv("UPDATE_LAUNCHPOOLS_CONFIG_DURATION"),
        UPDATE_LAUNCHPOOLS_CONFIG_POSITION_SIZES: requireEnv("UPDATE_LAUNCHPOOLS_CONFIG_POSITION_SIZES"),
        INIT_LAUNCHPOOL: requireEnv("INIT_LAUNCHPOOL"),
        LAUNCH_LAUNCHPOOL: requireEnv("LAUNCH_LAUNCHPOOL"),
        OPEN_STAKE_POSITION: requireEnv("OPEN_STAKE_POSITION"),
        INCREASE_STAKE_POSITION: requireEnv("INCREASE_STAKE_POSITION"),
        CLOSE_STAKE_POSITION: requireEnv("CLOSE_STAKE_POSITION"),
        COLLECT_PROTOCOL_REWARD: requireEnv("COLLECT_PROTOCOL_REWARD"),
    };

    return {
        owner,
        headAuthority,
        launchpoolsConfigsManagerAuthority,
        user,
        baseUrl,
        rpcClient,
        routes,
    };
};
export const initLaunchpoolsConfigsManager = async (
    signer: Address,
    authority: Address,
    head_authority: Address,
    env: LaunchpoolBackendIntegrationTestingEnvironment
): Promise<[string, string]> => {
    return postBase64TxAndPubkey(
        env.baseUrl,
        env.routes.LAUNCHPOOL_SCOPE,
        env.routes.INIT_LAUNCHPOOL_CONFIGS_MANAGER,
        {
            signer: signer.toString(),
            authority: authority.toString(),
            head_authority: head_authority.toString(),
        }
    );
};
export const updateLaunchpoolsConfigsManagerAuthority = async (
    authority: Address,
    new_authority: Address,
    env: LaunchpoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    return postBase64Tx(
        env.baseUrl,
        env.routes.LAUNCHPOOL_SCOPE,
        env.routes.UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_AUTHORITY,
        {
            authority: authority.toString(),
            new_authority: new_authority.toString()
        }
    );
};

export const updateLaunchpoolsConfigsManagerHeadAuthority = async (
    head_authority: Address,
    new_head_authority: Address,
    env: LaunchpoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    return postBase64Tx(
        env.baseUrl,
        env.routes.LAUNCHPOOL_SCOPE,
        env.routes.UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_HEAD_AUTHORITY,
        {
            head_authority: head_authority.toString(),
            new_head_authority: new_head_authority.toString()
        }
    );
};

export const initializeLaunchpoolsConfig = async (
    authority: Address,
    launchpools_configs_manager: Address,
    reward_authority: Address,
    stakable_mint: Address,
    min_position_size: bigint,
    max_position_size: bigint,
    protocol_reward_share_basis_points: number,
    duration: bigint,
    env: LaunchpoolBackendIntegrationTestingEnvironment
): Promise<[string,string]> => {
    const route = env.routes.INIT_LAUNCHPOOLS_CONFIG.replace(
        "{launchpools_configs_manager}",
        launchpools_configs_manager.toString()
    );
    return postBase64TxAndPubkey(env.baseUrl, env.routes.LAUNCHPOOL_SCOPE, route, {
        authority: authority.toString(),
        reward_authority: reward_authority.toString(),
        stakable_mint: stakable_mint.toString(),
        min_position_size: min_position_size.toString(),
        max_position_size: max_position_size.toString(),
        protocol_reward_share_basis_points,
        duration: duration.toString()
    });
};

export const updateLaunchpoolsConfigRewardAuthority = async (
    launchpools_config: Address,
    authority: Address,
    new_reward_authority: Address,
    env: LaunchpoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.UPDATE_LAUNCHPOOLS_CONFIG_REWARD_AUTHORITY.replace(
        "{launchpools_config}",
        launchpools_config.toString()
    );
    return postBase64Tx(env.baseUrl, env.routes.LAUNCHPOOL_SCOPE, route, {
        authority: authority.toString(),
        new_reward_authority: new_reward_authority.toString()
    });
};

export const updateLaunchpoolsConfigProtocolRewardShare = async (
    launchpools_config: Address,
    authority: Address,
    new_protocol_reward_share_basis_points: number,
    env: LaunchpoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.UPDATE_LAUNCHPOOLS_CONFIG_PROTOCOL_REWARD_SHARE.replace(
        "{launchpools_config}",
        launchpools_config.toString()
    );
    return postBase64Tx(env.baseUrl, env.routes.LAUNCHPOOL_SCOPE, route, {
        authority: authority.toString(),
        new_protocol_reward_share_basis_points
    });
};

export const updateLaunchpoolsConfigDuration = async (
    launchpools_config: Address,
    authority: Address,
    new_duration: bigint,
    env: LaunchpoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.UPDATE_LAUNCHPOOLS_CONFIG_DURATION.replace(
        "{launchpools_config}",
        launchpools_config.toString()
    );
    return postBase64Tx(env.baseUrl, env.routes.LAUNCHPOOL_SCOPE, route, {
        authority: authority.toString(),
        new_duration: new_duration.toString()
    });
};

export const updateLaunchpoolsConfigPositionSizes = async (
    launchpools_config: Address,
    authority: Address,
    new_min_position_size: bigint,
    new_max_position_size: bigint,
    env: LaunchpoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.UPDATE_LAUNCHPOOLS_CONFIG_POSITION_SIZES.replace(
        "{launchpools_config}",
        launchpools_config.toString()
    );
    return postBase64Tx(env.baseUrl, env.routes.LAUNCHPOOL_SCOPE, route, {
        authority: authority.toString(),
        new_min_position_size: new_min_position_size.toString(),
        new_max_position_size: new_max_position_size.toString()
    });
};

export const initializeLaunchpool = async (
    authority: Address,
    launchpools_config: Address,
    reward_mint: Address,
    initial_reward_amount: bigint,
    env: LaunchpoolBackendIntegrationTestingEnvironment
): Promise<[string, string]> => {
    const route = env.routes.INIT_LAUNCHPOOL.replace(
        "{launchpools_config}",
        launchpools_config.toString()
    );
    return postBase64TxAndPubkey(env.baseUrl, env.routes.LAUNCHPOOL_SCOPE, route, {
        authority: authority.toString(),
        reward_mint: reward_mint.toString(),
        initial_reward_amount: initial_reward_amount.toString(),
    });
};

export const launchLaunchpool = async (
    authority: Address,
    launchpool: Address,
    start_timestamp: bigint,
    env: LaunchpoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.LAUNCH_LAUNCHPOOL.replace(
        "{launchpool}",
        launchpool.toString()
    );
    return postBase64Tx(env.baseUrl, env.routes.LAUNCHPOOL_SCOPE, route, {
        authority: authority.toString(),
        start_timestamp: start_timestamp.toString(),
    });
};

export const openStakePosition = async (
    signer: Address,
    signer_stakable_account: Address | null,
    launchpool: Address,
    stake_amount: bigint,
    env: LaunchpoolBackendIntegrationTestingEnvironment
): Promise<[string, string]> => {
    const route = env.routes.OPEN_STAKE_POSITION.replace(
        "{launchpool}",
        launchpool.toString()
    );
    return postBase64TxAndPubkey(env.baseUrl, env.routes.LAUNCHPOOL_SCOPE, route, {
        signer: signer.toString(),
        signer_stakable_account: signer_stakable_account?.toString() ?? null,
        stake_amount: stake_amount.toString(),
    });
};

export const increaseStakePosition = async (
    signer: Address,
    signer_stakable_account: Address | null,
    stake_position: Address,
    stake_increase_amount: bigint,
    env: LaunchpoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.INCREASE_STAKE_POSITION.replace(
        "{stake_position}",
        stake_position.toString()
    );
    return postBase64Tx(env.baseUrl, env.routes.LAUNCHPOOL_SCOPE, route, {
        signer: signer.toString(),
        signer_stakable_account: signer_stakable_account?.toString() ?? null,
        stake_increase_amount: stake_increase_amount.toString(),
    });
};

export const closeStakePosition = async (
    signer: Address,
    signer_stakable_account: Address | null,
    stake_position: Address,
    env: LaunchpoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.CLOSE_STAKE_POSITION.replace(
        "{stake_position}",
        stake_position.toString()
    );

    return postBase64Tx(env.baseUrl, env.routes.LAUNCHPOOL_SCOPE, route, {
        signer: signer.toString(),
        signer_stakable_account: signer_stakable_account?.toString() ?? undefined,
    });
};

export const collectProtocolReward = async (
    signer: Address,
    launchpool: Address,
    env: LaunchpoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.COLLECT_PROTOCOL_REWARD.replace(
        "{launchpool}",
        launchpool.toString()
    );
    return postBase64Tx(env.baseUrl, env.routes.LAUNCHPOOL_SCOPE, route, {
        signer: signer.toString(),
    });
};