"use client"

import {LiquidityPool} from "@/blockchain/accounts-models/liquidity-pool";
import {ListedToken} from "@/blockchain/accounts-models/listed-token";
import {BN} from "@coral-xyz/anchor";
import {LiquidityPoolTradeInfo} from "@/blockchain/accounts-models/liquidity-pool-trade-info";
import React, {useEffect, useMemo, useState} from "react";
import {handleTokenInputChange, handlePercentageAmountClick} from "@/components/utils";
import { DexProject } from "../../../../anchor/src/dex_project-exports";
import {SwapButton} from "@/components/liquidity-pool/swap/swap-button";
import {useAnchorProviderContext} from "@/components/solana/anchor-context-wrapper";
import stylesSwap from "./swap-form.module.css";
import styles from "../liquidity-pool-page.module.css";
import {ReverseButton, SyncButton} from "@/components/liquidity-pool/form-parts";
import {useWalletButton} from "@/components/solana/wallet-button-provider";
import {CollectFeesButton} from "@/components/liquidity-pool/collect-fees/collect-fees-button";

export const SwapForm = ({liquidityPool, liquidityPoolTradeInfo, baseListedToken, quoteListedToken, providerBaseBalance, providerQuoteBalance, handleManualRefetch}:
                             {liquidityPool: LiquidityPool, liquidityPoolTradeInfo: LiquidityPoolTradeInfo, baseListedToken: ListedToken, quoteListedToken: ListedToken, providerBaseBalance: BN, providerQuoteBalance: BN, handleManualRefetch: () => Promise<void>}) => {

    const {provider} = useAnchorProviderContext<DexProject>();
    const walletButtonClick = useWalletButton();

    const [fromToken, setFromToken] = useState<ListedToken>(baseListedToken);
    const [toToken, setToToken] = useState<ListedToken>(quoteListedToken);
    const [fromString, setFromString] = useState<string>("");
    const [fromBN, setFromBN] = useState<BN>(new BN(0))
    const [toString, setToString] = useState<string>("0");
    const [toBN, setToBN] = useState<BN>(new BN(0));
    const [toFeeBN, setToFeeBN] = useState<BN>(new BN(0));

    const [allowedSlippage, setAllowedSlippage] = useState<BN>(new BN(0));
    const [isBaseToQuote, setIsBaseToQuote] = useState(true);

    const exchangeRateCallback = useMemo(() => {
        return {
            base: (isBaseGreaterThanQuote: boolean, {numerator, denominator}: {numerator: BN, denominator: BN}) => {
                if (isBaseGreaterThanQuote){
                    return quoteListedToken.formatAmount(baseListedToken.getPiecesPerToken().mul(denominator).div(numerator))
                }
                return quoteListedToken.formatAmount(baseListedToken.getPiecesPerToken().mul(numerator).div(denominator))
            },
            quote: (isBaseGreaterThanQuote: boolean, {numerator, denominator}: {numerator: BN, denominator: BN}) => {
                if (isBaseGreaterThanQuote){
                    return baseListedToken.formatAmount(quoteListedToken.getPiecesPerToken().mul(numerator).div(denominator))
                }
                return baseListedToken.formatAmount(quoteListedToken.getPiecesPerToken().mul(denominator).div(numerator))
            }
        }
    }, [liquidityPoolTradeInfo, baseListedToken, quoteListedToken]);

    const exchangeRate = useMemo(() => {
        const rate = liquidityPoolTradeInfo.getExchangeRate();
        const isBaseGreaterThanQuote = liquidityPoolTradeInfo.getIsBaseGreaterThanQuote();
        if (isBaseToQuote){
            return exchangeRateCallback.base(isBaseGreaterThanQuote, rate)
        }
        return exchangeRateCallback.quote(isBaseGreaterThanQuote, rate)
    }, [liquidityPoolTradeInfo, isBaseToQuote])

    const [slippage, setSlippage] = useState<number>(0.5);

    useEffect(() => {
        if (fromString.length > 0){
            const fromAmount = fromToken.parseAmount(fromString);
            setFromBN(fromAmount)
            const {estimatedAmount: toAmount, estimatedFee: toFee} = liquidityPoolTradeInfo.calculateSwapAndFeeAmount(isBaseToQuote, fromAmount, liquidityPool.getCreatorSwapFee(), liquidityPool.getPlatformSwapFee())
            setToBN(toAmount)
            setToFeeBN(toFee)
            const allowedSlippageAmount = toAmount.mul(new BN(slippage / 100 * 1_000_000_000)).div(new BN(1_000_000_000));
            setAllowedSlippage(allowedSlippageAmount)
            setToString(toToken.formatAmount(toAmount.add(toFee)).toString())

/*            console.debug("=== SWAP DEBUG INFO ===");
            console.debug("Swap Direction:", isBaseToQuote ? "Base to Quote" : "Quote to Base");
            console.debug("From Token:", {
                symbol: fromToken.getSymbol(),
                liquidity: isBaseToQuote ? liquidityPoolTradeInfo.getBaseLiquidity().toNumber() : liquidityPoolTradeInfo.getQuoteLiquidity().toNumber(),
                balance: isBaseToQuote ? providerBaseBalance.toNumber() : providerQuoteBalance.toNumber(),
            });
            console.debug("To Token:", {
                symbol: toToken.getSymbol(),
                liquidity: isBaseToQuote ? liquidityPoolTradeInfo.getQuoteLiquidity().toNumber() : liquidityPoolTradeInfo.getBaseLiquidity().toNumber(),
                balance: isBaseToQuote ? providerQuoteBalance.toNumber() : providerBaseBalance.toNumber(),
            });
            console.debug("From Amount:", fromAmount.toNumber());
            console.debug("To Amount (Estimated):", toAmount.toNumber());
            console.debug("Fee (Estimated):", toFee.toNumber());
            console.debug(`Exchange Rate: ${exchangeRate}`,);
            console.debug("Slippage:", `${slippage}%`);
            console.debug("Allowed Slippage:", allowedSlippageAmount.toNumber());
            console.debug("=======================");*/
        }
        else{
            setFromBN(new BN(0))
            setToBN(new BN(0))
            setToFeeBN(new BN(0))
            setToString("0")
        }
    }, [fromString, liquidityPoolTradeInfo]);

    useEffect(() => {
        setAllowedSlippage(toBN.mul(new BN(slippage)).div(new BN(100)))
    }, [slippage]);
    const handleReverseClick = () => {
        setIsBaseToQuote(!isBaseToQuote);
        setFromToken(toToken);
        setToToken(fromToken)
        setFromString(toString);
    };


    return (
        <div>
            <div className={styles.field}>
                <div className={styles.baseContainer}>
                    <label>Sell</label>
                    <div className={styles.percentageButtons}>
                        {[25, 50, 75, 100].map((percentage) => (
                            <button
                                key={percentage}
                                onClick={() =>
                                    handlePercentageAmountClick(
                                        fromToken.formatAmount(isBaseToQuote ? providerBaseBalance : providerQuoteBalance),
                                        percentage,
                                        setFromString
                                    )
                                }
                            >
                                {percentage}%
                            </button>
                        ))}
                    </div>
                </div>
                <div className={styles.inputContainer}>
                    <div className={styles.tokenSymbol}>
                        {fromToken.getSymbol()}
                    </div>
                    <input
                        type="text"
                        value={fromString}
                        onChange={(e) => handleTokenInputChange(e, setFromString)}
                        placeholder="Enter swap amount"
                    />
                </div>
                <div className={styles.balance}>
                    <span>Your balance: {fromToken.formatAmount(isBaseToQuote ? providerBaseBalance : providerQuoteBalance)}</span>
                    <span>Pool balance: {fromToken.formatAmount(isBaseToQuote ? liquidityPoolTradeInfo.getBaseLiquidity() : liquidityPoolTradeInfo.getQuoteLiquidity())}</span>
                </div>
                <hr className={styles.divider}/>
                <div className={styles.detailsContainer}>
                    <div className={styles.detail}>
                        <span>Minimal Amount </span>
                        <span>{fromToken.formatAmount(isBaseToQuote ? liquidityPoolTradeInfo.getMinimalBaseSwap() : liquidityPoolTradeInfo.getMinimalQuoteSwap())} {fromToken.getSymbol()}</span>
                    </div>
                </div>
            </div>
            <div className={styles.reverseButtonContainer}>
                <ReverseButton handleReverseClick={handleReverseClick}/>
            </div>
            <div className={styles.field}>
                <label>Buy</label>
                <div className={styles.inputContainer}>
                    <span className={styles.tokenSymbol}>{toToken.getSymbol()}</span>
                    <input type="text" value={toString} readOnly/>
                </div>
                <div className={styles.balance}>
                    <span>Your balance: {toToken.formatAmount(isBaseToQuote ? providerQuoteBalance : providerBaseBalance)}</span>
                    <span>Pool balance: {toToken.formatAmount(isBaseToQuote ? liquidityPoolTradeInfo.getQuoteLiquidity() : liquidityPoolTradeInfo.getBaseLiquidity())}</span>
                </div>
                <hr className={styles.divider}/>
                <div className={styles.detailsContainer}>
                    <div className={styles.detail}>
                        <span>Fee </span>
                        <span>{toToken.formatAmount(toFeeBN)} {toToken.getSymbol()}</span>
                    </div>
                </div>
            </div>

            <div className={styles.utils}>
                <div className={styles.utilsText}>
                    <strong>Approximate rate: 1 {fromToken.getSymbol()} = {exchangeRate} {toToken.getSymbol()}</strong>
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

                <div className={stylesSwap.slippageContainer}>
                    <label>Slippage</label>
                    <input
                        type="range"
                        min="0.1"
                        max="99.9"
                        step="0.1"
                        value={slippage}
                        onChange={(e) => setSlippage(parseFloat(e.target.value))}
                    />
                    <input
                        type="number"
                        min="0.1"
                        max="99.9"
                        step="0.1"
                        value={slippage}
                        onChange={(e) => setSlippage(parseFloat(e.target.value))}
                    />
                </div>
                <div className={styles.bottomContainer}>
                    <div className={styles.buttonContainer}>
                        {provider ? (
                            <SwapButton
                                liquidityPool={liquidityPool}
                                balance={isBaseToQuote ? providerBaseBalance : providerQuoteBalance}
                                minimalSwap={isBaseToQuote ? liquidityPoolTradeInfo.getMinimalBaseSwap() : liquidityPoolTradeInfo.getMinimalQuoteSwap()}
                                amount={fromBN}
                                estimatedAmount={toBN}
                                allowedSlippageAmount={allowedSlippage}
                                isBaseToQuote={isBaseToQuote}
                                handleManualRefetch={handleManualRefetch}>

                            </SwapButton>
                        ) : (
                            <button className={styles.actionButton} onClick={walletButtonClick}>Swap</button>
                        )}
                    </div>
                </div>
            </div>
            );
            }