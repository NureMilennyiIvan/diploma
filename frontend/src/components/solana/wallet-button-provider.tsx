"use client"

import {createContext, useContext} from "react";

const WalletButtonContext = createContext<(() => void) | null>(null);

export const WalletButtonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const triggerWalletButtonClick = () => {
        const button = document.querySelector('.wallet-adapter-button');
        if (button) {
            (button as HTMLButtonElement).click();
        } else {
            console.warn("Wallet button not found");
        }
    };

    return (
        <WalletButtonContext.Provider value={triggerWalletButtonClick}>
            {children}
        </WalletButtonContext.Provider>
    );
};
export const useWalletButton = () => {
    const context = useContext(WalletButtonContext);
    if (!context) {
        throw new Error("useWalletButton has to be used inside WalletButtonProvider");
    }
    return context;
};