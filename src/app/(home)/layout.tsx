import Navbar from "@/components/layout/Navbar/Navbar";
import BackgroundAnimation from "@/components/BackgroundAnimation/BackgroundAnimation";
import styles from "./layout.module.css";

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className={styles.wrapper}>
            <Navbar />
            <main className={styles.mainContent}>{children}</main>
            <BackgroundAnimation />
        </div>
    )
}

export default layout