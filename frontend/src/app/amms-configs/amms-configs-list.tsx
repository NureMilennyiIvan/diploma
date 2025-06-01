"use client"
import {AmmsConfig} from "@/models/amms-config";
import styles from "./style.module.css";
import Link from "next/link";
import {shortenAddress} from "@/helpers";
import {links} from "@/components/ui/general-page-layout";
import {useRouter} from "next/navigation";

interface AmmsConfigsListProps {
    ammsConfigs: AmmsConfig[];
}

export const AmmsConfigsList: React.FC<AmmsConfigsListProps> = ({ammsConfigs}) => {
    const router = useRouter();

    if (ammsConfigs.length === 0) {
        return <div className={styles.message}>No configs available.</div>;
    }
    return (
        <div className={styles.listContainer}>
            {ammsConfigs.map((config) => {
                const key = config.key.toBase58();
                return (
                    <div className={styles.card} key={key}
                         onClick={() => router.push(`${links.ammsConfigs.path}/${key}`)}>
                        <p><strong>Fee Authority:</strong> {shortenAddress(config.feeAuthority.toBase58())}</p>
                        <p><strong>Provider Fee:</strong> {config.protocolFeeRate}%</p>
                        <p><strong>Protocol Fee:</strong> {config.protocolFeeRate}%</p>
                    </div>
                );
            })}
        </div>
    );
};
