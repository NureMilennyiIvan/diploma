"use client"

import React, {ReactNode} from "react";
import {useWallet} from "@solana/wallet-adapter-react";
import '@solana/wallet-adapter-react-ui/styles.css';
import {SolanaContextWrapper} from "@/components/solana/solana-context-wrapper";
import {Connection} from "@solana/web3.js";

export const SolanaWalletProvider = ({connection, children,}: {connection: Connection, children: ReactNode; }) => {
    const wallet = useWallet();
    return (
        <SolanaContextWrapper wallet={wallet} connection={connection}>
            {children}
        </SolanaContextWrapper>
    );
};