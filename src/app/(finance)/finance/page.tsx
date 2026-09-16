import FinanceTableCard from "./components/FinanceTableCard/FinanceTableCard";
import styles from "./page.module.css";

const FinancePage = () => {
    return (
        <div className={styles.pageContainer}>
            <FinanceTableCard />
        </div>
    );
};

export default FinancePage;