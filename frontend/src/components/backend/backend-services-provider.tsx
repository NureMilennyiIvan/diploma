"use client"

import {ReactNode} from "react";
import {LaunchpoolRoutes} from "@/services/launchpool-service";
import {LiquidityPoolRoutes} from "@/services/liquidity-pool-service";
import {LaunchpoolContextWrapper} from "@/components/backend/launchpool-context-wrapper";
import {LiquidityPoolContextWrapper} from "@/components/backend/liquidity-pool-context-wrapper";

export const BackendServicesProvider = ({children}: {children: ReactNode}) => {
    const launchpoolRoutes: LaunchpoolRoutes = {
        baseUrl: "",
        routes: {
            CLOSE_STAKE_POSITION: "",
            COLLECT_PROTOCOL_REWARD: "",
            INCREASE_STAKE_POSITION: "",
            INIT_LAUNCHPOOL: "",
            INIT_LAUNCHPOOLS_CONFIG: "",
            INIT_LAUNCHPOOL_CONFIGS_MANAGER: "",
            LAUNCHPOOL_SCOPE: "",
            LAUNCH_LAUNCHPOOL: "",
            OPEN_STAKE_POSITION: "",
            UPDATE_LAUNCHPOOLS_CONFIG_DURATION: "",
            UPDATE_LAUNCHPOOLS_CONFIG_POSITION_SIZES: "",
            UPDATE_LAUNCHPOOLS_CONFIG_PROTOCOL_REWARD_SHARE: "",
            UPDATE_LAUNCHPOOLS_CONFIG_REWARD_AUTHORITY: "",
            UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_AUTHORITY: "",
            UPDATE_LAUNCHPOOL_CONFIGS_MANAGER_HEAD_AUTHORITY: ""
        }

    }
    const liquidityPoolRoutes: LiquidityPoolRoutes = {
        baseUrl: "",
        routes: {
            COLLECT_FEES_FROM_CP_AMM: "",
            INIT_AMMS_CONFIG: "",
            INIT_AMMS_CONFIGS_MANAGER: "",
            INIT_CP_AMM: "",
            LAUNCH_CP_AMM: "",
            LIQUIDITY_POOL_SCOPE: "",
            PROVIDE_TO_CP_AMM: "",
            SWAP_IN_CP_AMM: "",
            UPDATE_AMMS_CONFIGS_MANAGER_AUTHORITY: "",
            UPDATE_AMMS_CONFIGS_MANAGER_HEAD_AUTHORITY: "",
            UPDATE_AMMS_CONFIG_FEE_AUTHORITY: "",
            UPDATE_AMMS_CONFIG_PROTOCOL_FEE_RATE: "",
            UPDATE_AMMS_CONFIG_PROVIDERS_FEE_RATE: "",
            WITHDRAW_FROM_CP_AMM: ""
        }

    }
    return (
        <LiquidityPoolContextWrapper routes={liquidityPoolRoutes}>
            <LaunchpoolContextWrapper routes={launchpoolRoutes}>
                {children}
            </LaunchpoolContextWrapper>
        </LiquidityPoolContextWrapper>
    )
}