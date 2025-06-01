'use client'

import dynamic from 'next/dynamic'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import React, {createContext, ReactNode, useContext, useMemo, useRef} from 'react'
import {PhantomWalletAdapter} from "@solana/wallet-adapter-phantom";
import {WalletButtonProvider} from "@/components/solana/wallet-button-provider";
import {SolanaWalletProvider} from "@/components/solana/solana-wallet-provider";
import {Connection} from "@solana/web3.js";

require('@solana/wallet-adapter-react-ui/styles.css')

export const WalletButton = dynamic(async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton, {
  ssr: false,
})
export const SolanaWalletAdapterProvider = ({endpoint, children }: {endpoint: string, children: ReactNode}) => {
  const wallets = useMemo(
      () => [
        new PhantomWalletAdapter(),
      ],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [endpoint]
  );
  const connection = new Connection(endpoint);
  return (
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
              <WalletButtonProvider>
                  <SolanaWalletProvider connection={connection}>
                      {children}
                  </SolanaWalletProvider>
              </WalletButtonProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
  );
};