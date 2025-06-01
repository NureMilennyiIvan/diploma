"use client"

import {BN} from "@coral-xyz/anchor";
import {DexProject} from "../../../../anchor/src";
import {LiquidityPool} from "@/blockchain/accounts-models/liquidity-pool";
import {useMemo} from "react";
import {useProgramWithProvider} from "@/components/solana/anchor-context-wrapper";
import {LiquidityPoolQueryService} from "@/blockchain/services/liquidity-pool-query-service";
import {useQueryClient} from "@tanstack/react-query";
import styles from "@/components/liquidity-pool/liquidity-pool-page.module.css";

export const WithdrawButton = ({liquidityPool, lpTokensToBurn, lpTokensBalance, handleManualRefetch}: {
    liquidityPool: LiquidityPool, lpTokensToBurn: BN, lpTokensBalance: BN, handleManualRefetch: () => Promise<void>
}) => {
    const {program, provider} = useProgramWithProvider<DexProject>();
    const queryClient = useQueryClient();

    const buttonDisabledMessage = useMemo(() => {
        if (lpTokensBalance.lt(lpTokensToBurn)) {
            return "Insufficient balance.";
        }
        if (lpTokensToBurn.isZero()){
            return "There is nothing to withdraw"
        }
        return "";
    }, [lpTokensToBurn, lpTokensBalance]);

    const isButtonDisabled = useMemo(() => buttonDisabledMessage.length != 0, [buttonDisabledMessage]);

    const useWithdrawLiquidityToPoolMutation = LiquidityPoolQueryService.useWithdrawLiquidityToPool(
        program,
        provider,
        async () => {},
    )

    const handleProvideLiquidityToPool = async () => {
        try{
            await useWithdrawLiquidityToPoolMutation.mutateAsync({
                liquidityPool,
                lpTokensToBurn
            });
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
        <button className={styles.actionButton} onClick={handleProvideLiquidityToPool} disabled={isButtonDisabled} title={isButtonDisabled ? buttonDisabledMessage : "Click to Withdraw"}>
            Withdraw Liquidity
        </button>
    )
}