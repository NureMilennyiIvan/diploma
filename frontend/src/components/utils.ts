import React from "react";
import {BN} from "@coral-xyz/anchor";
import {PublicKey} from "@solana/web3.js";

export const handleTokenInputChange = (e: React.ChangeEvent<HTMLInputElement>, setTokenInput: React.Dispatch<React.SetStateAction<string>>) => {
    const newValue = e.target.value;
    const regex = /^(0|([1-9]\d*))(\.\d+)?$/;
    if ((regex.test(newValue) || newValue == "" || (newValue.endsWith('.') && newValue.length > 1)) && newValue.length < 15) {
        setTokenInput(newValue);
    }
};
export const handlePercentageAmountClick = (balance: number, percentage: number, setTokenInput: React.Dispatch<React.SetStateAction<string>>) => {
    const amount = balance * percentage / 100;
    setTokenInput(amount.toString());
};

export const validateAmount = (inputAmount: BN, balance: BN) => {
    if (inputAmount.lte(new BN(0))) {
        return { isValid: false, error: "Amount must be greater than 0." };
    }
    if (inputAmount.gt(balance)) {
        return { isValid: false, error: "Insufficient balance." };
    }
    return { isValid: true, error: "", inputAmount };
};

export const shortenPublicKey = (publicKey: PublicKey, visibleSymbolsFromEdges: number) => {
    return `${publicKey.toBase58().slice(0, visibleSymbolsFromEdges)}...${publicKey.toBase58().slice(-visibleSymbolsFromEdges)}`;
};

export const divmodToNumber = (dividend: BN, divisor: BN): number => {
    if (divisor.isZero()){
        return 0;
    }
    const roundingScale = new BN(1_000_000_000);
    const scaled = dividend.mul(roundingScale).div(divisor);
    if (scaled.gt(new BN(Number.MAX_SAFE_INTEGER))) {
        return parseFloat(scaled.toString()) / roundingScale.toNumber();
    }
    return scaled.toNumber() / roundingScale.toNumber();
}
export const convertNumberToBN = (number: number, decimals?: number): BN => {
    if (decimals && decimals > 0){
        const scale = 10 ** decimals;
        const integerPart = Math.floor(number);
        const fractionPart = number - integerPart;
        const integerBN = new BN(integerPart).muln(scale);
        return integerBN.addn(fractionPart * scale)
    }
    return new BN(number)
}

export const parseStringToBN = (str: string, scale: BN, decimals?: number): BN => {
    let amountString = str;
    const dotIndex = amountString.indexOf('.');
    if (dotIndex < 0 || !decimals) {
        const amount = parseInt(amountString);
        return isNaN(amount)
            ? new BN(0)
            : new BN(amount).mul(scale);
    }
    if (dotIndex === amountString.length - 1 || decimals === 0) {
        const integerPart = amountString.slice(0, dotIndex);
        const amount = parseInt(integerPart);

        return isNaN(amount)
            ? new BN(0)
            : new BN(amount).mul(scale);
    }

    if (dotIndex < amountString.length - 1 - decimals) {
        amountString = amountString.slice(0, dotIndex + 1 + decimals);
    }

    const amount = parseFloat(amountString);
    return isNaN(amount)
        ? new BN(0)
        : convertNumberToBN(amount, decimals);
}