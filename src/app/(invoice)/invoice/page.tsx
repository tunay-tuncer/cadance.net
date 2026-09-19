import type { Metadata } from "next";
import InvoiceBuilder from "./components/InvoiceBuilder/InvoiceBuilder";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Teklif & Fatura | Cadance",
    description: "Cadance Dashboard Canlı Teklif & Fatura Düzenleyici",
};

export default function InvoicePage() {
    return (
        <div className={styles.pageContainer}>
            <InvoiceBuilder />
        </div>
    );
}