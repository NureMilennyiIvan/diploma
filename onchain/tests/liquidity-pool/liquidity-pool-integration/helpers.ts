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

export type LiquidityPoolBackendIntegrationTestingEnvironment = {
    rpcClient: RpcClient;
    owner: KeyPairSigner;
    headAuthority: KeyPairSigner;
    ammsConfigsManagerAuthority: KeyPairSigner;
    user: KeyPairSigner;
    baseUrl: string;
    routes: {
        LIQUIDITY_POOL_SCOPE: string;
        INIT_AMMS_CONFIGS_MANAGER: string;
        UPDATE_AMMS_CONFIGS_MANAGER_AUTHORITY: string;
        UPDATE_AMMS_CONFIGS_MANAGER_HEAD_AUTHORITY: string;
        INIT_AMMS_CONFIG: string;
        UPDATE_AMMS_CONFIG_FEE_AUTHORITY: string;
        UPDATE_AMMS_CONFIG_PROTOCOL_FEE_RATE: string,
        UPDATE_AMMS_CONFIG_PROVIDERS_FEE_RATE: string;
        INIT_CP_AMM: string;
        LAUNCH_CP_AMM: string;
        PROVIDE_TO_CP_AMM: string;
        WITHDRAW_FROM_CP_AMM: string;
        SWAP_IN_CP_AMM: string;
        COLLECT_FEES_FROM_CP_AMM: string;
    };
};

export const createLiquidityPoolBackendIntegrationTestingEnvironment = async (): Promise<LiquidityPoolBackendIntegrationTestingEnvironment> => {
    const baseUrl = "http://localhost:8082";
    const httpEndpoint = "http://127.0.0.1:8899";
    const wsEndpoint = "ws://127.0.0.1:8900";

    const rpcClient: RpcClient = {
        rpc: createSolanaRpc(httpEndpoint),
        rpcSubscriptions: createSolanaRpcSubscriptions(wsEndpoint),
    };

    const owner = await createKeyPairSignerFromBytes(
        Buffer.from(JSON.parse(fs.readFileSync("./owner.json", "utf8")))
    );

    const headAuthority = await createTestUser(rpcClient, 100);
    const ammsConfigsManagerAuthority = await createTestUser(rpcClient, 100);
    const user = await createTestUser(rpcClient, 100);

    const routes = {
        LIQUIDITY_POOL_SCOPE: requireEnv("LIQUIDITY_POOL_SCOPE"),
        INIT_AMMS_CONFIGS_MANAGER: requireEnv("INIT_AMMS_CONFIGS_MANAGER"),
        UPDATE_AMMS_CONFIGS_MANAGER_AUTHORITY: requireEnv("UPDATE_AMMS_CONFIGS_MANAGER_AUTHORITY"),
        UPDATE_AMMS_CONFIGS_MANAGER_HEAD_AUTHORITY: requireEnv("UPDATE_AMMS_CONFIGS_MANAGER_HEAD_AUTHORITY"),
        INIT_AMMS_CONFIG: requireEnv("INIT_AMMS_CONFIG"),
        UPDATE_AMMS_CONFIG_FEE_AUTHORITY: requireEnv("UPDATE_AMMS_CONFIG_FEE_AUTHORITY"),
        UPDATE_AMMS_CONFIG_PROTOCOL_FEE_RATE: requireEnv("UPDATE_AMMS_CONFIG_PROTOCOL_FEE_RATE"),
        UPDATE_AMMS_CONFIG_PROVIDERS_FEE_RATE: requireEnv("UPDATE_AMMS_CONFIG_PROVIDERS_FEE_RATE"),
        INIT_CP_AMM: requireEnv("INIT_CP_AMM"),
        LAUNCH_CP_AMM: requireEnv("LAUNCH_CP_AMM"),
        PROVIDE_TO_CP_AMM: requireEnv("PROVIDE_TO_CP_AMM"),
        WITHDRAW_FROM_CP_AMM: requireEnv("WITHDRAW_FROM_CP_AMM"),
        SWAP_IN_CP_AMM: requireEnv("SWAP_IN_CP_AMM"),
        COLLECT_FEES_FROM_CP_AMM: requireEnv("COLLECT_FEES_FROM_CP_AMM"),
    };

    return {
        rpcClient,
        owner,
        headAuthority,
        ammsConfigsManagerAuthority,
        user,
        baseUrl,
        routes,
    };
};

export const initializeAmmsConfigsManager = async (
    signer: Address,
    authority: Address,
    head_authority: Address,
    env: LiquidityPoolBackendIntegrationTestingEnvironment
): Promise<[string,string]> => {
    return postBase64TxAndPubkey(env.baseUrl, env.routes.LIQUIDITY_POOL_SCOPE, env.routes.INIT_AMMS_CONFIGS_MANAGER, {
        signer: signer.toString(),
        authority: authority.toString(),
        head_authority: head_authority.toString()
    });
};

export const updateAmmsConfigsManagerAuthority = async (
    authority: Address,
    new_authority: Address,
    env: LiquidityPoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    return postBase64Tx(env.baseUrl, env.routes.LIQUIDITY_POOL_SCOPE, env.routes.UPDATE_AMMS_CONFIGS_MANAGER_AUTHORITY, {
        authority: authority.toString(),
        new_authority: new_authority.toString()
    });
};

export const updateAmmsConfigsManagerHeadAuthority = async (
    head_authority: Address,
    new_head_authority: Address,
    env: LiquidityPoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    return postBase64Tx(env.baseUrl, env.routes.LIQUIDITY_POOL_SCOPE, env.routes.UPDATE_AMMS_CONFIGS_MANAGER_HEAD_AUTHORITY, {
        head_authority: head_authority.toString(),
        new_head_authority: new_head_authority.toString()
    });
};

export const initializeAmmsConfig = async (
    authority: Address,
    amms_configs_manager: Address,
    fee_authority: Address,
    protocol_fee_rate_basis_points: number,
    providers_fee_rate_basis_points: number,
    env: LiquidityPoolBackendIntegrationTestingEnvironment
): Promise<[string,string]> => {
    const route = env.routes.INIT_AMMS_CONFIG.replace(
        "{amms_configs_manager}",
        amms_configs_manager.toString()
    );
    return postBase64TxAndPubkey(env.baseUrl, env.routes.LIQUIDITY_POOL_SCOPE, route, {
        authority: authority.toString(),
        fee_authority: fee_authority.toString(),
        protocol_fee_rate_basis_points,
        providers_fee_rate_basis_points
    });
};

export const updateAmmsConfigFeeAuthority = async (
    authority: Address,
    amms_config: Address,
    new_fee_authority: Address,
    env: LiquidityPoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.UPDATE_AMMS_CONFIG_FEE_AUTHORITY.replace(
        "{amms_config}",
        amms_config.toString()
    );
    return postBase64Tx(env.baseUrl, env.routes.LIQUIDITY_POOL_SCOPE, route, {
        authority: authority.toString(),
        new_fee_authority: new_fee_authority.toString()
    });
};

export const updateAmmsConfigProtocolFeeRate = async (
    authority: Address,
    amms_config: Address,
    new_protocol_fee_rate_basis_points: number,
    env: LiquidityPoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.UPDATE_AMMS_CONFIG_PROTOCOL_FEE_RATE.replace(
        "{amms_config}",
        amms_config.toString()
    );
    return postBase64Tx(env.baseUrl, env.routes.LIQUIDITY_POOL_SCOPE, route, {
        authority: authority.toString(),
        new_protocol_fee_rate_basis_points
    });
};

export const updateAmmsConfigProvidersFeeRate = async (
    authority: Address,
    amms_config: Address,
    new_providers_fee_rate_basis_points: number,
    env: LiquidityPoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.UPDATE_AMMS_CONFIG_PROVIDERS_FEE_RATE.replace(
        "{amms_config}",
        amms_config.toString()
    );
    return postBase64Tx(env.baseUrl, env.routes.LIQUIDITY_POOL_SCOPE, route, {
        authority: authority.toString(),
        new_providers_fee_rate_basis_points
    });
};

export const initializeCpAmm = async (
    signer: Address,
    amms_config: Address,
    base_mint: Address,
    quote_mint: Address,
    env: LiquidityPoolBackendIntegrationTestingEnvironment
): Promise<[string,string]> => {
    const route = env.routes.INIT_CP_AMM.replace("{amms_config}", amms_config.toString());
    return postBase64TxAndPubkey(env.baseUrl, env.routes.LIQUIDITY_POOL_SCOPE, route, {
        signer: signer.toString(),
        base_mint: base_mint.toString(),
        quote_mint: quote_mint.toString()
    });
};

export const launchCpAmm = async (
    creator: Address,
    cp_amm: Address,
    creator_base_account: Address | null,
    creator_quote_account: Address | null,
    base_liquidity: bigint,
    quote_liquidity: bigint,
    env: LiquidityPoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.LAUNCH_CP_AMM.replace("{cp_amm}", cp_amm.toString());
    return postBase64Tx(env.baseUrl, env.routes.LIQUIDITY_POOL_SCOPE, route, {
        creator: creator.toString(),
        creator_base_account: creator_base_account?.toString() ?? null,
        creator_quote_account: creator_quote_account?.toString() ?? null,
        base_liquidity: base_liquidity.toString(),
        quote_liquidity: quote_liquidity.toString()
    });
};

export const provideToCpAmm = async (
    signer: Address,
    cp_amm: Address,
    signer_base_account: Address | null,
    signer_quote_account: Address | null,
    base_liquidity: bigint,
    quote_liquidity: bigint,
    env: LiquidityPoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.PROVIDE_TO_CP_AMM.replace("{cp_amm}", cp_amm.toString());
    return postBase64Tx(env.baseUrl, env.routes.LIQUIDITY_POOL_SCOPE, route, {
        signer: signer.toString(),
        signer_base_account: signer_base_account?.toString() ?? null,
        signer_quote_account: signer_quote_account?.toString() ?? null,
        base_liquidity: base_liquidity.toString(),
        quote_liquidity: quote_liquidity.toString()
    });
};

export const withdrawFromCpAmm = async (
    signer: Address,
    cp_amm: Address,
    signer_lp_account: Address | null,
    lp_tokens: bigint,
    env: LiquidityPoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.WITHDRAW_FROM_CP_AMM.replace("{cp_amm}", cp_amm.toString());
    return postBase64Tx(env.baseUrl, env.routes.LIQUIDITY_POOL_SCOPE, route, {
        signer: signer.toString(),
        signer_lp_account: signer_lp_account?.toString() ?? null,
        lp_tokens: lp_tokens.toString()
    });
};

export const swapInCpAmm = async (
    signer: Address,
    cp_amm: Address,
    swap_amount: bigint,
    estimated_result: bigint,
    allowed_slippage: bigint,
    is_in_out: boolean,
    env: LiquidityPoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.SWAP_IN_CP_AMM.replace("{cp_amm}", cp_amm.toString());
    return postBase64Tx(env.baseUrl, env.routes.LIQUIDITY_POOL_SCOPE, route, {
        signer: signer.toString(),
        swap_amount: swap_amount.toString(),
        estimated_result: estimated_result.toString(),
        allowed_slippage: allowed_slippage.toString(),
        is_in_out
    });
};

export const collectFeesFromCpAmm = async (
    signer: Address,
    cp_amm: Address,
    env: LiquidityPoolBackendIntegrationTestingEnvironment
): Promise<string> => {
    const route = env.routes.COLLECT_FEES_FROM_CP_AMM.replace("{cp_amm}", cp_amm.toString());
    return postBase64Tx(env.baseUrl, env.routes.LIQUIDITY_POOL_SCOPE, route, {
        signer: signer.toString()
    });
};
