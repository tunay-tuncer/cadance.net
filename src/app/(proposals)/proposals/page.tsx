import React, { Suspense } from "react";
import type { Metadata } from "next";
import InvoiceBuilder from "./components/InvoiceBuilder/InvoiceBuilder";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Proposals | Cadance",
    description: "Cadance Dashboard Canlı Teklif & Fatura Düzenleyici",
};

export default function InvoicePage() {
    return (
        <div className={styles.pageContainer}>
            <Suspense fallback={<div className={styles.loading}>Loading proposals...</div>}>
                <InvoiceBuilder />
            </Suspense>
        </div>
    );
}