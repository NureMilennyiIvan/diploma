"use client"

import {BN} from "@coral-xyz/anchor";
import {DexProject} from "../../../../anchor/src";
import {LiquidityPool} from "@/blockchain/accounts-models/liquidity-pool";
import {useMemo} from "react";
import {useProgramWithProvider} from "@/components/solana/anchor-context-wrapper";
import {LiquidityPoolQueryService} from "@/blockchain/services/liquidity-pool-query-service";
import {useQueryClient} from "@tanstack/react-query";
import styles from "../liquidity-pool-page.module.css";

export const ProvideButton = ({liquidityPool, minimalBaseProvideLiquidity, minimalQuoteProvideLiquidity, baseBalance, baseProvideAmount, quoteBalance, quoteProvideAmount, isBaseToQuote, handleManualRefetch}: {
    liquidityPool: LiquidityPool, minimalBaseProvideLiquidity: BN, minimalQuoteProvideLiquidity: BN, baseBalance: BN,
    baseProvideAmount: BN, quoteBalance: BN, quoteProvideAmount: BN, isBaseToQuote: boolean, handleManualRefetch: () => Promise<void>
}) => {
    const {program, provider} = useProgramWithProvider<DexProject>();
    const queryClient = useQueryClient();

    const buttonDisabledMessage = useMemo(() => {
        if (baseProvideAmount.lte(new BN(0)) || quoteProvideAmount.lte(new BN(0))) {
            return "Provide amount must be greater than 0.";
        }
        if (baseBalance.lt(baseProvideAmount) || quoteBalance.lt(quoteProvideAmount)) {
            return "Insufficient balance.";
        }
        if (baseProvideAmount.lt(minimalBaseProvideLiquidity)) {
            return `Base provide amount must be greater than or equal to the minimum liquidity to provide`;
        }
        if (quoteProvideAmount.lt(minimalQuoteProvideLiquidity)) {
            return `Quote provide amount must be greater than or equal to the minimum liquidity to provide`;
        }
        return "";
    }, [baseProvideAmount, baseBalance, quoteProvideAmount, quoteBalance, minimalBaseProvideLiquidity, minimalQuoteProvideLiquidity]);

    const isButtonDisabled = useMemo(() => buttonDisabledMessage.length != 0, [buttonDisabledMessage]);

    const useProvideLiquidityToPoolMutation = LiquidityPoolQueryService.useProvideLiquidityToPool(
        program,
        provider,
        async () => {}
    )

    const handleProvideLiquidityToPool = async () => {
        try{
            if (isBaseToQuote){
                await useProvideLiquidityToPoolMutation.mutateAsync({
                        liquidityPool,
                        baseProvideAmount,
                        quoteProvideAmount
                    }
                );
            }
            else{
                await useProvideLiquidityToPoolMutation.mutateAsync({
                        liquidityPool,
                        baseProvideAmount: quoteProvideAmount,
                        quoteProvideAmount: baseProvideAmount,
                    }
                );
            }
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
        <button className={styles.actionButton}
            onClick={handleProvideLiquidityToPool}
            disabled={isButtonDisabled}
            title={isButtonDisabled ? buttonDisabledMessage : "Click to Provide"}
        >
            Provide Liquidity
        </button>
    )
}