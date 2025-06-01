"use client"
import { useLiquidityPoolService } from "@/components/backend/liquidity-pool-context-wrapper";
import { usePublicKey } from "@/components/solana/solana-context-wrapper";
import Loader from "@/components/ui/loader";
import {useEffect, useMemo, useState} from "react";
import {CpAmmsList} from "@/app/liquidity-pools/cp-amms-list";
import {CpAmmRow} from "@/models/cp-amm-row";
import {PublicKey} from "@solana/web3.js";
import styles from "./style.module.css";
import Link from "next/link";
import {links} from "@/components/ui/general-page-layout";
import LoadingError from "@/components/ui/error";

const Page = ()=> {
    const userPublicKey = usePublicKey();
    const liquidityPoolService = useLiquidityPoolService();

    const {data: ammsConfigsManager, isLoading: isAmmsConfigsManager, error: errorAmmsConfigsManager} = liquidityPoolService.fetchAmmsConfigsManager();
    const [baseMintToSearch, setBaseMintToSearch] = useState<PublicKey | undefined>(undefined);
    const [quoteMintToSearch, setQuoteMintToSearch] = useState<PublicKey | undefined>(undefined);
    const {data: cpAmmRows, isLoading: isCpAmmRows, error: errorCpAmmRows} = liquidityPoolService.fetchCpAmmRows(20, baseMintToSearch, quoteMintToSearch);
    const [cpAmmRowsRender, setCpAmmRowsRender] = useState<CpAmmRow[]>();
    const showAmmsConfigButton = useMemo(() => {
        if (!userPublicKey || !ammsConfigsManager) return false;
        const user = userPublicKey.toBase58();
        return ammsConfigsManager.authority.toBase58() === user || user === ammsConfigsManager.headAuthority.toBase58();
    }, [userPublicKey, ammsConfigsManager]);

    useEffect(() => {
        if (cpAmmRows && !isCpAmmRows) {
            setCpAmmRowsRender(cpAmmRows);
        }
    }, [cpAmmRows, isCpAmmRows]);

    if (!!errorAmmsConfigsManager) {
        return <LoadingError error={errorAmmsConfigsManager} />;
    }

    if (isAmmsConfigsManager || !cpAmmRowsRender) {
        return <Loader />;
    }

    if (!!errorCpAmmRows) {
        return <LoadingError error={errorCpAmmRows} />;
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1>Liquidity Pools</h1>
                {showAmmsConfigButton && (
                    <Link href={links.ammsConfigs.path}>
                        <button className={styles.createButton}>View Amms Configuration</button>
                    </Link>
                )}
{/*                {showUpdateAuthorityButton && (
                    <Link href={links.createLiquidityPool.path}>
                        <button className={styles.createButton}>Update Amms Authority</button>
                    </Link>
                )}*/}
{/*                <Link href={links.createLiquidityPool.path}>
                    <button className={styles.createButton}>Create Liquidity Pool</button>
                </Link>*/}
            </div>
            <CpAmmsList cpAmmRows={cpAmmRowsRender}></CpAmmsList>
        </div>
    );
};
export default Page;