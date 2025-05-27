import * as program from "@liquidity-pool/js";
import {
    address,
    Address,
    createKeyPairSignerFromBytes,
    createSolanaRpc,
    createSolanaRpcSubscriptions, Endian, getAddressEncoder, getProgramDerivedAddress, getU64Encoder,
    KeyPairSigner, ProgramDerivedAddress
} from "@solana/kit";
import fs from "node:fs";
import {createTestUser, RpcClient} from "../helpers";

/**
 * Defines the structure for a LiquidityPool testing environment.
 */
export type LiquidityPoolTestingEnvironment = {
    program: typeof program,
    programDataAddress: Address,
    rpcClient: RpcClient,
    rent: Address,
    owner: KeyPairSigner,
    headAuthority: KeyPairSigner,
    ammsConfigsManagerAuthority: KeyPairSigner,
    user: KeyPairSigner
};

/**
 * Creates a LiquidityPool testing environment with predefined configurations.
 * @returns {Promise<LiquidityPoolTestingEnvironment>} - The initialized testing environment.
 */
export const createLiquidityPoolTestingEnvironment = async (): Promise<LiquidityPoolTestingEnvironment> => {
    const httpEndpoint = 'http://127.0.0.1:8899';
    const wsEndpoint = 'ws://127.0.0.1:8900';

    // Initialize RPC client for interaction with Solana
    const rpcClient: RpcClient = {
        rpc: createSolanaRpc(httpEndpoint),
        rpcSubscriptions: createSolanaRpcSubscriptions(wsEndpoint)
    };

    // Load owner key pair from a file
    const owner = await createKeyPairSignerFromBytes(Buffer.from(JSON.parse(fs.readFileSync("./owner.json", 'utf8'))));

    // Create test users and authorities
    const headAuthority = await createTestUser(rpcClient, 100);
    const ammsConfigsManagerAuthority = await createTestUser(rpcClient, 100);
    const user = await createTestUser(rpcClient, 100);

    // Define rent system address
    const rent = address("SysvarRent111111111111111111111111111111111");

    // Derive program data address using CPMM program address
    const [programDataAddress] = await getProgramDerivedAddress({
        programAddress: address('BPFLoaderUpgradeab1e11111111111111111111111'),
        seeds: [getAddressEncoder().encode(program.LIQUIDITY_POOL_PROGRAM_ADDRESS)]
    });

    return { rpcClient, headAuthority, owner, program, rent, programDataAddress, ammsConfigsManagerAuthority, user };
};

/**
 * Retrieves the PDA (Program Derived Address) for AMMs Configs Manager.
 * @returns {Promise<ProgramDerivedAddress>} - The derived address of AMMs Configs Manager.
 */
export const getAmmsConfigsManagerPDA = async (): Promise<ProgramDerivedAddress> => {
    return await getProgramDerivedAddress({
        programAddress: program.LIQUIDITY_POOL_PROGRAM_ADDRESS,
        seeds: ["amms_configs_manager"]
    });
};

/**
 * Retrieves the PDA for a specific AMMs Config using an ID.
 * @param {bigint} id - The unique identifier for the AMMs Config.
 * @returns {Promise<ProgramDerivedAddress>} - The derived address for the AMMs Config.
 */
export const getAmmsConfigPDA = async (id: bigint): Promise<ProgramDerivedAddress> => {
    return await getProgramDerivedAddress({
        programAddress: program.LIQUIDITY_POOL_PROGRAM_ADDRESS,
        seeds: ["amms_config", getU64Encoder({ endian: Endian.Little }).encode(id)]
    });
};

/**
 * Retrieves the PDA for a constant product AMM.
 * @param {Address} lpMint - The address of the liquidity pool mint.
 * @returns {Promise<ProgramDerivedAddress>} - The derived address for the constant product AMM.
 */
export const getCpAmmPDA = async (lpMint: Address): Promise<ProgramDerivedAddress> => {
    return await getProgramDerivedAddress({
        programAddress: program.LIQUIDITY_POOL_PROGRAM_ADDRESS,
        seeds: ["cp_amm", getAddressEncoder().encode(lpMint)]
    });
};

/**
 * Retrieves the PDA for an AMM vault.
 * @param {Address} cpAmm - The address of the constant product AMM.
 * @param {Address} mint - The token mint address.
 * @returns {Promise<ProgramDerivedAddress>} - The derived address for the AMM vault.
 */
export const getCpAmmVaultPDA = async (cpAmm: Address, mint: Address): Promise<ProgramDerivedAddress> => {
    return await getProgramDerivedAddress({
        programAddress: program.LIQUIDITY_POOL_PROGRAM_ADDRESS,
        seeds: ["vault", getAddressEncoder().encode(cpAmm), getAddressEncoder().encode(mint)]
    });
};