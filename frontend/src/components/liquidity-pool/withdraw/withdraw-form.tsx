"use client"

import {LiquidityPool} from "@/blockchain/accounts-models/liquidity-pool";
import {BN} from "@coral-xyz/anchor";
import {DexProject} from "../../../../anchor/src";
import {useAnchorProviderContext} from "@/components/solana/anchor-context-wrapper";
import {ListedToken} from "@/blockchain/accounts-models/listed-token";
import React, {useEffect, useMemo, useState} from "react";
import {LiquidityPoolTradeInfo} from "@/blockchain/accounts-models/liquidity-pool-trade-info";
import {divmodToNumber, handlePercentageAmountClick, handleTokenInputChange, parseStringToBN} from "@/components/utils";
import {DexConstants} from "@/blockchain/utils/dex-constants";
import styles from "@/components/liquidity-pool/liquidity-pool-page.module.css";
import {SyncButton} from "@/components/liquidity-pool/form-parts";
import {useWalletButton} from "@/components/solana/wallet-button-provider";
import {WithdrawButton} from "@/components/liquidity-pool/withdraw/withdraw-button";
import {CollectFeesButton} from "@/components/liquidity-pool/collect-fees/collect-fees-button";

export const WithdrawForm = ({liquidityPool, liquidityPoolTradeInfo, baseListedToken, quoteListedToken, providerLpBalance, handleManualRefetch}: {
    liquidityPool: LiquidityPool, liquidityPoolTradeInfo: LiquidityPoolTradeInfo, baseListedToken: ListedToken, quoteListedToken: ListedToken, providerLpBalance: BN, handleManualRefetch: () => Promise<void>}) => {

    const {provider} = useAnchorProviderContext<DexProject>();
    const walletButtonClick = useWalletButton();

    const [burnLpString, setBurnLpString] = useState<string>("");
    const [burnLpBN, setBurnLpBN] = useState<BN>(new BN(0));

    const [baseReturnString, setBaseReturnString] = useState<string>("0");
    const [quoteReturnString, setQuoteReturnString] = useState<string>("0");
    const share = useMemo(() =>liquidityPoolTradeInfo.calculateShareFromLpTokens(providerLpBalance) * 100, [liquidityPoolTradeInfo, providerLpBalance]);

    useEffect(() => {
        if (burnLpString.length > 0){
            const lpAmount = parseStringToBN(burnLpString, DexConstants.LP_PIECES_PER_TOKEN, DexConstants.LP_DECIMALS);
            setBurnLpBN(lpAmount)
            const {baseReturn, quoteReturn} = liquidityPoolTradeInfo.calculateReturnAmount(lpAmount);

            setBaseReturnString(baseListedToken.formatAmount(baseReturn).toString());
            setQuoteReturnString(quoteListedToken.formatAmount(quoteReturn).toString());
        }
        else{
            setBurnLpBN(new BN(0))
            setBaseReturnString("0");
            setQuoteReturnString("0");
        }
    }, [burnLpString, liquidityPoolTradeInfo]);

    return (
        <div style={{display: "flex", flexDirection: "column", height: "500px"}}>
            <div className={styles.field}>
                <div className={styles.baseContainer}>
                    <label>Base</label>
                    <div className={styles.percentageButtons}>
                        {[25, 50, 75, 100].map((percentage) => (
                            <button key={percentage} onClick={() => handlePercentageAmountClick(
                                divmodToNumber(providerLpBalance, DexConstants.LP_PIECES_PER_TOKEN),
                                percentage,
                                setBurnLpString
                            )}>
                                {percentage}%
                            </button>
                        ))}
                    </div>
                </div>
                <div className={styles.inputContainer}>
                    <div className={styles.tokenSymbol}>
                        {`${baseListedToken.getSymbol()}-${quoteListedToken.getSymbol()} LP`}
                    </div>
                    <input
                        type="text"
                        value={burnLpString}
                        onChange={(e) => handleTokenInputChange(e, setBurnLpString)}
                        placeholder={"Enter burning amount"}
                    />
                </div>

                <div className={styles.balance}>
                    <span>Your balance: {divmodToNumber(providerLpBalance, DexConstants.LP_PIECES_PER_TOKEN)}</span>
                    <span>Pool amount: {divmodToNumber(liquidityPoolTradeInfo.getLpTokensSupply(), DexConstants.LP_PIECES_PER_TOKEN)}</span>
                </div>
                <hr className={styles.divider}/>
                <div className={styles.detailsContainer}>
                    <div className={styles.detail}>
                        <span>Your share</span>
                        <span>{share}%</span>
                    </div>
                </div>
            </div>
            <div className={styles.bottomContainer}>
                <div className={styles.utils}>
                    <div className={styles.utilsText}>
                        <strong>{baseListedToken.getSymbol()} to receive: {baseReturnString}</strong>
                        <strong>{quoteListedToken.getSymbol()} to receive: {quoteReturnString}</strong>
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
                        <WithdrawButton
                            liquidityPool={liquidityPool}
                            lpTokensToBurn={burnLpBN}
                            lpTokensBalance={providerLpBalance}
                            handleManualRefetch={handleManualRefetch}
                        />
                    ) : (
                        <button className={styles.actionButton} onClick={walletButtonClick}>Withdraw Liquidity</button>
                    )
                    }
                </div>
            </div>
        </div>
    );
}