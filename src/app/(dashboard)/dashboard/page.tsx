import DashboardCarousel from "./_components/DashboardCarousel/DashboardCarousel";
import styles from "./page.module.css";

export default function DashboardPage() {
    return (
        <div className={styles.pageContainer}>
            <DashboardCarousel />
        </div>
    );
}