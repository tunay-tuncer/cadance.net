import type { Metadata } from "next";
import InvoiceCalculatorCard from "./components/InvoiceCalculatorCard";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Invoice Calculator | Cadance",
    description: "Proje bazlı iş kalemleri, maliyet ve faturalandırma hesaplayıcı",
};

export default function InvoiceCalculatorPage() {
    return (
        <div className={styles.pageContainer}>
            <InvoiceCalculatorCard />
        </div>
    );
}
