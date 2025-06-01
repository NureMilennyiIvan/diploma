import {AmmsConfigsManager} from "@/models/amms-configs-manager";
import {useQuery} from "@tanstack/react-query";
import {CpAmmRow} from "@/models/cp-amm-row";
import {PublicKey} from "@solana/web3.js";
import {AmmsConfig} from "@/models/amms-config";

export type LiquidityPoolRoutes = {
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
}

export class LiquidityPoolService {
    private readonly routes: LiquidityPoolRoutes;

    constructor(routes: LiquidityPoolRoutes) {
        this.routes = routes;
    }

    private getRoute(template: string, params: Record<string, string>): string {
        return Object.entries(params).reduce(
            (route, [key, value]) => route.replace(`{${key}}`, value),
            template
        );
    }
    fetchAmmsConfigsManager = () => {
        const { data, isLoading, error, } = useQuery({
            queryKey: ["ammsConfigsManager"],
            queryFn: async (): Promise<AmmsConfigsManager> => {
                return Promise.resolve(AmmsConfigsManager.mock());
            },
            gcTime: 10_000,
            refetchOnWindowFocus: true,
            refetchInterval: 10_000,
            retry: 1
        });

        return { data, isLoading, error, };
    };
    fetchAmmsConfigs = (limit?: number) => {
        const { data, isLoading, error, } = useQuery({
            queryKey: ["ammsConfigs", limit],
            queryFn: async (): Promise<AmmsConfig[]> => {
                return Promise.resolve([
                    AmmsConfig.mock(),
                    AmmsConfig.mock(),
                    AmmsConfig.mock()
                ]);
            },
            gcTime: 10_000,
            refetchOnWindowFocus: true,
            refetchInterval: 10_000,
            retry: 1
        });

        return { data, isLoading, error, };
    };
    fetchCpAmmRows = (limit?: number, baseMint?: PublicKey, quoteMint?: PublicKey) => {
        const { data, isLoading, error, } = useQuery({
            queryKey: ["cpAmmRows", limit, baseMint, quoteMint],
            queryFn: async (): Promise<CpAmmRow[]> => {
                return Promise.resolve([
                    CpAmmRow.mock(),
                    CpAmmRow.mock(),
                    CpAmmRow.mock(),
                    CpAmmRow.mock(),
                    CpAmmRow.mock(),
                ]);
            },
            gcTime: 60_000,
            refetchOnWindowFocus: true,
            refetchInterval: 30_000,
            retry: 1,
        });

        return { data, isLoading, error, };
    };
}