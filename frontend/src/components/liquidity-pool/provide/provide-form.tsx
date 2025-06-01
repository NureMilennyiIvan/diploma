"use client"

import {LiquidityPool} from "@/blockchain/accounts-models/liquidity-pool";
import {LiquidityPoolTradeInfo} from "@/blockchain/accounts-models/liquidity-pool-trade-info";
import {ListedToken} from "@/blockchain/accounts-models/listed-token";
import {BN} from "@coral-xyz/anchor";
import {DexProject} from "../../../../anchor/src";
import React, {useEffect, useState} from "react";
import {handlePercentageAmountClick, handleTokenInputChange} from "@/components/utils";
import {ProvideButton} from "@/components/liquidity-pool/provide/provide-button";
import {useAnchorProviderContext} from "@/components/solana/anchor-context-wrapper";
import styles from "../liquidity-pool-page.module.css";
import {ReverseButton, SyncButton} from "@/components/liquidity-pool/form-parts";
import {useWalletButton} from "@/components/solana/wallet-button-provider";
import {CollectFeesButton} from "@/components/liquidity-pool/collect-fees/collect-fees-button";


export const ProvideForm = ({liquidityPool, liquidityPoolTradeInfo, baseListedToken, quoteListedToken, providerBaseBalance, providerQuoteBalance, handleManualRefetch}: {
                                 liquidityPool: LiquidityPool, liquidityPoolTradeInfo: LiquidityPoolTradeInfo, baseListedToken: ListedToken,
                                 quoteListedToken: ListedToken, providerBaseBalance: BN, providerQuoteBalance: BN, handleManualRefetch: () => Promise<void>}) => {

    const {provider} = useAnchorProviderContext<DexProject>();
    const walletButtonClick = useWalletButton();

    const [baseToken, setBaseToken] = useState<ListedToken>(baseListedToken);
    const [quoteToken, setQuoteToken] = useState<ListedToken>(quoteListedToken);

    const [addLiquidityString, setAddLiquidityString] = useState<string>("");
    const [addLiquidityBN, setAddLiquidityBN] = useState<BN>(new BN(0))

    const [requiredLiquidityString, setRequiredLiquidityString] = useState<string>("0");
    const [requiredLiquidityBN, setRequiredLiquidityBN] = useState<BN>(new BN(0));

    const [share, setShare] = useState<number>(0);
    const [lpTokensToMint, setLpTokensToMint] = useState<number>(0)
    const [isBaseToQuote, setIsBaseToQuote] = useState(true);

    useEffect(() => {
        if (addLiquidityString.length > 0){
            const baseAmount = baseToken.parseAmount(addLiquidityString);
            setAddLiquidityBN(baseAmount)
            const {requiredLiquidity, share: sharePercent, lpTokensToMint: lpTokens} = liquidityPoolTradeInfo.calculateRequiredLiquidity(isBaseToQuote, baseAmount)
            setRequiredLiquidityBN(requiredLiquidity)
            setRequiredLiquidityString(quoteToken.formatAmount(requiredLiquidity).toString())
            setShare(sharePercent)
            setLpTokensToMint(lpTokens)
        }
        else{
            setAddLiquidityBN(new BN(0))
            setRequiredLiquidityBN(new BN(0))
            setRequiredLiquidityString("0")
            setShare(0)
            setLpTokensToMint(0)
        }
    }, [addLiquidityString, liquidityPoolTradeInfo]);
    const handleReverseClick = () => {
        setIsBaseToQuote(!isBaseToQuote);
        setBaseToken(quoteToken);
        setQuoteToken(baseToken)
        setAddLiquidityString(requiredLiquidityString);
    };

    return (
        <div>
            <div className={styles.field}>
                <div className={styles.baseContainer}>
                    <label>Base</label>
                    <div className={styles.percentageButtons}>
                        {[25, 50, 75, 100].map((percentage) => (
                            <button key={percentage} onClick={() => handlePercentageAmountClick(
                                isBaseToQuote ? baseListedToken.formatAmount(providerBaseBalance) : quoteListedToken.formatAmount(providerQuoteBalance),
                                percentage,
                                setAddLiquidityString
                            )}>
                                {percentage}%
                            </button>
                        ))}
                    </div>
                </div>
                <div className={styles.inputContainer}>
                    <div className={styles.tokenSymbol}>
                        {isBaseToQuote ? baseListedToken.getSymbol() : quoteListedToken.getSymbol()}
                    </div>
                    <input
                        type="text"
                        value={addLiquidityString}
                        onChange={(e) => handleTokenInputChange(e, setAddLiquidityString)}
                        placeholder={"Enter providing amount"}
                    />
                </div>

                <div className={styles.balance}>
                    <span>Your Balance: {isBaseToQuote ? baseListedToken.formatAmount(providerBaseBalance) : quoteListedToken.formatAmount(providerQuoteBalance)}</span>
                    <span>Pool Balance: {isBaseToQuote ? baseListedToken.formatAmount(liquidityPoolTradeInfo.getBaseLiquidity()) : quoteListedToken.formatAmount(liquidityPoolTradeInfo.getQuoteLiquidity())}</span>
                </div>
                <hr className={styles.divider}/>
                <div className={styles.detailsContainer}>
                    <div className={styles.detail}>
                        <span>Minimal amount</span>
                        <span>{isBaseToQuote ? baseListedToken.formatAmount(liquidityPoolTradeInfo.getMinimalBaseProvideLiquidity()) : quoteListedToken.formatAmount(liquidityPoolTradeInfo.getMinimalQuoteProvideLiquidity())}</span>
                    </div>
                </div>
            </div>
            <div className={styles.reverseButtonContainer}>
                <ReverseButton handleReverseClick={handleReverseClick}/>
            </div>
            <div className={styles.field}>
                <label>Quote</label>
                <div className={styles.inputContainer}>
                    <span
                        className={styles.tokenSymbol}>{isBaseToQuote ? quoteListedToken.getSymbol() : baseListedToken.getSymbol()}</span>
                    <input type="text" value={requiredLiquidityString} readOnly/>
                </div>
                <div className={styles.balance}>
                    <span>Your balance: {isBaseToQuote ? quoteListedToken.formatAmount(providerQuoteBalance) : baseListedToken.formatAmount(providerBaseBalance)}</span>
                    <span>Pool balance: {isBaseToQuote ? quoteListedToken.formatAmount(liquidityPoolTradeInfo.getQuoteLiquidity()) : baseListedToken.formatAmount(liquidityPoolTradeInfo.getBaseLiquidity())}</span>
                </div>
                <hr className={styles.divider}/>
                <div className={styles.detailsContainer}>
                    <div className={styles.detail}>
                        <span>Minimal amount</span>
                        <span>{isBaseToQuote ? quoteListedToken.formatAmount(liquidityPoolTradeInfo.getMinimalQuoteProvideLiquidity()) : baseListedToken.formatAmount(liquidityPoolTradeInfo.getMinimalBaseProvideLiquidity())}</span>
                    </div>
                </div>
            </div>
            <div className={styles.bottomContainer}>
                <div className={styles.utils}>
                    <div className={styles.utilsText}>
                        <strong>LP tokens to receive: {lpTokensToMint.toString()}</strong>
                        <strong>Share increase by {share.toString()}%</strong>
                    </div>
                    <div className={styles.utilsButton}>
                        <SyncButton handleManualRefetch={handleManualRefetch}/>
                        {provider && <CollectFeesButton
                            liquidityPool={liquidityPool}
                            creatorBaseFeeToRedeem={liquidityPoolTradeInfo.getCreatorBaseFeeToRedeem()}
                            creatorQuoteFeeToRedeem={liquidityPoolTradeInfo.getCreatorQuoteFeeToRedeem()}
                            platformBaseFeeToRedeem={liquidityPoolTradeInfo.getPlatformBaseFeeToRedeem()}
                            platformQuoteFeeToRedeem={liquidityPoolTradeInfo.getPlatformQuoteFeeToRedeem()}
                            handleManualRefetch={handleManualRefetch}
                        />}
                    </div>
                </div>
                <div className={styles.buttonContainer}>
                    {provider ? (
                        isBaseToQuote ? (
                            <ProvideButton
                                liquidityPool={liquidityPool}
                                minimalBaseProvideLiquidity={liquidityPoolTradeInfo.getMinimalBaseProvideLiquidity()}
                                minimalQuoteProvideLiquidity={liquidityPoolTradeInfo.getMinimalQuoteProvideLiquidity()}
                                baseBalance={providerBaseBalance}
                                baseProvideAmount={addLiquidityBN}
                                quoteBalance={providerQuoteBalance}
                                quoteProvideAmount={requiredLiquidityBN}
                                isBaseToQuote={isBaseToQuote}
                                handleManualRefetch={handleManualRefetch}
                            />
                        ) : (
                            <ProvideButton
                                liquidityPool={liquidityPool}
                                minimalBaseProvideLiquidity={liquidityPoolTradeInfo.getMinimalQuoteProvideLiquidity()}
                                minimalQuoteProvideLiquidity={liquidityPoolTradeInfo.getMinimalBaseProvideLiquidity()}
                                baseBalance={providerQuoteBalance}
                                baseProvideAmount={requiredLiquidityBN}
                                quoteBalance={providerBaseBalance}
                                quoteProvideAmount={addLiquidityBN}
                                isBaseToQuote={isBaseToQuote}
                                handleManualRefetch={handleManualRefetch}
                            />
                        )
                    ) : (
                        <button className={styles.actionButton} onClick={walletButtonClick}>Provide Liquidity</button>
                    )
                    }
                </div>
                </div>
            </div>
            );
            }