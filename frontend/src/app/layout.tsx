import {SolanaWalletAdapterProvider} from '@/components/solana/solana-wallet-adapter-provider'
import {GeneralPageLayout} from '@/components/ui/general-page-layout'
import {ReactQueryProvider} from './react-query-provider'
import React from "react";
import {config as loadEnv} from "dotenv";
import path from "path";
import {BackendServicesProvider} from "@/components/backend/backend-services-provider";

loadEnv({
    path: path.resolve(__dirname, ""),
});
export const metadata = {
    title: '',
    description: '',
}

export default function RootLayout({children}: { children: React.ReactNode }) {
    const endpoint = "http://localhost:8899";
    return (
        <html lang="en">
        <body style={{margin: "0"}}>
        <ReactQueryProvider>
            <SolanaWalletAdapterProvider endpoint={endpoint}>
                <BackendServicesProvider>
                    <GeneralPageLayout>{children}</GeneralPageLayout>
                </BackendServicesProvider>
            </SolanaWalletAdapterProvider>
        </ReactQueryProvider>
        </body>
        </html>
    )
}
