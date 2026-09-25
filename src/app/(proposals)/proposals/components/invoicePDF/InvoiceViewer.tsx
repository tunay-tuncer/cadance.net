"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { TbFileTypePdf } from "react-icons/tb";
import { MyDocument } from "./invoicePDF";
import { InvoiceData } from "../../types/invoice";
import styles from "./InvoiceViewer.module.css";

interface InvoiceViewerProps {
    data: InvoiceData;
}

export default function InvoiceViewer({ data }: InvoiceViewerProps) {
    return (
        <div className={styles.viewerCard}>
            <div className={styles.headerArea}>
                <div className={styles.titleWrapper}>
                    <TbFileTypePdf className={styles.headerIcon} />
                    <h2 className={styles.sectionTitle}>PDF Önizleme</h2>
                </div>
                <span className={styles.badge}>A4 Formatı</span>
            </div>

            <div className={styles.viewerBody}>
                <PDFViewer className={styles.pdfViewer} showToolbar={true}>
                    <MyDocument data={data} />
                </PDFViewer>
            </div>
        </div>
    );
}
