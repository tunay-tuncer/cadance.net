import Navbar from "@/components/layout/Navbar/Navbar";
import Currency from "@/components/layout/Navbar/Currency";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import styles from "./layout.module.css";

const MailLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <ProtectedRoute>
            <div className={styles.wrapper}>
                <Navbar currencySlot={<Currency />} />
                <main className={styles.mainContent}>{children}</main>
            </div>
        </ProtectedRoute>
    );
};

export default MailLayout;
