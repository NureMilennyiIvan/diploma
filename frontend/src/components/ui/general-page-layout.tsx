"use client";

import { ReactNode } from "react";
import Link from "next/link";
import {WalletButton} from "@/components/solana/solana-wallet-adapter-provider";
import styles from "./styles.module.css";
import colors from "../../app/colors.module.css";

export const links = {
    launchpools: {label: "Launchpools", path: "/launchpools"},
    liquidityPools: {label: "Liquidity Pools", path: "/liquidity-pools"},
    ammsConfigs: {label: "Amms Configs", path: "/amms-configs" },
    launchpoolsConfigs: {label: "Launchpools Configs", path: "/launchpools-configs"},
};

export const GeneralPageLayout = ({ children }: { children: ReactNode }) => {
    return (
        <div className={`${styles.container} ${colors.colors}`}>
            <header className={styles.header}>
                <div className={styles.left}>Vondex</div>
                <nav className={styles.center}>
                    <Link href={links.liquidityPools.path}>{links.liquidityPools.label}</Link>
                    <Link href={links.launchpools.path}>{links.launchpools.label}</Link>
                </nav>
                <div className={styles.walletButton}>
                    <WalletButton/>
                </div>
            </header>

            <main className={styles.main}>{children}</main>

            <footer className={styles.footer}>Vondex</footer>
        </div>
    );
};