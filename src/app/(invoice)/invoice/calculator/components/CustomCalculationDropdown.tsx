"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";
import { TbCalculator, TbTrash, TbPlus, TbCheck } from "react-icons/tb";
import { ProjectCalculationRecord } from "@/lib/fireabase/projectCalculationService";
import styles from "./CalculatorCalculationBar.module.css";

interface CustomCalculationDropdownProps {
    calculations: ProjectCalculationRecord[];
    selectedCalculationId: string | null;
    activeCalculationName: string;
    onSelect: (calc: ProjectCalculationRecord) => void;
    onNewBlank: () => void;
    onDelete: (calcId: string, calcName: string, e: React.MouseEvent) => void;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
}

export default function CustomCalculationDropdown({
    calculations,
    selectedCalculationId,
    activeCalculationName,
    onSelect,
    onNewBlank,
    onDelete,
    disabled = false,
    loading = false,
    className = "",
}: CustomCalculationDropdownProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [openUpwards, setOpenUpwards] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedCalc = calculations.find((c) => c.id === selectedCalculationId);

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

    const handleSelect = (calc: ProjectCalculationRecord) => {
        onSelect(calc);
        setIsOpen(false);
    };

    const handleNewBlankClick = () => {
        onNewBlank();
        setIsOpen(false);
    };

    const displayLabel = selectedCalc
        ? selectedCalc.name
        : activeCalculationName
        ? activeCalculationName
        : "+ Yeni Hesap (Taslak)";

    const formatCurrency = (amount: number): string => {
        return `₺${Math.round(amount).toLocaleString("tr-TR")}`;
    };

    return (
        <div className={`${styles.dropdownContainer} ${className}`} ref={containerRef}>
            {/* TRIGGER BUTTON */}
            <button
                type="button"
                className={`${styles.dropdownTrigger} ${isOpen ? styles.dropdownTriggerActive : ""}`}
                onClick={handleToggle}
                disabled={disabled || loading}
                aria-label="Kayıtlı hesapları seç"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className={styles.triggerLeft}>
                    <TbCalculator className={styles.calcTriggerIcon} />
                    <div className={styles.triggerTextGroup}>
                        <span className={styles.triggerSubtext}>Kayıtlı Hesap:</span>
                        <span className={styles.triggerMainText}>
                            {loading ? "Yükleniyor..." : displayLabel}
                        </span>
                    </div>
                    {calculations.length > 0 && (
                        <span className={styles.calcCountBadge}>
                            {calculations.length} Hesap
                        </span>
                    )}
                </div>
                <FaChevronDown className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ""}`} />
            </button>

            {/* FLOATING LISTBOX CONTAINER */}
            {isOpen && (
                <div
                    className={`${styles.calcMenu} ${openUpwards ? styles.dropdownUpwards : ""}`}
                    role="listbox"
                    aria-label="Kayıtlı Hesaplar"
                >
                    {/* MENU HEADER */}
                    <div className={styles.menuHeader}>
                        <div className={styles.menuHeaderLeft}>
                            <span className={styles.menuHeaderTitle}>Proje Hesapları</span>
                            <span className={styles.menuHeaderCount}>{calculations.length} Kayıtlı</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleNewBlankClick}
                            className={styles.menuNewBlankBtn}
                            title="Yeni boş hesap başlat"
                        >
                            <TbPlus size={13} />
                            <span>Yeni Hesap</span>
                        </button>
                    </div>

                    {/* CALCULATION ITEMS LIST */}
                    <div className={styles.calcList}>
                        {calculations.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>Bu projeye ait kayıtlı hesap bulunmuyor.</p>
                                <button
                                    type="button"
                                    onClick={handleNewBlankClick}
                                    className={styles.emptyActionBtn}
                                >
                                    <TbPlus size={14} />
                                    İlk Hesabı Başlat
                                </button>
                            </div>
                        ) : (
                            calculations.map((calc) => {
                                const isSelected = calc.id === selectedCalculationId;
                                const dateStr = calc.updatedAt?.toDate
                                    ? calc.updatedAt.toDate().toLocaleDateString("tr-TR")
                                    : "";

                                return (
                                    <div
                                        key={calc.id}
                                        role="option"
                                        aria-selected={isSelected}
                                        className={`${styles.calcItem} ${isSelected ? styles.calcItemSelected : ""}`}
                                        onClick={() => handleSelect(calc)}
                                    >
                                        <div className={styles.calcItemContent}>
                                            <div className={styles.calcItemHeader}>
                                                <span className={styles.calcItemName}>{calc.name}</span>
                                                {dateStr && (
                                                    <span className={styles.calcItemDate}>{dateStr}</span>
                                                )}
                                            </div>

                                            <div className={styles.calcItemMeta}>
                                                <span className={styles.calcItemBadges}>
                                                    {calc.itemCount || calc.items?.length || 0} Kalem
                                                </span>
                                                <span className={styles.metaDot}>•</span>
                                                <span className={styles.calcItemCost}>
                                                    Maliyet: {formatCurrency(calc.totalRawCost)}
                                                </span>
                                                <span className={styles.metaDot}>•</span>
                                                <span className={styles.calcItemProfit}>
                                                    Hedef: +{formatCurrency(calc.targetProfit)}
                                                </span>
                                            </div>

                                            <div className={styles.calcItemFooter}>
                                                <span className={styles.calcItemTotalLabel}>
                                                    Teklif Tutarı:
                                                </span>
                                                <span className={styles.calcItemTotalValue}>
                                                    {formatCurrency(calc.totalOfferedPrice || (calc.totalRawCost + calc.effectiveProfit))}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.calcItemActions}>
                                            {isSelected && (
                                                <span className={styles.selectedCheck} title="Şu an seçili hesap">
                                                    <TbCheck size={16} />
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                className={styles.deleteBtn}
                                                onClick={(e) => onDelete(calc.id, calc.name, e)}
                                                title={`"${calc.name}" hesabını sil`}
                                                aria-label="Hesabı sil"
                                            >
                                                <TbTrash size={14} />
                                            </button>
                                        </div>
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
