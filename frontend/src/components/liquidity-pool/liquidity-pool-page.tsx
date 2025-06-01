"use client"

import {LiquidityPool} from "@/blockchain/accounts-models/liquidity-pool";
import {ListedToken} from "@/blockchain/accounts-models/listed-token";
import {useAnchorProviderContext} from "@/components/solana/anchor-context-wrapper";
import { DexProject } from "anchor/src/dex_project-exports";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {DexPdaFinder} from "@/blockchain/utils/dex-pda-finder";
import {SwapForm} from "@/components/liquidity-pool/swap/swap-form";
import {ProvideForm} from "@/components/liquidity-pool/provide/provide-form";
import {WithdrawForm} from "@/components/liquidity-pool/withdraw/withdraw-form";
import {LiquidityPoolQueryService} from "@/blockchain/services/liquidity-pool-query-service";
import {AtaQueryService} from "@/blockchain/services/ata-query-service";
import styles from "./liquidity-pool-page.module.css"

export const LiquidityPoolPage = ({liquidityPool, baseListedToken, quoteListedToken}: {liquidityPool: LiquidityPool, baseListedToken: ListedToken, quoteListedToken: ListedToken}) => {
    const {program, provider} = useAnchorProviderContext<DexProject>();
    const [selectedMode, setSelectedMode] = useState<'swap' | 'provide' | 'withdraw'>('swap');
    const {data: liquidityPoolTradeInfo, isLoading, error, isFetching, refetch: refetchTradeInfo } = LiquidityPoolQueryService.useLiquidityPoolTradeInfo(program, liquidityPool.getPublicKey())
    const [lastRefetchTime, setLastRefetchTime] = useState<number>(Date.now());
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

    const providerAssociatedAccounts = useMemo(
        () => (!provider ? {
            baseAta: null,
            quoteAta: null,
            lpAta: null
        } : {
            baseAta: DexPdaFinder.findAta(liquidityPool.getBaseTokenMint(), provider.publicKey),
            quoteAta: DexPdaFinder.findAta(liquidityPool.getQuoteTokenMint(), provider.publicKey),
            lpAta: DexPdaFinder.findAta(liquidityPool.getLpTokenMint(), provider.publicKey)
        }),
        [liquidityPool, provider]
    );

    const {balance: baseTokenBalance, refetch: refetchBaseBalance} = AtaQueryService.useAtaBalance(program.provider.connection, providerAssociatedAccounts.baseAta, 6000);
    const {balance: quoteTokenBalance, refetch: refetchQuoteBalance} = AtaQueryService.useAtaBalance(program.provider.connection, providerAssociatedAccounts.quoteAta, 6000);
    const {balance: lpTokenBalance, refetch: refetchLpBalance} = AtaQueryService.useAtaBalance(program.provider.connection, providerAssociatedAccounts.lpAta, 6000);

    const handleModeChange = (mode: 'swap' | 'provide' | 'withdraw') => {
        setSelectedMode(mode);
    };
    const handleManualRefetch = async () => {
        await Promise.all([
            refetchTradeInfo(),
            refetchQuoteBalance(),
            refetchLpBalance(),
            refetchBaseBalance()
        ]);
        setLastRefetchTime(Date.now());
    };

    useEffect(() => {
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
        }

        intervalIdRef.current = setInterval(async () => {
            const elapsedTime = Date.now() - lastRefetchTime;
            if (elapsedTime >= 5000 && !isFetching) {
                await refetchTradeInfo();
                setLastRefetchTime(Date.now());
            }
        }, 1000);

        return () => {
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
            }
        };
    }, [lastRefetchTime]);

    return (
        <div className={`${styles.liquidityPoolCard}`}>
            <div className={`${styles.header}`}>
                <div className={`${styles.modeSelector}`}>
                    <button
                        onClick={() => handleModeChange("swap")}
                        className={selectedMode === "swap" ? styles.active : ""}
                    >
                        Swap
                    </button>
                    <button
                        onClick={() => handleModeChange("provide")}
                        className={selectedMode === "provide" ? styles.active : ""}
                    >
                        Provide
                    </button>
                    <button
                        onClick={() => handleModeChange("withdraw")}
                        className={selectedMode === "withdraw" ? styles.active : ""}
                    >
                        Withdraw
                    </button>
                </div>
            </div>
            <div className={styles.liquidityPoolPageForm}>
                {isLoading ? (
                    <div>Loading trade information...</div>
                ) : error ? (
                    <div className="error-message">Error loading trade information: {error.message}</div>
                ) : (
                    liquidityPoolTradeInfo && !!liquidityPoolTradeInfo && (
                        <div>
                            {selectedMode === 'swap' && (
                                <SwapForm
                                    liquidityPool={liquidityPool}
                                    liquidityPoolTradeInfo={liquidityPoolTradeInfo}
                                    baseListedToken={baseListedToken}
                                    quoteListedToken={quoteListedToken}
                                    providerBaseBalance={baseTokenBalance}
                                    providerQuoteBalance={quoteTokenBalance}
                                    handleManualRefetch={handleManualRefetch}
                                />
                            )}

                            {selectedMode === 'provide' && (
                                <ProvideForm
                                    liquidityPool={liquidityPool}
                                    liquidityPoolTradeInfo={liquidityPoolTradeInfo}
                                    baseListedToken={baseListedToken}
                                    quoteListedToken={quoteListedToken}
                                    providerBaseBalance={baseTokenBalance}
                                    providerQuoteBalance={quoteTokenBalance}
                                    handleManualRefetch={handleManualRefetch}
                                />
                            )}

                            {selectedMode === 'withdraw' && (
                                <WithdrawForm
                                    liquidityPool={liquidityPool}
                                    liquidityPoolTradeInfo={liquidityPoolTradeInfo}
                                    baseListedToken={baseListedToken}
                                    quoteListedToken={quoteListedToken}
                                    providerLpBalance={lpTokenBalance}
                                    handleManualRefetch={handleManualRefetch}
                                />
                            )}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}