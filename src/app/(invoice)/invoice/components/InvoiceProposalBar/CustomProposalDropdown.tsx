"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";
import { TbFileInvoice, TbTrash, TbPlus, TbCheck } from "react-icons/tb";
import { ProjectInvoiceRecord } from "@/lib/fireabase/projectInvoiceService";
import styles from "./InvoiceProposalBar.module.css";

interface CustomProposalDropdownProps {
    invoices: ProjectInvoiceRecord[];
    selectedInvoiceId: string | null;
    activeProposalName: string;
    onSelect: (invoice: ProjectInvoiceRecord) => void;
    onNewBlank: () => void;
    onDelete: (invoiceId: string, invoiceName: string, e: React.MouseEvent) => void;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
}

export default function CustomProposalDropdown({
    invoices,
    selectedInvoiceId,
    activeProposalName,
    onSelect,
    onNewBlank,
    onDelete,
    disabled = false,
    loading = false,
    className = "",
}: CustomProposalDropdownProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [openUpwards, setOpenUpwards] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

    // Close on click outside or Escape
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const handleToggle = () => {
        if (disabled || loading) return;
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setOpenUpwards(spaceBelow < 320 && rect.top > 320);
        }
        setIsOpen((prev) => !prev);
    };

    const handleSelect = (invoice: ProjectInvoiceRecord) => {
        onSelect(invoice);
        setIsOpen(false);
    };

    const handleNewBlankClick = () => {
        onNewBlank();
        setIsOpen(false);
    };

    const displayLabel = selectedInvoice
        ? selectedInvoice.name
        : activeProposalName
        ? activeProposalName
        : invoices.length > 0
        ? "Teklif Seçiniz..."
        : "Yeni Teklif (Kayıtsız)";

    return (
        <div className={`${styles.dropdownContainer} ${className}`} ref={containerRef}>
            {/* TRIGGER BUTTON */}
            <button
                type="button"
                className={`${styles.dropdownTrigger} ${isOpen ? styles.dropdownTriggerActive : ""}`}
                onClick={handleToggle}
                disabled={disabled || loading}
                aria-label="Kayıtlı teklifleri seç"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className={styles.triggerLeft}>
                    <TbFileInvoice className={styles.proposalTriggerIcon} />
                    <div className={styles.triggerTextGroup}>
                        <span className={styles.triggerSubtext}>Kayıtlı Teklif:</span>
                        <span className={styles.triggerMainText}>
                            {loading ? "Yükleniyor..." : displayLabel}
                        </span>
                    </div>
                    {invoices.length > 0 && (
                        <span className={styles.proposalCountBadge}>
                            {invoices.length} Versiyon
                        </span>
                    )}
                </div>
                <FaChevronDown className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ""}`} />
            </button>

            {/* FLOATING LISTBOX CONTAINER */}
            {isOpen && (
                <div
                    className={`${styles.proposalsMenu} ${openUpwards ? styles.dropdownUpwards : ""}`}
                    role="listbox"
                    aria-label="Kayıtlı Teklifler"
                >
                    {/* MENU HEADER */}
                    <div className={styles.menuHeader}>
                        <div className={styles.menuHeaderLeft}>
                            <span className={styles.menuHeaderTitle}>Proje Teklifleri</span>
                            <span className={styles.menuHeaderCount}>{invoices.length} Kayıtlı</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleNewBlankClick}
                            className={styles.menuNewBlankBtn}
                            title="Yeni boş teklif hazırla"
                        >
                            <TbPlus size={13} />
                            <span>Yeni Boş</span>
                        </button>
                    </div>

                    {/* PROPOSALS LIST */}
                    <div className={styles.proposalsList}>
                        {invoices.length === 0 ? (
                            <div className={styles.emptyNotice}>
                                <TbFileInvoice size={24} className={styles.emptyNoticeIcon} />
                                <p className={styles.emptyNoticeTitle}>Henüz Kayıtlı Teklif Yok</p>
                                <p className={styles.emptyNoticeDesc}>
                                    Bu proje için hazırladığınız teklife bir isim verip "Kaydet" butonuna basarak ilk teklifinizi oluşturabilirsiniz.
                                </p>
                            </div>
                        ) : (
                            invoices.map((inv) => {
                                const isSelected = inv.id === selectedInvoiceId;
                                return (
                                    <div
                                        key={inv.id}
                                        className={`${styles.proposalCardItem} ${
                                            isSelected ? styles.proposalCardSelected : ""
                                        }`}
                                        onClick={() => handleSelect(inv)}
                                    >
                                        <div className={styles.proposalCardMain}>
                                            <div className={styles.proposalCardHeader}>
                                                <span className={styles.proposalCardName}>
                                                    {inv.name}
                                                </span>
                                                {isSelected && (
                                                    <span className={styles.activeTag}>
                                                        <TbCheck size={12} />
                                                        Aktif
                                                    </span>
                                                )}
                                            </div>

                                            <div className={styles.proposalCardMeta}>
                                                <span className={styles.proposalNumber}>
                                                    {inv.invoiceNumber || "No Belirtilmedi"}
                                                </span>
                                                <span className={styles.metaDot}>•</span>
                                                <span className={styles.proposalDate}>
                                                    {inv.data?.issueDate || "Tarih Yok"}
                                                </span>
                                                <span className={styles.metaDot}>•</span>
                                                <span className={styles.proposalItemsCount}>
                                                    {inv.itemCount || (inv.data?.items?.length || 0)} Kalem
                                                </span>
                                            </div>

                                            <div className={styles.proposalCardFooter}>
                                                <span className={styles.proposalTotalAmount}>
                                                    ₺{inv.totalAmount || "0,00"}
                                                </span>
                                                {inv.isBilled ? (
                                                    <span className={styles.billedPill}>+KDV</span>
                                                ) : (
                                                    <span className={styles.unbilledPill}>Faturasız</span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => onDelete(inv.id, inv.name, e)}
                                            className={styles.deleteProposalBtn}
                                            title="Bu teklifi sil"
                                            aria-label={`${inv.name} teklifini sil`}
                                        >
                                            <TbTrash size={15} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
