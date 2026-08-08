import Navbar from "@/components/layout/Navbar/Navbar";
import Currency from "@/components/layout/Navbar/Currency";
import BackgroundAnimation from "@/components/BackgroundAnimation/BackgroundAnimation";
import styles from "./layout.module.css";

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className={styles.wrapper}>
            <Navbar currencySlot={<Currency />} />
            <main className={styles.mainContent}>{children}</main>
            <BackgroundAnimation />
        </div>
    )
}

export default layout