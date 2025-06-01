import { CpAmmRow } from "@/models/cp-amm-row";
import styles from "./style.module.css";
import { useRouter } from "next/navigation";
import { links } from "@/components/ui/general-page-layout";
import { shortenAddress } from "@/helpers";

interface CpAmmsListProps {
    cpAmmRows: CpAmmRow[];
}

export const CpAmmsList: React.FC<CpAmmsListProps> = ({ cpAmmRows }) => {
    const router = useRouter();

    const copyToClipboard = async (address: string) => {
        await navigator.clipboard.writeText(address);
    };

    return (
        <div>
            {cpAmmRows.length === 0 ? (
                <div className={styles.message}>No liquidity pools available.</div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>Pool</th>
                            <th>Base Mint</th>
                            <th>Quote Mint</th>
                            <th>Base Liquidity</th>
                            <th>Quote Liquidity</th>
                            <th>Swap Fee</th>
                        </tr>
                        </thead>
                        <tbody>
                        {cpAmmRows.map((pool) => {
                            const poolKey = pool.getKey().toBase58();
                            const baseMint = pool.getBaseMint().toBase58();
                            const quoteMint = pool.getQuoteMint().toBase58();
                            return (
                                <tr
                                    key={poolKey}
                                    className={styles.tableRow}
                                    onClick={() => router.push(`${links.liquidityPools.path}${poolKey}`)}
                                >
                                    <td>{shortenAddress(poolKey)}</td>
                                    <td
                                        title={baseMint}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(baseMint);
                                        }}
                                        className={styles.clickable}
                                    >
                                        {shortenAddress(baseMint)}
                                    </td>
                                    <td
                                        title={quoteMint}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(quoteMint);
                                        }}
                                        className={styles.clickable}
                                    >
                                        {shortenAddress(quoteMint)}
                                    </td>
                                    <td>{pool.getBaseLiquidity()}</td>
                                    <td>{pool.getQuoteLiquidity()}</td>
                                    <td>{pool.getFee()}%</td>
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