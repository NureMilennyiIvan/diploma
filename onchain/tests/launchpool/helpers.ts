import * as program from "@launchpool/js";
import {
    address,
    Address, createKeyPairSignerFromBytes, createSolanaRpc, createSolanaRpcSubscriptions,
    Endian, getAddressEncoder,
    getProgramDerivedAddress,
    getU64Encoder,
    KeyPairSigner,
    ProgramDerivedAddress
} from "@solana/kit";
import {createTestUser, RpcClient} from "../helpers";
import fs from "node:fs";
export type LaunchpoolTestingEnvironment = {
    program: typeof program,
    programDataAddress: Address,
    rpcClient: RpcClient,
    rent: Address,
    owner: KeyPairSigner,
    headAuthority: KeyPairSigner,
    launchpoolsConfigsManagerAuthority: KeyPairSigner,
    user: KeyPairSigner
};
export const createLaunchpoolTestingEnvironment = async (): Promise<LaunchpoolTestingEnvironment> => {
    const httpEndpoint = 'http://127.0.0.1:8899';
    const wsEndpoint = 'ws://127.0.0.1:8900';

    const rpcClient: RpcClient = {
        rpc: createSolanaRpc(httpEndpoint),
        rpcSubscriptions: createSolanaRpcSubscriptions(wsEndpoint)
    };

    const owner = await createKeyPairSignerFromBytes(Buffer.from(JSON.parse(fs.readFileSync("./owner.json", 'utf8'))));

    const headAuthority = await createTestUser(rpcClient, 100);
    const launchpoolsConfigsManagerAuthority = await createTestUser(rpcClient, 100);
    const user = await createTestUser(rpcClient, 100);

    const rent = address("SysvarRent111111111111111111111111111111111");

    const [programDataAddress] = await getProgramDerivedAddress({
        programAddress: address('BPFLoaderUpgradeab1e11111111111111111111111'),
        seeds: [getAddressEncoder().encode(program.LAUNCHPOOL_PROGRAM_ADDRESS)]
    });

    return { rpcClient, headAuthority, owner, program, rent, programDataAddress, launchpoolsConfigsManagerAuthority, user };
};

export const getLaunchpoolsConfigsManagerPDA = async (): Promise<ProgramDerivedAddress> => {
    return await getProgramDerivedAddress({
        programAddress: program.LAUNCHPOOL_PROGRAM_ADDRESS,
        seeds: ["launchpools_configs_manager"]
    });
};

export const getLaunchpoolsConfigPDA = async (id: bigint): Promise<ProgramDerivedAddress> => {
    return await getProgramDerivedAddress({
        programAddress: program.LAUNCHPOOL_PROGRAM_ADDRESS,
        seeds: ["launchpools_config", getU64Encoder({ endian: Endian.Little }).encode(id)]
    });
};

export const getLaunchpoolPDA = async (reward_mint: Address): Promise<ProgramDerivedAddress> => {
    return await getProgramDerivedAddress({
        programAddress: program.LAUNCHPOOL_PROGRAM_ADDRESS,
        seeds: ["launchpool", getAddressEncoder().encode(reward_mint)]
    });
}
export const getLaunchpoolVaultPDA = async (launchpool: Address): Promise<ProgramDerivedAddress> => {
    return await getProgramDerivedAddress({
        programAddress: program.LAUNCHPOOL_PROGRAM_ADDRESS,
        seeds: ["vault", getAddressEncoder().encode(launchpool)]
    });
};

export const getStakePositionPDA = async (owner: Address, launchpool: Address): Promise<ProgramDerivedAddress> => {
    return await getProgramDerivedAddress({
        programAddress: program.LAUNCHPOOL_PROGRAM_ADDRESS,
        seeds: ["stake_position", getAddressEncoder().encode(owner), getAddressEncoder().encode(launchpool)]
    });
}

export const getStakePositionVaultPDA = async (stake_position: Address): Promise<ProgramDerivedAddress> => {
    return await getProgramDerivedAddress({
        programAddress: program.LAUNCHPOOL_PROGRAM_ADDRESS,
        seeds: ["vault", getAddressEncoder().encode(stake_position)]
    });
};
