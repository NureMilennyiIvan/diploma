"use client"
import { usePublicKey } from "@/components/solana/solana-context-wrapper";
import Loader from "@/components/ui/loader";
import {useEffect, useMemo, useState} from "react";
import {PublicKey} from "@solana/web3.js";
import styles from "./style.module.css";
import Link from "next/link";
import {links} from "@/components/ui/general-page-layout";
import {useLaunchpoolService} from "@/components/backend/launchpool-context-wrapper";
import {LaunchpoolRow} from "@/models/launchpool-row";
import {ActiveLaunchpoolList} from "@/app/launchpools/active-launchpools-list";
import LoadingError from "@/components/ui/error";

const Page = ()=> {
    const userPublicKey = usePublicKey();
    const launchpoolService = useLaunchpoolService();

    const {data: launchpoolsConfigsManager, isLoading: isLaunchpoolsConfigsManager, error: errorLaunchpoolsConfigsManager} = launchpoolService.fetchLaunchpoolsConfigsManager();
    const [rewardMintToSearch, setRewardMintToSearch] = useState<PublicKey | undefined>(undefined);
    const [stakableMintToSearch, setStakableMintToSearch] = useState<PublicKey | undefined>(undefined);
    const {data: launchpoolRows, isLoading: isLaunchpoolRows, error: errorsLaunchpoolRows} = launchpoolService.fetchActiveLaunchpoolRows(20, rewardMintToSearch, stakableMintToSearch);
    const [launchpoolRowsRender, setLaunchpoolRowsRender] = useState<LaunchpoolRow[]>();

    const showLaunchpoolsConfigButton = useMemo(() => {
        if (!userPublicKey || !launchpoolsConfigsManager) return false;
        const user = userPublicKey.toBase58();
        return launchpoolsConfigsManager.authority.toBase58() === user || user === launchpoolsConfigsManager.headAuthority.toBase58();
    }, [userPublicKey, launchpoolsConfigsManager]);
    useEffect(() => {
        if (launchpoolRows && !isLaunchpoolRows) {
            setLaunchpoolRowsRender(launchpoolRows);
        }
    }, [launchpoolRows, isLaunchpoolRows]);

    if (!!errorLaunchpoolsConfigsManager) {
        return <LoadingError error={errorLaunchpoolsConfigsManager} />;
    }

    if (isLaunchpoolsConfigsManager || !launchpoolRowsRender) {
        return <Loader />;
    }

    if (!!errorsLaunchpoolRows) {
        return <LoadingError error={errorsLaunchpoolRows} />;
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <h1>Launchpools</h1>
                {showLaunchpoolsConfigButton && (
                    <div>
                        <Link href={links.launchpoolsConfigs.path}>
                            <button className={styles.createButton}>View Launchpools Configuration</button>
                        </Link>
{/*                        <Link href={links.createLiquidityPool!.path}>
                            <button className={styles.createButton}>Initialize Launchpool</button>
                        </Link>*/}
                    </div>
                )}
{/*                {showUpdateAuthorityButton &&(
                    <Link href={links.createLiquidityPool!.path}>
                        <button className={styles.createButton}>Update Launchpools Authority</button>
                    </Link>
                )}*/}
            </div>
            <ActiveLaunchpoolList launchpoolRows={launchpoolRowsRender}></ActiveLaunchpoolList>
        </div>
    );
};
export default Page;