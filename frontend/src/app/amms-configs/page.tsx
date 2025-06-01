"use client"
import {usePublicKey} from "@/components/solana/solana-context-wrapper";
import {useLiquidityPoolService} from "@/components/backend/liquidity-pool-context-wrapper";
import Loader from "@/components/ui/loader";
import LoadingError from "@/components/ui/error";
import {useEffect, useMemo} from "react";
import styles from "./style.module.css";
import {useRouter} from "next/navigation";
import {AmmsConfigsList} from "@/app/amms-configs/amms-configs-list";
import {links} from "@/components/ui/general-page-layout";

const Page = ()=> {
    const userPublicKey = usePublicKey();
    const liquidityPoolService = useLiquidityPoolService();
    const router = useRouter();

    const {data: ammsConfigsManager, isLoading: isAmmsConfigsManager, error: errorAmmsConfigsManager} = liquidityPoolService.fetchAmmsConfigsManager();
    const {data: ammsConfigs, isLoading: isAmmsConfigs, error: errorAmmsConfigs} = liquidityPoolService.fetchAmmsConfigs();
    const [showAmmsConfigButton, showUpdateAuthorityButton] = useMemo(() => {
        if (!userPublicKey || !ammsConfigsManager) return [false, false];
        const user = userPublicKey.toBase58();
        const showUpdateAuthorityButton = ammsConfigsManager.headAuthority.toBase58() === user
        return [
            ammsConfigsManager.authority.toBase58() === user || showUpdateAuthorityButton,
            showUpdateAuthorityButton
        ];
    }, [userPublicKey, ammsConfigsManager]);

    useEffect(() => {
        if (!showAmmsConfigButton && !isAmmsConfigsManager) {
            router.push("/");
        }
    }, [showAmmsConfigButton, isAmmsConfigsManager]);

    if (errorAmmsConfigsManager) return <LoadingError error={errorAmmsConfigsManager} />;
    if (errorAmmsConfigs) return <LoadingError error={errorAmmsConfigs} />;
    if (isAmmsConfigsManager || isAmmsConfigs || !ammsConfigsManager || !ammsConfigs) return <Loader />;

    return (
        <div className={styles.pageContainer}>
            <section className={styles.managerBlock}>
                <h2>Amms Configurations Manager</h2>
                <div className={styles.managerField}>
                    <p><strong>Head Authority:</strong> {ammsConfigsManager.headAuthority.toBase58()}</p>
                    {showUpdateAuthorityButton && (
                        <button className={styles.updateButton} onClick={() => router.push(`${links.ammsConfigs.path}/update-head-authority`)}>Update</button>
                    )}
                </div>
                <div className={styles.managerField}>
                    <p><strong>Authority:</strong> {ammsConfigsManager.authority.toBase58()}</p>
                    {showUpdateAuthorityButton && (
                        <button className={styles.updateButton} onClick={() => router.push(`${links.ammsConfigs.path}/update-authority`)}>Update</button>
                    )}
                </div>
            </section>

            <section className={styles.configsSection}>
                <h2>Amms Configs</h2>
                <AmmsConfigsList ammsConfigs={ammsConfigs} />
                {showAmmsConfigButton && (
                    <button className={styles.addButton} onClick={() => router.push(`${links.ammsConfigs.path}/add`)}>Add</button>
                )}
            </section>
        </div>
    );
}
export default Page;