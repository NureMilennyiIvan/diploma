import { LaunchpoolRow } from "@/models/launchpool-row";
import styles from "./style.module.css";
import { useRouter } from "next/navigation";
import { links } from "@/components/ui/general-page-layout";
import { shortenAddress } from "@/helpers";

interface ActiveLaunchpoolsListProps {
    launchpoolRows: LaunchpoolRow[];
}

export const ActiveLaunchpoolList: React.FC<ActiveLaunchpoolsListProps> = ({ launchpoolRows }) => {
    const router = useRouter();

    const copyToClipboard = async (address: string) => {
        await navigator.clipboard.writeText(address);
    };

    return (
        <div>
            {launchpoolRows.length === 0 ? (
                <div className={styles.message}>No launchpools available.</div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>Launchpool</th>
                            <th>Reward Mint</th>
                            <th>Stakable Mint</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                        </tr>
                        </thead>
                        <tbody>
                        {launchpoolRows.map((pool) => {
                            const key = pool.getKey().toBase58();
                            const rewardMint = pool.getRewardMint().toBase58();
                            const stakableMint = pool.getStakableMint().toBase58();
                            const startTime = new Date(pool.getStartTimestamp()).toLocaleString();
                            const endTime = new Date(pool.getEndTimestamp()).toLocaleString();

                            return (
                                <tr
                                    key={key}
                                    className={styles.tableRow}
                                    onClick={() => router.push(`${links.launchpools.path}${key}`)}
                                >
                                    <td>{shortenAddress(key)}</td>
                                    <td
                                        title={rewardMint}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(rewardMint);
                                        }}
                                        className={styles.clickable}
                                    >
                                        {shortenAddress(rewardMint)}
                                    </td>
                                    <td
                                        title={stakableMint}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(stakableMint);
                                        }}
                                        className={styles.clickable}
                                    >
                                        {shortenAddress(stakableMint)}
                                    </td>
                                    <td>{startTime}</td>
                                    <td>{endTime}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};