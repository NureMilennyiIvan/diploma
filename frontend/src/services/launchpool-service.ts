import {PublicKey} from "@solana/web3.js";
import {postBase64Tx, postBase64TxAndPubkey} from "onchain/tests/helpers";
import {useQuery} from "@tanstack/react-query";
import {LaunchpoolsConfigsManager} from "@/models/launchpools-configs-manager";
import {LaunchpoolRow} from "@/models/launchpool-row";

export type LaunchpoolRoutes = {
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
}

export class LaunchpoolService {
    private readonly routes: LaunchpoolRoutes;

    constructor(routes: LaunchpoolRoutes) {
        this.routes = routes;
    }

    private getRoute(template: string, params: Record<string, string>): string {
        return Object.entries(params).reduce(
            (route, [key, value]) => route.replace(`{${key}}`, value),
            template
        );
    }
    fetchLaunchpoolsConfigsManager = () => {
        const { data, isLoading, error } = useQuery({
            queryKey: ["launchpoolsConfigsManager"],
            queryFn: async (): Promise<LaunchpoolsConfigsManager> => {
                return Promise.resolve(LaunchpoolsConfigsManager.mock());
            },
            gcTime: 10_000,
            refetchOnWindowFocus: true,
            refetchInterval: 10_000,
            retry: 1
        });
        return { data, isLoading, error };
    };

    fetchActiveLaunchpoolRows = (limit?: number, rewardMint?: PublicKey, stakableMint?: PublicKey) => {
        const { data, isLoading, error, } = useQuery({
            queryKey: ["launchpoolRows", limit, rewardMint, stakableMint],
            queryFn: async (): Promise<LaunchpoolRow[]> => {
                return Promise.resolve([
                    LaunchpoolRow.mock(),
                    LaunchpoolRow.mock(),
                    LaunchpoolRow.mock(),
                    LaunchpoolRow.mock(),
                    LaunchpoolRow.mock(),
                ]);
            },
            gcTime: 60_000,
            refetchOnWindowFocus: true,
            refetchInterval: 30_000,
            retry: 1,
        });
        return { data, isLoading, error, };
    };

    async updateLaunchpoolsConfigsManagerAuthority(authority: PublicKey, new_authority: PublicKey): Promise<string> {
        return postBase64Tx(this.routes.baseUrl, this.routes.routes.LAUNCHPOOL_SCOPE,
            this.routes.routes.UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_AUTHORITY, {
                authority: authority.toBase58(),
                new_authority: new_authority.toBase58()
            });
    }

    async updateLaunchpoolsConfigsManagerHeadAuthority(head_authority: PublicKey, new_head_authority: PublicKey): Promise<string> {
        return postBase64Tx(this.routes.baseUrl, this.routes.routes.LAUNCHPOOL_SCOPE,
            this.routes.routes.UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_HEAD_AUTHORITY, {
                head_authority: head_authority.toBase58(),
                new_head_authority: new_head_authority.toBase58()
            });
    }

    async initializeLaunchpoolsConfig(
        authority: PublicKey,
        launchpoolsConfigsManager: PublicKey,
        rewardAuthority: PublicKey,
        stakableMint: PublicKey,
        minPositionSize: bigint,
        maxPositionSize: bigint,
        protocolRewardShareBasisPoints: number,
        duration: bigint
    ): Promise<[string, string]> {
        const route = this.getRoute(this.routes.routes.INIT_LAUNCHPOOLS_CONFIG, {
            launchpools_configs_manager: launchpoolsConfigsManager.toBase58()
        });
        return postBase64TxAndPubkey(this.routes.baseUrl, this.routes.routes.LAUNCHPOOL_SCOPE, route, {
            authority: authority.toBase58(),
            reward_authority: rewardAuthority.toBase58(),
            stakable_mint: stakableMint.toBase58(),
            min_position_size: minPositionSize.toString(),
            max_position_size: maxPositionSize.toString(),
            protocol_reward_share_basis_points: protocolRewardShareBasisPoints,
            duration: duration.toString()
        });
    }

    async updateLaunchpoolsConfigRewardAuthority(launchpoolsConfig: PublicKey, authority: PublicKey, newRewardAuthority: PublicKey): Promise<string> {
        const route = this.getRoute(this.routes.routes.UPDATE_LAUNCHPOOLS_CONFIG_REWARD_AUTHORITY, {
            launchpools_config: launchpoolsConfig.toBase58()
        });
        return postBase64Tx(this.routes.baseUrl, this.routes.routes.LAUNCHPOOL_SCOPE, route, {
            authority: authority.toBase58(),
            new_reward_authority: newRewardAuthority.toBase58()
        });
    }

    async updateLaunchpoolsConfigProtocolRewardShare(launchpoolsConfig: PublicKey, authority: PublicKey, newProtocolRewardShareBasisPoints: number): Promise<string> {
        const route = this.getRoute(this.routes.routes.UPDATE_LAUNCHPOOLS_CONFIG_PROTOCOL_REWARD_SHARE, {
            launchpools_config: launchpoolsConfig.toBase58()
        });
        return postBase64Tx(this.routes.baseUrl, this.routes.routes.LAUNCHPOOL_SCOPE, route, {
            authority: authority.toBase58(),
            new_protocol_reward_share_basis_points: newProtocolRewardShareBasisPoints
        });
    }

    async updateLaunchpoolsConfigDuration(launchpoolsConfig: PublicKey, authority: PublicKey, newDuration: bigint): Promise<string> {
        const route = this.getRoute(this.routes.routes.UPDATE_LAUNCHPOOLS_CONFIG_DURATION, {
            launchpools_config: launchpoolsConfig.toBase58()
        });
        return postBase64Tx(this.routes.baseUrl, this.routes.routes.LAUNCHPOOL_SCOPE, route, {
            authority: authority.toBase58(),
            new_duration: newDuration.toString()
        });
    }

    async updateLaunchpoolsConfigPositionSizes(launchpoolsConfig: PublicKey, authority: PublicKey, newMinPositionSize: bigint, newMaxPositionSize: bigint): Promise<string> {
        const route = this.getRoute(this.routes.routes.UPDATE_LAUNCHPOOLS_CONFIG_POSITION_SIZES, {
            launchpools_config: launchpoolsConfig.toBase58()
        });
        return postBase64Tx(this.routes.baseUrl, this.routes.routes.LAUNCHPOOL_SCOPE, route, {
            authority: authority.toBase58(),
            new_min_position_size: newMinPositionSize.toString(),
            new_max_position_size: newMaxPositionSize.toString()
        });
    }

    async initializeLaunchpool(
        authority: PublicKey,
        launchpoolsConfig: PublicKey,
        rewardMint: PublicKey,
        initialRewardAmount: bigint
    ): Promise<[string, string]> {
        const route = this.getRoute(this.routes.routes.INIT_LAUNCHPOOL, {
            launchpools_config: launchpoolsConfig.toBase58()
        });
        return postBase64TxAndPubkey(this.routes.baseUrl, this.routes.routes.LAUNCHPOOL_SCOPE, route, {
            authority: authority.toBase58(),
            reward_mint: rewardMint.toBase58(),
            initial_reward_amount: initialRewardAmount.toString()
        });
    }

    async launchLaunchpool(authority: PublicKey, launchpool: PublicKey, startTimestamp: bigint): Promise<string> {
        const route = this.getRoute(this.routes.routes.LAUNCH_LAUNCHPOOL, {
            launchpool: launchpool.toBase58()
        });
        return postBase64Tx(this.routes.baseUrl, this.routes.routes.LAUNCHPOOL_SCOPE, route, {
            authority: authority.toBase58(),
            start_timestamp: startTimestamp.toString()
        });
    }

    async openStakePosition(
        signer: PublicKey,
        signerStakableAccount: PublicKey | null,
        launchpool: PublicKey,
        stakeAmount: bigint
    ): Promise<[string, string]> {
        const route = this.getRoute(this.routes.routes.OPEN_STAKE_POSITION, {
            launchpool: launchpool.toBase58()
        });
        return postBase64TxAndPubkey(this.routes.baseUrl, this.routes.routes.LAUNCHPOOL_SCOPE, route, {
            signer: signer.toBase58(),
            signer_stakable_account: signerStakableAccount?.toBase58() ?? null,
            stake_amount: stakeAmount.toString()
        });
    }

    async increaseStakePosition(
        signer: PublicKey,
        signerStakableAccount: PublicKey | null,
        stakePosition: PublicKey,
        stakeIncreaseAmount: bigint
    ): Promise<string> {
        const route = this.getRoute(this.routes.routes.INCREASE_STAKE_POSITION, {
            stake_position: stakePosition.toBase58()
        });
        return postBase64Tx(this.routes.baseUrl, this.routes.routes.LAUNCHPOOL_SCOPE, route, {
            signer: signer.toBase58(),
            signer_stakable_account: signerStakableAccount?.toBase58() ?? null,
            stake_increase_amount: stakeIncreaseAmount.toString()
        });
    }

    async closeStakePosition(
        signer: PublicKey,
        signerStakableAccount: PublicKey | null,
        stakePosition: PublicKey
    ): Promise<string> {
        const route = this.getRoute(this.routes.routes.CLOSE_STAKE_POSITION, {
            stake_position: stakePosition.toBase58()
        });
        return postBase64Tx(this.routes.baseUrl, this.routes.routes.LAUNCHPOOL_SCOPE, route, {
            signer: signer.toBase58(),
            signer_stakable_account: signerStakableAccount?.toBase58()
        });
    }

    async collectProtocolReward(signer: PublicKey, launchpool: PublicKey): Promise<string> {
        const route = this.getRoute(this.routes.routes.COLLECT_PROTOCOL_REWARD, {
            launchpool: launchpool.toBase58()
        });
        return postBase64Tx(this.routes.baseUrl, this.routes.routes.LAUNCHPOOL_SCOPE, route, {
            signer: signer.toBase58()
        });
    }
}