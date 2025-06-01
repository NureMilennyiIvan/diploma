"use client"

import {PublicKey} from "@solana/web3.js";
import React, {useEffect, useMemo, useState} from "react";
import {ListedToken} from "@/blockchain/accounts-models/listed-token";
import {DexPdaFinder} from "@/blockchain/utils/dex-pda-finder";
import {useRouter} from "next/navigation";
import {useQueryClient} from "@tanstack/react-query";
import {links} from "@/components/ui/general-page-layout";
import {handleTokenInputChange, validateAmount} from "@/components/utils";
import {useProgramWithProvider} from "@/components/solana/anchor-context-wrapper";
import {DexProject} from "../../../../anchor/src";
import {AtaQueryService} from "@/blockchain/services/ata-query-service";
import {LiquidityPoolQueryService} from "@/blockchain/services/liquidity-pool-query-service";
import styles from "./create-liquidity-pool.module.css";

export const CreateLiquidityPoolForm = ({allowedListedTokensMap}:{allowedListedTokensMap: Map<string, ListedToken>}) => {

    const [sortedTokens, setSortedTokens] = useState<ListedToken[]>([]);
    const {program, provider} = useProgramWithProvider<DexProject>();
    const [selectedBaseToken, setSelectedBaseToken] = useState<ListedToken | null>(null);
    const [selectedQuoteToken, setSelectedQuoteToken] = useState<ListedToken | null>(null);
    const [baseTokenInput, setBaseTokenInput] = useState<string>("");
    const [quoteTokenInput, setQuoteTokenInput] = useState<string>("");
    const [commission, setCommission] = useState<number>(0);
    const [baseTokenError, setBaseTokenError] = useState<string>("");
    const [quoteTokenError, setQuoteTokenError] = useState<string>("");

    const selectedBaseTokenAta = useMemo(
        () => (!selectedBaseToken ? null : DexPdaFinder.findAta(selectedBaseToken.getMint(), provider.publicKey)),
        [selectedBaseToken]
    );
    const selectedQuoteTokenAta = useMemo(
        () => (!selectedQuoteToken ? null : DexPdaFinder.findAta(selectedQuoteToken.getMint(), provider.publicKey)),
        [selectedQuoteToken]
    );

    const {
        balance: baseTokenBalance,
    } = AtaQueryService.useAtaBalance(program.provider.connection, selectedBaseTokenAta, 5000);
    const {
        balance: quoteTokenBalance,
    } = AtaQueryService.useAtaBalance(program.provider.connection, selectedQuoteTokenAta, 5000);

    const router = useRouter();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (allowedListedTokensMap.size > 1) {
            const sorted = [...allowedListedTokensMap.values()].sort((a, b) => a.getName().localeCompare(b.getName()));
            setSelectedBaseToken(sorted[0])
            setSelectedQuoteToken(sorted[1])
            setSortedTokens(sorted);
        }
    }, [allowedListedTokensMap]);

    const useCreateLiquidityPoolMutation = LiquidityPoolQueryService.useCreateLiquidityPool(
        program,
        provider,
        async () => {}
    )

    const handleTokenChange = (
        mint: PublicKey ,
        setSelectedToken: React.Dispatch<React.SetStateAction<ListedToken | null>>,
        currentSelectedToken: ListedToken,
        anotherSelectedToken: ListedToken | null,
        setAnotherSelectedToken: React.Dispatch<React.SetStateAction<ListedToken | null>>,
    ) => {
        if (allowedListedTokensMap){
            const selectedToken = allowedListedTokensMap.get(mint.toBase58())!;
            if (anotherSelectedToken && anotherSelectedToken.getPublicKey().equals(selectedToken.getPublicKey())){
                setAnotherSelectedToken(currentSelectedToken)
            }
            setSelectedToken(selectedToken);
        }
    };

    const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCommission(parseFloat(e.target.value));
    };
    const handleLaunchLiquidityPool = async (baseListedToken: ListedToken, quoteListedToken: ListedToken) =>{
        try{
            const baseInputAmount = validateAmount(baseListedToken.parseAmount(parseFloat(baseTokenInput)), baseTokenBalance);
            setBaseTokenError(baseInputAmount.error);
            if (!baseInputAmount.inputAmount){
                return;
            }

            const quoteInputAmount = validateAmount(quoteListedToken.parseAmount(parseFloat(quoteTokenInput)), quoteTokenBalance);
            setQuoteTokenError(quoteInputAmount.error);
            if (!quoteInputAmount.inputAmount){
                return;
            }

            const liquidityPool = await useCreateLiquidityPoolMutation.mutateAsync({
                baseListedToken,
                quoteListedToken,
                baseLaunchAmount: baseInputAmount.inputAmount,
                quoteLaunchAmount: quoteInputAmount.inputAmount,
                creatorSwapFee: commission * 100,
            })
            await LiquidityPoolQueryService.invalidateLaunchedLiquidityPoolsShortSlicesCache(queryClient)
            router.push(`${links.liquidityPool.path}${liquidityPool}`)
        }
        catch (error){
            alert(error)
        }
    }


    return (
        <div className={styles.createLiquidityPoolForm}>
            {selectedBaseToken && (
                <div className={styles.formSection}>
                    <label className={styles.label}>Base Token</label>
                    <select
                        className={styles.select}
                        value={selectedBaseToken.getMint().toBase58()}
                        onChange={(e) => {
                            handleTokenChange(
                                new PublicKey(e.target.value),
                                setSelectedBaseToken,
                                selectedBaseToken,
                                selectedQuoteToken,
                                setSelectedQuoteToken
                            );
                        }}
                    >
                        {sortedTokens.map((token) => (
                            <option key={token.getPublicKey().toBase58()} value={token.getMint().toBase58()}>
                                {token.getName()} ({token.getSymbol()})
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={baseTokenInput}
                        className={styles.inputNumber}
                        onChange={(e) => handleTokenInputChange(e, setBaseTokenInput)}
                        placeholder="Base amount"
                    />
                    {baseTokenError && <p className={styles.error}>{baseTokenError}</p>}
                </div>
            )}

            {selectedQuoteToken && (
                <div className={styles.formSection}>
                    <label className={styles.label}>Quote Token</label>
                    <select
                        className={styles.select}
                        value={selectedQuoteToken.getMint().toBase58()}
                        onChange={(e) => {
                            handleTokenChange(
                                new PublicKey(e.target.value),
                                setSelectedQuoteToken,
                                selectedQuoteToken,
                                selectedBaseToken,
                                setSelectedBaseToken
                            );
                        }}
                    >
                        {sortedTokens.map((token) => (
                            <option key={token.getPublicKey().toBase58()} value={token.getMint().toBase58()}>
                                {token.getName()} ({token.getSymbol()})
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={quoteTokenInput}
                        className={styles.inputNumber}
                        onChange={(e) => handleTokenInputChange(e, setQuoteTokenInput)}
                        placeholder="Quote amount"
                    />
                    {quoteTokenError && <p className={styles.error}>{quoteTokenError}</p>}
                </div>
            )}

            {selectedBaseToken && selectedQuoteToken && (
                <div className={styles.commissionSection}>
                    <label className={styles.label}>Commission: {commission.toFixed(2)}%</label>
                    <input
                        type="range"
                        className={styles.range}
                        min="0.01"
                        max="99.99"
                        step="0.01"
                        value={commission}
                        onChange={handleCommissionChange}
                    />
                    <input
                        type="number"
                        className={styles.inputNumber}
                        min="0.01"
                        max="99.99"
                        step="0.01"
                        value={commission}
                        onChange={handleCommissionChange}
                        placeholder="Commission"
                    />
                    <div className={styles.utils}>
                        <div className={styles.utilsText}>
                            <strong>Price: 1 SOL</strong>
                        </div>
                    </div>
                        <button
                            className={styles.button}
                            onClick={() => handleLaunchLiquidityPool(selectedBaseToken, selectedQuoteToken)}
                        >
                            Launch Pool
                        </button>
                    </div>
                    )}
                </div>
            );
            }