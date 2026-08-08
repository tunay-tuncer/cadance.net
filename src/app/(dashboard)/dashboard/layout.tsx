import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Navbar from '@/components/layout/Navbar/Navbar';
import styles from "./layout.module.css";
import Currency from '@/components/layout/Navbar/Currency';
import { ProjectProvider } from '@/context/ProjectContext';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <ProjectProvider>
            <ProtectedRoute>
                <div className={styles.wrapper}>
                    <Navbar currencySlot={<Currency />} />
                    <main className={styles.mainContent}>{children}</main>
                </div>
            </ProtectedRoute>
        </ProjectProvider>
    );
}