"use client"

import {useMemo} from "react";
import {BN} from "@coral-xyz/anchor";
import {LiquidityPool} from "@/blockchain/accounts-models/liquidity-pool";
import { DexProject } from "../../../../anchor/src/dex_project-exports";
import {useProgramWithProvider} from "@/components/solana/anchor-context-wrapper";
import {LiquidityPoolQueryService} from "@/blockchain/services/liquidity-pool-query-service";
import {useQueryClient} from "@tanstack/react-query";
import styles from "@/components/liquidity-pool/liquidity-pool-page.module.css";

export const SwapButton = ({liquidityPool, balance, minimalSwap, amount, estimatedAmount, allowedSlippageAmount, isBaseToQuote, handleManualRefetch}: {
    liquidityPool: LiquidityPool, balance: BN, minimalSwap: BN,
    amount: BN, estimatedAmount: BN, allowedSlippageAmount: BN, isBaseToQuote: boolean, handleManualRefetch: () => Promise<void>
}) => {
    const {program, provider} = useProgramWithProvider<DexProject>();
    const queryClient = useQueryClient();

    const buttonDisabledMessage = useMemo(() => {
        if (amount.lte(new BN(0))) {
            return "Swap must be greater than 0.";
        }
        if (balance.lt(amount)) {
            return "Insufficient balance for swap.";
        }
        if (amount.lt(minimalSwap)) {
            return `Swap amount must be greater than the minimum swap amount.`;
        }
        return "";
    }, [amount, balance, minimalSwap]);

    const isButtonDisabled = useMemo(() => buttonDisabledMessage.length != 0, [buttonDisabledMessage]);

    const useSwapInLiquidityPoolMutation = LiquidityPoolQueryService.useSwapTokensInPool(
        program,
        provider,
        async () => {}
    )

    const handleSwapInLiquidityPool = async () => {
        try{
            await useSwapInLiquidityPoolMutation.mutateAsync({
                    allowedSlippageAmount,
                    amount,
                    estimatedAmount,
                    isBaseToQuote,
                    liquidityPool
                }
            );
            await Promise.all([
                LiquidityPoolQueryService.invalidateLaunchedLiquidityPoolsShortSlicesCache(queryClient),
                LiquidityPoolQueryService.invalidateLiquidityPoolCache(queryClient, liquidityPool.getPublicKey())
            ])
        }
        catch (error){
            alert(error)
        }
        await handleManualRefetch()
    }

    return (
        <button className={styles.actionButton} onClick={handleSwapInLiquidityPool} disabled={isButtonDisabled} title={isButtonDisabled ? buttonDisabledMessage : "Click to Swap"}>
            Swap
        </button>
    )
}