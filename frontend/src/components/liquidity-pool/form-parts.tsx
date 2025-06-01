import styles from "@/components/liquidity-pool/liquidity-pool-page.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowDownUpAcrossLine, faSyncAlt} from "@fortawesome/free-solid-svg-icons";
import React from "react";

export const SyncButton = ({handleManualRefetch}: {handleManualRefetch: () => Promise<void>}) => {
    return (
        <button onClick={handleManualRefetch} className={styles.syncIcon}>
            <FontAwesomeIcon icon={faSyncAlt}/>
        </button>
    )
}
export const ReverseButton = ({handleReverseClick}: {handleReverseClick : () => void}) =>{
    return (<button onClick={handleReverseClick} className={styles.reverseButton}>
        <FontAwesomeIcon icon={faArrowDownUpAcrossLine} className={styles.reverseIcon}/>
    </button>)
}