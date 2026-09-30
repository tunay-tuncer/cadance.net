import React, { Suspense } from "react";
import type { Metadata } from "next";
import MailBuilder from "./components/MailBuilder/MailBuilder";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "E-Posta Şablonları & Gönderim | Cadance Studio",
    description: "Cadance Studio ve Cadance Flow için duyarlı, dinamik e-posta şablon oluşturucu ve önizleme stüdyosu",
};

export default function MailPage() {
    return (
        <div className={styles.pageContainer}>
            <Suspense fallback={<div className={styles.loading}>E-Posta stüdyosu yükleniyor...</div>}>
                <MailBuilder />
            </Suspense>
        </div>
    );
}
