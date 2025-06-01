"use client";

import React, {useMemo} from "react";
import {useProgramWithProvider} from "@/components/solana/anchor-context-wrapper";
import { DexProject } from "../../../../anchor/src";
import styles from "./collect-fees.module.css"
import { faHandHoldingDollar} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {LiquidityPoolQueryService} from "@/blockchain/services/liquidity-pool-query-service";
import {LiquidityPool} from "@/blockchain/accounts-models/liquidity-pool";
import {BN} from "@coral-xyz/anchor";
import {useQueryClient} from "@tanstack/react-query";

export const CollectFeesButton = ({liquidityPool, creatorBaseFeeToRedeem, creatorQuoteFeeToRedeem, platformBaseFeeToRedeem, platformQuoteFeeToRedeem, handleManualRefetch}: {
    liquidityPool: LiquidityPool, creatorBaseFeeToRedeem: BN, creatorQuoteFeeToRedeem: BN,
    platformBaseFeeToRedeem: BN, platformQuoteFeeToRedeem: BN, handleManualRefetch: () => Promise<void>
}) => {
    const {provider, program} = useProgramWithProvider<DexProject>();
    const queryClient = useQueryClient();

    const buttonDisabledMessage = useMemo(() => {
        if (creatorBaseFeeToRedeem.isZero() || creatorQuoteFeeToRedeem.isZero() || platformBaseFeeToRedeem.isZero() || platformQuoteFeeToRedeem.isZero()) {
            return "There is no fee to collect now";
        }
        return "";
    }, [creatorBaseFeeToRedeem, creatorQuoteFeeToRedeem, platformBaseFeeToRedeem, platformQuoteFeeToRedeem]);

    const isButtonDisabled = useMemo(() => buttonDisabledMessage.length != 0, [buttonDisabledMessage]);
    const useCollectFeesMutation = LiquidityPoolQueryService.useCollectFees(
        program,
        provider,
        async () => {}
    )
    const handleCollectFees = async () => {
        try{
            await useCollectFeesMutation.mutateAsync(liquidityPool);
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
        <div className={styles.buttonContainer}>
            <button className={styles.harvestButton} onClick={handleCollectFees} disabled={isButtonDisabled} title={isButtonDisabled ? buttonDisabledMessage : "Collect Fees for pool creator and platform"}>
                <FontAwesomeIcon icon={faHandHoldingDollar} className={styles.icon}/>
            </button>
        </div>
    );
};
