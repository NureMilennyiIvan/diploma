"use client"

import React, {createContext, useContext, useMemo} from "react";
import {LiquidityPoolRoutes, LiquidityPoolService} from "@/services/liquidity-pool-service";

type LiquidityPoolServiceContext = {
    service: LiquidityPoolService
}

const LiquidityPoolContext = createContext<LiquidityPoolServiceContext | undefined>(undefined);

export const LiquidityPoolContextWrapper = ({routes, children}: {routes: LiquidityPoolRoutes;     children: React.ReactNode;}) => {
    const service = useMemo(() => new LiquidityPoolService(routes), [routes]);
    return (
        <LiquidityPoolContext.Provider value={{service}}>
            {children}
        </LiquidityPoolContext.Provider>
    );
}

export const useLiquidityPoolService = () => {
    const context = useContext(LiquidityPoolContext);
    if (!context) {
        throw new Error("LiquidityPoolContext is not initialized.");
    }
    return context.service;
};
