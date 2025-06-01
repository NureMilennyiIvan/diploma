import styles from "@/app/launchpools/style.module.css";
import {CpAmmRow} from "@/models/cp-amm-row";

interface LoadingErrorProps {
    error: Error;
}

export const LoadingError: React.FC<LoadingErrorProps> = ({error}) => {
    return (
        <div>
            <div className={styles.error}>Error loading configuration. Please try again later. {error.message}</div>
        </div>
    );
};
export default LoadingError;