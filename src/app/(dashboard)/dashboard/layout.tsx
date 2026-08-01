// src/app/dashboard/layout.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <ProtectedRoute>
            <div className="dashboard-wrapper">
                <main>{children}</main>
            </div>
        </ProtectedRoute>
    );
}