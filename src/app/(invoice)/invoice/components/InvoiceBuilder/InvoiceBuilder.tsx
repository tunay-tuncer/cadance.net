"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import InvoiceForm from "../InvoiceForm/InvoiceForm";
import { InvoiceData, InvoiceItem, initialInvoiceData } from "../../types/invoice";
import viewerStyles from "../invoicePDF/InvoiceViewer.module.css";
import styles from "./InvoiceBuilder.module.css";

// Dynamically import the PDF viewer with ssr: false
const InvoiceViewer = dynamic(() => import("../invoicePDF/InvoiceViewer"), {
    ssr: false,
    loading: () => (
        <div className={viewerStyles.loadingWrapper}>
            <div className={viewerStyles.spinner} />
            <p className={viewerStyles.loadingText}>PDF önizleme motoru hazırlanıyor...</p>
        </div>
    ),
});

export default function InvoiceBuilder() {
    const [invoiceData, setInvoiceData] = useState<InvoiceData>(initialInvoiceData);
    const [debouncedData, setDebouncedData] = useState<InvoiceData>(initialInvoiceData);

    // Debounce PDF re-render to ensure silky smooth input typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedData(invoiceData);
        }, 250);

        return () => clearTimeout(timer);
    }, [invoiceData]);

    const handleFieldChange = <K extends keyof InvoiceData>(
        field: K,
        value: InvoiceData[K]
    ) => {
        setInvoiceData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddItem = () => {
        setInvoiceData((prev) => {
            const nextIndex = prev.items.length + 1;
            const newItem: InvoiceItem = {
                id: Date.now().toString(),
                itemNumber: String(nextIndex).padStart(2, "0"),
                title: "",
                description: "",
                price: "",
            };
            return {
                ...prev,
                items: [...prev.items, newItem],
            };
        });
    };

    const handleDeleteItem = (id: string) => {
        setInvoiceData((prev) => ({
            ...prev,
            items: prev.items.filter((item) => item.id !== id),
        }));
    };

    const handleItemChange = (
        id: string,
        field: keyof InvoiceItem,
        value: string
    ) => {
        setInvoiceData((prev) => ({
            ...prev,
            items: prev.items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            ),
        }));
    };

    return (
        <div className={styles.invoiceContainer}>
            {/* Component 1: Form Inputs */}
            <InvoiceForm
                data={invoiceData}
                onChange={handleFieldChange}
                onAddItem={handleAddItem}
                onDeleteItem={handleDeleteItem}
                onItemChange={handleItemChange}
            />

            {/* Component 2: Rendered PDF Viewer receiving input values */}
            <InvoiceViewer data={debouncedData} />
        </div>
    );
}
