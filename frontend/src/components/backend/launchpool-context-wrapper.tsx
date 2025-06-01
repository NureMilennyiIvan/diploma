"use client"

import {LaunchpoolRoutes, LaunchpoolService} from "@/services/launchpool-service";
import React, {createContext, useContext, useMemo} from "react";

type LaunchpoolServiceContext = {
    service: LaunchpoolService
}

const LaunchpoolContext = createContext<LaunchpoolServiceContext | undefined>(undefined);

export const LaunchpoolContextWrapper = ({routes, children}: {routes: LaunchpoolRoutes;     children: React.ReactNode;}) => {
    const service = useMemo(() => new LaunchpoolService(routes), [routes]);
    return (
        <LaunchpoolContext.Provider value={{service}}>
            {children}
        </LaunchpoolContext.Provider>
    );
}

export const useLaunchpoolService = () => {
    const context = useContext(LaunchpoolContext);
    if (!context) {
        throw new Error("LaunchpoolContext is not initialized.");
    }
    return context.service;
};
