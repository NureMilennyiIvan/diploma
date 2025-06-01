"use client";

import React, {createContext, useContext, useMemo} from "react";
import { WalletContextState} from "@solana/wallet-adapter-react";
import {Connection, PublicKey, TransactionSignature, VersionedTransaction} from "@solana/web3.js";
import {Transaction} from "@solana/kit";
import {SendTransactionOptions} from "@solana/wallet-adapter-base";

type SolanaWalletContext = {
    walletData: WalletData | undefined,
    connection: Connection
};
type WalletData = {
    publicKey: PublicKey;
    signTransaction: <T extends VersionedTransaction | Transaction>(tx: T) => Promise<T>;
    sendTransaction: (
        tx: VersionedTransaction | Transaction,
        connection: Connection,
        options?: SendTransactionOptions
    ) => Promise<TransactionSignature>;
};
const SolanaContext = createContext<SolanaWalletContext | undefined>(undefined);

export const SolanaContextWrapper = ({wallet, connection, children,}: {
    wallet: WalletContextState;
    connection: Connection;
    children: React.ReactNode;
}) => {
    const getWalletData = (wallet: WalletContextState): WalletData | undefined => {
        let publicKey = wallet.publicKey;
        let signTransaction = wallet.signTransaction;
        let sendTransaction = wallet.sendTransaction;
        if (!publicKey || !signTransaction || !wallet.connected) return undefined;
        return {
            publicKey,
            signTransaction,
            sendTransaction
        } as WalletData
    };


    const walletData = useMemo(() => getWalletData(wallet), [wallet, connection]);

    return (
        <SolanaContext.Provider value={{walletData, connection}}>
            {children}
        </SolanaContext.Provider>
    );
};

export const usePublicKey = () => {
    const context = useContext(SolanaContext);
    if (!context) {
        throw new Error("SolanaContext is not initialized.");
    }
    const wallet = context.walletData;
    return wallet?.publicKey;
};
export const useSignAndSendTransaction = () => {
    const context = useContext(SolanaContext);
    if (!context) {
        throw new Error("SolanaContext is not initialized.");
    }
    const wallet = context.walletData;
    if (!wallet) {
        throw new Error("Wallet is not connected.");
    }

    return async <T extends Transaction>(
        transaction: T,
        options?: SendTransactionOptions
    ): Promise<TransactionSignature> => {
        const signed = await wallet.signTransaction(transaction);
        return await wallet.sendTransaction(signed, context.connection, options);
    };
};
export const useSolanaWalletContext = () => {
    const context = useContext(SolanaContext);
    if (!context) {
        throw new Error("SolanaWalletContext is not initialized.");
    }
    return context;
};

export const useIsWalletConnected = (): boolean => {
    const context = useContext(SolanaContext);
    return !!context?.walletData;
};