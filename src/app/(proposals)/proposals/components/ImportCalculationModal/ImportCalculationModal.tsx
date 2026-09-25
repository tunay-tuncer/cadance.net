"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { TbCalculator, TbX, TbFileDownload, TbInfoCircle, TbArrowRight } from "react-icons/tb";
import { ProjectCalculationRecord } from "@/lib/fireabase/projectCalculationService";
import { calculateProfitPricesExplicit } from "../../utils/calculatorMath";
import styles from "./ImportCalculationModal.module.css";

interface ImportCalculationModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectName: string;
    isProjectBilled: boolean;
    calculations: ProjectCalculationRecord[];
    onSelectCalculation: (calc: ProjectCalculationRecord) => void;
}

const formatCurrency = (amount: number): string => {
    return `₺${Math.round(amount).toLocaleString("tr-TR")}`;
};

export default function ImportCalculationModal({
    isOpen,
    onClose,
    projectName,
    isProjectBilled,
    calculations,
    onSelectCalculation,
}: ImportCalculationModalProps) {
    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* MODAL HEADER */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIconWrapper}>
                            <TbCalculator />
                        </div>
                        <div className={styles.titleGroup}>
                            <h2 className={styles.modalTitle}>Hesaplayıcıdan Kalem Aktar</h2>
                            <p className={styles.modalSubtitle}>
                                {projectName ? `"${projectName}" projesine ait hesaplama senaryoları` : "Proje hesapları"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={styles.closeButton}
                        aria-label="Kapat"
                    >
                        <TbX size={18} />
                    </button>
                </div>

                {/* MODAL BODY */}
                <div className={styles.modalBody}>
                    {calculations.length === 0 ? (
                        <div className={styles.emptyContainer}>
                            <div className={styles.emptyIconWrapper}>
                                <TbCalculator />
                            </div>
                            <h3 className={styles.emptyTitle}>Kayıtlı Hesap Bulunamadı</h3>
                            <p className={styles.emptyDesc}>
                                Bu proje için henüz <strong>Proposal Calculator</strong> sayfasında bir hesap senaryosu oluşturulmamış.
                            </p>
                            <Link href="/proposals/calculator" className={styles.emptyLinkBtn} onClick={onClose}>
                                <span>Hesaplayıcıya Git ve Hesap Oluştur</span>
                                <TbArrowRight size={14} />
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* NOTICE BANNER */}
                            <div className={styles.infoNotice}>
                                <TbInfoCircle className={styles.noticeIcon} />
                                <span>
                                    Teklif tablonuza aktarmak istediğiniz hesaplama senaryosunu seçin. Seçtiğiniz hesaptaki iş kalemleri, <strong>hedef kâr ve vergi payları eklenmiş kârlı teklif fiyatlarıyla</strong> doğrudan forma işlenecektir.
                                </span>
                            </div>

                            {/* CALCULATION CARDS LIST */}
                            <div className={styles.cardsList}>
                                {calculations.map((calc, idx) => {
                                    const dateStr = calc.updatedAt?.toDate
                                        ? calc.updatedAt.toDate().toLocaleDateString("tr-TR")
                                        : "";
                                    const items = calc.items || [];
                                    const profitMap = calculateProfitPricesExplicit(
                                        items,
                                        calc.targetProfit || 0,
                                        isProjectBilled,
                                        calc.useGrossUp || false
                                    );

                                    const totalOffered = calc.totalOfferedPrice || (calc.totalRawCost + calc.effectiveProfit);

                                    return (
                                        <div key={calc.id || idx} className={styles.calcCard}>
                                            {/* CARD HEADER */}
                                            <div className={styles.calcCardHeader}>
                                                <div className={styles.calcNameGroup}>
                                                    <span className={styles.calcCardName}>{calc.name}</span>
                                                    <span className={styles.calcVersionBadge}>
                                                        {items.length} Kalem
                                                    </span>
                                                </div>
                                                {dateStr && <span className={styles.calcDate}>{dateStr}</span>}
                                            </div>

                                            {/* METRICS GRID */}
                                            <div className={styles.metricsGrid}>
                                                <div className={styles.metricItem}>
                                                    <span className={styles.metricLabel}>Kalem Sayısı</span>
                                                    <span className={styles.metricValue}>{items.length} Kalem</span>
                                                </div>
                                                <div className={styles.metricItem}>
                                                    <span className={styles.metricLabel}>Ham Maliyet</span>
                                                    <span className={styles.metricValue}>{formatCurrency(calc.totalRawCost)}</span>
                                                </div>
                                                <div className={styles.metricItem}>
                                                    <span className={styles.metricLabel}>Hedef Net Kâr</span>
                                                    <span className={`${styles.metricValue} ${styles.metricProfit}`}>
                                                        +{formatCurrency(calc.targetProfit)}
                                                    </span>
                                                </div>
                                                <div className={styles.metricItem}>
                                                    <span className={styles.metricLabel}>Kârlı Toplam</span>
                                                    <span className={`${styles.metricValue} ${styles.metricTotal}`}>
                                                        {formatCurrency(totalOffered)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* ITEMS PREVIEW (First few items) */}
                                            {items.length > 0 && (
                                                <div className={styles.itemsPreviewWrapper}>
                                                    {items.slice(0, 4).map((item, itemIdx) => {
                                                        const detail = profitMap.get(item.id || String(itemIdx));
                                                        const price = detail ? detail.profitPrice : Number(item.rawCost || 0);

                                                        return (
                                                            <div key={item.id || itemIdx} className={styles.previewItemRow}>
                                                                <div className={styles.previewItemLeft}>
                                                                    <span className={styles.previewItemNumber}>
                                                                        #{item.number || String(itemIdx + 1).padStart(2, "0")}
                                                                    </span>
                                                                    <span className={styles.previewItemTitle}>
                                                                        {item.name}
                                                                    </span>
                                                                </div>
                                                                <span className={styles.previewItemPrice}>
                                                                    {formatCurrency(price)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                    {items.length > 4 && (
                                                        <div style={{ textAlign: "center", fontSize: "0.68rem", color: "#71717a", paddingTop: "0.2rem" }}>
                                                            +{items.length - 4} kalem daha...
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* CARD FOOTER WITH ACTION BUTTON */}
                                            <div className={styles.calcCardFooter}>
                                                <div className={styles.footerTotalInfo}>
                                                    <span className={styles.footerTotalLabel}>Toplam Teklif:</span>
                                                    <span className={styles.footerTotalValue}>
                                                        {formatCurrency(totalOffered)}
                                                        {isProjectBilled ? " +KDV" : ""}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={styles.btnImport}
                                                    onClick={() => onSelectCalculation(calc)}
                                                    title={`"${calc.name}" hesabındaki kalemleri teklife aktar`}
                                                >
                                                    <TbFileDownload size={15} />
                                                    <span>Bu Hesabı Teklife Aktar</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
