"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    ProjectItem,
    subscribeToUserProjects,
    updateUserProject,
    toggleUserProjectBilled,
} from "@/lib/fireabase/projectService";
import {
    InvoiceWorkItem,
    NewWorkItemInput,
    subscribeToProjectWorkItems,
    addInvoiceWorkItem,
    updateInvoiceWorkItem,
    deleteInvoiceWorkItem,
} from "@/lib/fireabase/invoiceWorkItemService";
import {
    MdWorkOutline,
    MdFormatListNumbered,
    MdTitle,
    MdDescription,
    MdAttachMoney,
    MdBusiness,
    MdAdd,
    MdEdit,
    MdDelete,
    MdCheck,
    MdClose,
    MdContentCopy,
    MdSearch,
    MdTrendingUp,
    MdInfoOutline,
} from "react-icons/md";
import { TbCalculator, TbReceiptTax } from "react-icons/tb";
import CustomProjectDropdown from "./CustomProjectDropdown";
import CustomBillableFilterDropdown from "./CustomBillableFilterDropdown";
import CustomBillableStatusDropdown from "./CustomBillableStatusDropdown";
import styles from "./InvoiceCalculatorCard.module.css";

const formatCurrency = (amount: number): string => {
    return `₺${Math.round(amount).toLocaleString("tr-TR")}`;
};

export default function InvoiceCalculatorCard() {
    const { user } = useAuth();

    // 1. Projects State
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [projectsLoading, setProjectsLoading] = useState<boolean>(true);

    // 2. Target Profit & Tax Mode State (per project)
    const [targetProfit, setTargetProfit] = useState<number>(0);
    const [targetProfitInput, setTargetProfitInput] = useState<string>("");
    const [useGrossUp, setUseGrossUp] = useState<boolean>(false);

    // 3. Work Items State
    const [workItems, setWorkItems] = useState<InvoiceWorkItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState<boolean>(false);

    // 4. Search & Filter State
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [billableFilter, setBillableFilter] = useState<"ALL" | "BILLABLE" | "NON_BILLABLE">("ALL");

    // 5. Inline Add Row State
    const [isAddingRow, setIsAddingRow] = useState<boolean>(false);
    const [newNumber, setNewNumber] = useState<string>("");
    const [newName, setNewName] = useState<string>("");
    const [newDescription, setNewDescription] = useState<string>("");
    const [newRawCost, setNewRawCost] = useState<string>("");
    const [newCanBeBilled, setNewCanBeBilled] = useState<boolean>(true);

    // 6. Inline Edit Row State
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editNumber, setEditNumber] = useState<string>("");
    const [editName, setEditName] = useState<string>("");
    const [editDescription, setEditDescription] = useState<string>("");
    const [editRawCost, setEditRawCost] = useState<string>("");
    const [editCanBeBilled, setEditCanBeBilled] = useState<boolean>(true);

    // Subscribe to projects
    useEffect(() => {
        if (!user?.uid) {
            setProjects([]);
            setProjectsLoading(false);
            return;
        }

        const unsubscribe = subscribeToUserProjects(user.uid, (fetched) => {
            setProjects(fetched);
            setProjectsLoading(false);
            // Default select the first project if none selected yet
            if (fetched.length > 0 && !selectedProjectId) {
                setSelectedProjectId(fetched[0].id);
            }
        });

        return () => unsubscribe();
    }, [user?.uid, selectedProjectId]);

    // Subscribe to work items for selected project
    useEffect(() => {
        if (!user?.uid || !selectedProjectId) {
            setWorkItems([]);
            setItemsLoading(false);
            return;
        }

        setItemsLoading(true);
        const unsubscribe = subscribeToProjectWorkItems(
            user.uid,
            selectedProjectId,
            (fetched) => {
                setWorkItems(fetched);
                setItemsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user?.uid, selectedProjectId]);

    // Currently selected project
    const selectedProject = useMemo(() => {
        return projects.find((p) => p.id === selectedProjectId) || null;
    }, [projects, selectedProjectId]);

    // Financial Metrics Calculations
    const agreedPayment = selectedProject?.agreedPayment || 0;
    const totalRawCost = workItems.reduce((acc, item) => acc + (Number(item.rawCost) || 0), 0);
    const billableCost = workItems
        .filter((item) => item.canBeBilled)
        .reduce((acc, item) => acc + (Number(item.rawCost) || 0), 0);
    const nonBillableCost = workItems
        .filter((item) => !item.canBeBilled)
        .reduce((acc, item) => acc + (Number(item.rawCost) || 0), 0);
    const estimatedMargin = agreedPayment - totalRawCost;
    const marginPercent = agreedPayment > 0 ? ((estimatedMargin / agreedPayment) * 100).toFixed(0) : "0";

    // 25% Income Tax & Non-Billable Tax Compensation Logic (when project is billed)
    const isProjectBilled = Boolean(selectedProject?.isBilled);
    const incomeTaxRate = isProjectBilled ? 0.25 : 0;

    // 1. Kâr Gelir Vergisi (Target Profit Tax: 25% on net target profit: e.g. 400.000 TL * 0.25 = 100.000 TL)
    const profitTax = isProjectBilled ? Math.round(targetProfit * incomeTaxRate) : 0;

    // 2. Faturasız Kalem Vergi Telafisi (Non-Billable Cost Tax Liability):
    // İş faturalı kesildiğinde, faturası temin edilemeyen iş kalemleri (faturasız ustalar vb.) resmi kayıtlarda gider gösterilemez.
    // Dolayısıyla resmi muhasebede kâr/gelir olarak görünür ve şirket %25 vergi ödemek zorunda kalır.
    // Hedeflenen net kârın (örn. 400.000 TL) erimemesi için bu vergi yükü teklife eklenmelidir (örn. 500.000 TL * 0.25 = 125.000 TL).
    const nonBillableTaxCompensation = isProjectBilled ? Math.round(nonBillableCost * incomeTaxRate) : 0;

    // 3. Toplam Vergi Yükü
    const totalTaxCompensation = profitTax + nonBillableTaxCompensation;

    // 4. Dağıtılacak Toplam Kâr & Vergi Marjı (Effective Profit):
    // Standart Telafi: Hedef Kâr + Kâr Vergisi + Faturasız Gider Vergisi (400k + 100k + 125k = 625.000 TL)
    // Tam Net Koruma (Gross-up / Brütleştirme): (Hedef Kâr + Faturasız Gider Vergisi) / 0.75 = 700.000 TL
    const effectiveProfit = useMemo(() => {
        if (!isProjectBilled) return targetProfit;
        if (targetProfit <= 0 && nonBillableCost <= 0) return 0;

        if (useGrossUp) {
            return Math.round((targetProfit + nonBillableTaxCompensation) / 0.75);
        }
        return targetProfit + totalTaxCompensation;
    }, [isProjectBilled, targetProfit, totalTaxCompensation, nonBillableTaxCompensation, useGrossUp]);

    // Filtered Work Items
    const displayedItems = useMemo(() => {
        return workItems.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.number.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (billableFilter === "BILLABLE") return item.canBeBilled;
            if (billableFilter === "NON_BILLABLE") return !item.canBeBilled;
            return true;
        });
    }, [workItems, searchQuery, billableFilter]);

    // Synchronize target profit from selected project
    useEffect(() => {
        if (selectedProject) {
            const profit = Number(selectedProject.targetProfit) || 0;
            setTargetProfit(profit);
            setTargetProfitInput(profit > 0 ? profit.toLocaleString("tr-TR") : "");
        } else {
            setTargetProfit(0);
            setTargetProfitInput("");
        }
    }, [selectedProjectId, selectedProject?.targetProfit]);

    // Handle target profit input change
    const handleTargetProfitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setTargetProfitInput(raw);
        const parsed = parseFloat(raw.replace(/[^\d.-]/g, "")) || 0;
        setTargetProfit(parsed >= 0 ? parsed : 0);
    };

    // Save target profit to project document
    const handleSaveTargetProfit = async () => {
        if (!user?.uid || !selectedProjectId) return;
        try {
            await updateUserProject(user.uid, selectedProjectId, {
                targetProfit: targetProfit,
            });
        } catch (error) {
            console.error("Error saving target profit:", error);
        }
    };

    // Toggle project billed status
    const handleToggleProjectBilled = async () => {
        if (!user?.uid || !selectedProjectId || !selectedProject) return;
        try {
            await toggleUserProjectBilled(user.uid, selectedProjectId, selectedProject.isBilled);
        } catch (error) {
            console.error("Error toggling project billed:", error);
        }
    };

    // Quick percentage presets (e.g. 10%, 20%, 30%, 50% over raw cost)
    const handleQuickPercent = async (percent: number) => {
        if (totalRawCost <= 0) return;
        const calc = Math.round(totalRawCost * (percent / 100));
        setTargetProfit(calc);
        setTargetProfitInput(calc.toLocaleString("tr-TR"));
        if (user?.uid && selectedProjectId) {
            try {
                await updateUserProject(user.uid, selectedProjectId, {
                    targetProfit: calc,
                });
            } catch (error) {
                console.error("Error saving target profit:", error);
            }
        }
    };

    // Calculate proportional profit share for an individual work item (incorporating 25% tax when project is billed)
    const getItemProfitMetrics = (itemCost: number) => {
        if (effectiveProfit <= 0) {
            return {
                profitShare: 0,
                netProfitShare: 0,
                taxShare: 0,
                profitPrice: itemCost,
                profitPercent: "0",
            };
        }

        let share = 0;
        if (totalRawCost > 0) {
            share = Math.round(effectiveProfit * (itemCost / totalRawCost));
        } else if (workItems.length > 0) {
            share = Math.round(effectiveProfit / workItems.length);
        }

        const profitPrice = itemCost + share;
        const profitPercent = itemCost > 0 ? ((share / itemCost) * 100).toFixed(0) : "0";

        // Proportional net profit and tax components for transparency
        const netShare = isProjectBilled && effectiveProfit > 0
            ? Math.round(share * (targetProfit / (effectiveProfit || 1)))
            : share;
        const taxShare = share - netShare;

        return {
            profitShare: share,
            netProfitShare: netShare,
            taxShare: taxShare,
            profitPrice,
            profitPercent,
        };
    };

    // Prepare new row auto-number
    const handleStartAddRow = () => {
        const nextNumber = String(workItems.length + 1).padStart(2, "0");
        setNewNumber(nextNumber);
        setNewName("");
        setNewDescription("");
        setNewRawCost("");
        setNewCanBeBilled(true);
        setIsAddingRow(true);
    };

    // Save new work item
    const handleSaveNewItem = async () => {
        if (!user?.uid || !selectedProjectId) return;
        if (!newName.trim()) return;

        const payload: NewWorkItemInput = {
            number: newNumber.trim() || String(workItems.length + 1).padStart(2, "0"),
            name: newName.trim(),
            description: newDescription.trim(),
            rawCost: parseFloat(newRawCost.replace(/[^\d.-]/g, "")) || 0,
            canBeBilled: newCanBeBilled,
        };

        try {
            await addInvoiceWorkItem(user.uid, selectedProjectId, payload);
            setIsAddingRow(false);
        } catch (error) {
            console.error("Error saving work item:", error);
        }
    };

    // Start editing item
    const handleStartEdit = (item: InvoiceWorkItem) => {
        setEditingItemId(item.id);
        setEditNumber(item.number);
        setEditName(item.name);
        setEditDescription(item.description);
        setEditRawCost(String(item.rawCost));
        setEditCanBeBilled(item.canBeBilled);
    };

    // Save edited item
    const handleSaveEdit = async (id: string) => {
        if (!user?.uid || !selectedProjectId) return;
        try {
            await updateInvoiceWorkItem(user.uid, selectedProjectId, id, {
                number: editNumber.trim(),
                name: editName.trim(),
                description: editDescription.trim(),
                rawCost: parseFloat(editRawCost.replace(/[^\d.-]/g, "")) || 0,
                canBeBilled: editCanBeBilled,
            });
            setEditingItemId(null);
        } catch (error) {
            console.error("Error updating work item:", error);
        }
    };

    // Duplicate item
    const handleDuplicate = async (item: InvoiceWorkItem) => {
        if (!user?.uid || !selectedProjectId) return;
        const nextNumber = String(workItems.length + 1).padStart(2, "0");
        try {
            await addInvoiceWorkItem(user.uid, selectedProjectId, {
                number: nextNumber,
                name: `${item.name} (Kopya)`,
                description: item.description,
                rawCost: item.rawCost,
                canBeBilled: item.canBeBilled,
            });
        } catch (error) {
            console.error("Error duplicating work item:", error);
        }
    };

    // Delete item
    const handleDelete = async (id: string) => {
        if (!user?.uid || !selectedProjectId) return;
        try {
            await deleteInvoiceWorkItem(user.uid, selectedProjectId, id);
        } catch (error) {
            console.error("Error deleting work item:", error);
        }
    };

    return (
        <div className={styles.calculatorCard}>
            {/* HEADER AREA */}
            <div className={styles.headerArea}>
                <div className={styles.titleWrapper}>
                    <TbCalculator className={styles.headerIcon} />
                    <h1 className={styles.sectionTitle}>Invoice Calculator</h1>
                    <span className={styles.itemCountBadge}>
                        {workItems.length} İş Kalemi
                    </span>
                </div>
                {selectedProject && (
                    <button
                        type="button"
                        onClick={handleToggleProjectBilled}
                        className={styles.projectBilledToggleBtn}
                        title="Proje faturalandırma durumunu değiştir (Faturalı projelerde %25 gelir vergisi hesaba katılır)"
                    >
                        <span
                            className={
                                selectedProject.isBilled
                                    ? styles.projectBilledActive
                                    : styles.projectBilledInactive
                            }
                        >
                            <TbReceiptTax size={13} />
                            {selectedProject.isBilled
                                ? "Proje: Faturalı (+%25 Vergi)"
                                : "Proje: Faturasız (Vergisiz)"}
                        </span>
                    </button>
                )}
            </div>

            {/* CONTROLS: PROJECT SELECTOR & FILTER */}
            <div className={styles.controlsBar}>
                <div className={styles.projectSelectorContainer}>
                    <span className={styles.controlLabel}>
                        <MdWorkOutline size={14} />
                        Proje:
                    </span>
                    <CustomProjectDropdown
                        projects={projects}
                        selectedProjectId={selectedProjectId}
                        onChange={(id) => setSelectedProjectId(id)}
                        disabled={projectsLoading || projects.length === 0}
                        loading={projectsLoading}
                    />
                </div>

                <div className={styles.filterWrapper}>
                    <input
                        type="text"
                        placeholder="İş kalemi ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    <CustomBillableFilterDropdown
                        value={billableFilter}
                        onChange={(val) => setBillableFilter(val)}
                    />
                </div>
            </div>

            {/* TARGET PROFIT & PRICING BAR */}
            {selectedProject && (
                <>
                    <div className={styles.targetProfitSection}>
                    <div className={styles.profitInputSection}>
                        <div className={styles.profitLabelWrapper}>
                            <MdTrendingUp className={styles.profitIcon} />
                            <span className={styles.profitSectionLabel}>Hedef Net Kâr:</span>
                        </div>
                        <div className={styles.profitInputWrapper}>
                            <span className={styles.profitCurrencyPrefix}>₺</span>
                            <input
                                type="text"
                                value={targetProfitInput}
                                onChange={handleTargetProfitChange}
                                onBlur={handleSaveTargetProfit}
                                placeholder="0"
                                className={styles.profitInput}
                            />
                        </div>

                        {/* Quick Percentage Presets */}
                        <div className={styles.quickPercentGroup}>
                            {[10, 20, 30, 50].map((pct) => (
                                <button
                                    key={pct}
                                    type="button"
                                    onClick={() => handleQuickPercent(pct)}
                                    className={styles.quickPercentBtn}
                                    title={`Toplam maliyetin %${pct}'i kadar net kâr ekle`}
                                >
                                    %{pct}
                                </button>
                            ))}
                        </div>

                        {/* Tax Badges */}
                        {isProjectBilled ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                                <span className={styles.profitTaxBadge} title="Hedef kârın %25 kurumlar/gelir vergisi karşılığı">
                                    +%25 Kâr Vergisi (+{formatCurrency(profitTax)})
                                </span>
                                {nonBillableCost > 0 && (
                                    <span
                                        className={styles.profitTaxBadge}
                                        style={{
                                            background: "rgba(245, 158, 11, 0.14)",
                                            borderColor: "rgba(245, 158, 11, 0.35)",
                                            color: "#fbbf24",
                                        }}
                                        title="Fatura temin edilemeyen giderler resmi kayıtlarda kâr görüneceği için %25 vergi telafisi"
                                    >
                                        +%25 Faturasız Telafi (+{formatCurrency(nonBillableTaxCompensation)})
                                    </span>
                                )}
                            </div>
                        ) : (
                            <span className={styles.profitMarginBadge} style={{ background: "rgba(255, 255, 255, 0.06)", borderColor: "rgba(255, 255, 255, 0.15)", color: "#a1a1aa" }}>
                                Faturasız Proje (%0 Vergi)
                            </span>
                        )}

                        {/* Gross-up Toggle for full net protection */}
                        {isProjectBilled && (targetProfit > 0 || nonBillableCost > 0) && (
                            <label
                                className={styles.grossUpToggleWrapper}
                                title="Vergi telafisinin de vergisini hesaba katarak kasanıza net hedef kârın kalmasını sağlayan tam brütleştirme yöntemi."
                            >
                                <input
                                    type="checkbox"
                                    checked={useGrossUp}
                                    onChange={(e) => setUseGrossUp(e.target.checked)}
                                    className={styles.grossUpToggleInput}
                                />
                                <span>Tam Net Koruma (Brütleştir)</span>
                            </label>
                        )}

                        {(targetProfit > 0 || nonBillableTaxCompensation > 0) && isProjectBilled && (
                            <span className={styles.profitBreakdownNote}>
                                (Dağıtılan Toplam Kâr & Vergi: {formatCurrency(effectiveProfit)})
                            </span>
                        )}
                    </div>

                    <div className={styles.targetTotalDisplay}>
                        <span className={styles.targetTotalLabel}>
                            Müşteriye Sunulacak Kârlı Toplam Tutar
                        </span>
                        <span className={styles.targetTotalValue}>
                            {formatCurrency(totalRawCost + effectiveProfit)}
                        </span>
                        <span className={styles.targetTotalSubtitle}>
                            Ham Maliyet ({formatCurrency(totalRawCost)}) + Net Kâr ({formatCurrency(targetProfit)})
                            {isProjectBilled && totalTaxCompensation > 0
                                ? ` + Toplam Vergi Payı (${formatCurrency(effectiveProfit - targetProfit)})`
                                : ""}
                        </span>
                    </div>
                </div>

                {/* TAX ALERT NOTICE IF PROJECT IS BILLED AND HAS NON-BILLABLE WORK ITEMS */}
                {isProjectBilled && nonBillableCost > 0 && (
                    <div className={styles.taxAlertBox}>
                        <div className={styles.taxAlertIconWrapper}>
                            <MdInfoOutline size={18} />
                        </div>
                        <div className={styles.taxAlertContent}>
                            <span className={styles.taxAlertTitle}>
                                Faturasız Kalem Vergi Telafisi Devrede
                            </span>
                            <span className={styles.taxAlertDesc}>
                                Bu proje müşteriye <strong>Faturalı</strong> kesilecektir ancak iş kalemleri içinde toplam <strong>{formatCurrency(nonBillableCost)}</strong> tutarında <strong>fatura kesemeyen (şirketsiz)</strong> iş kalemi bulunmaktadır. Fatura temin edilemediği için resmi muhasebede gider yazılamayan bu tutar şirketinize kâr gibi yansıyarak <strong>%25 = {formatCurrency(nonBillableTaxCompensation)}</strong> vergi yükü doğurur. Hedeflediğiniz <strong>{formatCurrency(targetProfit)}</strong> net kârın erimemesi için bu vergi yükü kâr payı olarak teklif fiyatlarına otomatik eklenmiştir.
                            </span>
                        </div>
                    </div>
                )}
                </>
            )}

            {/* METRICS SUMMARY BAR (MATCHING FINANCE TABLE) */}
            {selectedProject && (
                <div className={styles.metricsGroup}>
                    <div className={styles.metricChip}>
                        <span className={styles.metricLabel}>Anlaşılan Tutar:</span>
                        <span className={styles.metricValuePrimary}>
                            {formatCurrency(agreedPayment)}
                        </span>
                    </div>
                    <div className={styles.metricChip}>
                        <span className={styles.metricLabel}>Toplam Ham Maliyet:</span>
                        <span className={styles.metricValueTotal}>
                            {formatCurrency(totalRawCost)}
                        </span>
                    </div>
                    <div className={styles.metricChip}>
                        <span className={styles.metricLabel}>Hedef Net Kâr:</span>
                        <span className={styles.metricValueMarginPositive}>
                            {formatCurrency(targetProfit)}
                        </span>
                    </div>
                    {isProjectBilled && (
                        <div className={styles.metricChip}>
                            <span className={styles.metricLabel}>Kâr Vergisi (%25):</span>
                            <span style={{ color: "#60a5fa", fontWeight: 700 }}>
                                {formatCurrency(profitTax)}
                            </span>
                        </div>
                    )}
                    {isProjectBilled && nonBillableCost > 0 && (
                        <div className={styles.metricChip}>
                            <span className={styles.metricLabel}>Faturasız Vergi Telafisi (%25):</span>
                            <span style={{ color: "#fbbf24", fontWeight: 700 }}>
                                {formatCurrency(nonBillableTaxCompensation)}
                            </span>
                        </div>
                    )}
                    {isProjectBilled && (
                        <div className={styles.metricChip}>
                            <span className={styles.metricLabel}>Dağıtılan Toplam Marj:</span>
                            <span style={{ color: "#38bdf8", fontWeight: 700 }}>
                                {formatCurrency(effectiveProfit)}
                            </span>
                        </div>
                    )}
                    <div className={styles.metricChip}>
                        <span className={styles.metricLabel}>Kârlı Teklif Toplamı:</span>
                        <span
                            style={{
                                color: "#34d399",
                                fontWeight: 800,
                            }}
                        >
                            {formatCurrency(totalRawCost + effectiveProfit)}
                        </span>
                    </div>
                    <div className={styles.metricChip}>
                        <span className={styles.metricLabel}>Faturalı Maliyet:</span>
                        <span className={styles.metricValueBillable}>
                            {formatCurrency(billableCost)}
                        </span>
                    </div>
                    <div className={styles.metricChip}>
                        <span className={styles.metricLabel}>Faturasız Maliyet:</span>
                        <span className={styles.metricValueNonBillable}>
                            {formatCurrency(nonBillableCost)}
                            {isProjectBilled && nonBillableCost > 0 && " (Vergi Doğuran)"}
                        </span>
                    </div>
                    {agreedPayment > 0 && (
                        <div className={styles.metricChip}>
                            <span className={styles.metricLabel}>Net Kalan:</span>
                            <span
                                className={
                                    estimatedMargin >= 0
                                        ? styles.metricValueMarginPositive
                                        : styles.metricValueMarginNegative
                                }
                            >
                                {formatCurrency(estimatedMargin)} (%{marginPercent})
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* TABLE SCROLL CONTAINER */}
            <div className={styles.tableScrollWrapper}>
                {!selectedProjectId ? (
                    <div className={styles.emptyStateContainer}>
                        <MdWorkOutline className={styles.emptyStateIcon} />
                        <h3 className={styles.emptyStateTitle}>Lütfen Bir Proje Seçiniz</h3>
                        <p className={styles.emptyStateDesc}>
                            İş kalemlerini görüntülemek ve maliyet hesaplaması yapmak için
                            yukarıdaki listeden bir proje seçin.
                        </p>
                    </div>
                ) : (
                    <table className={styles.tableContainer}>
                        <thead>
                            <tr>
                                <th className={styles.tableHeaderCell} style={{ width: "70px" }}>
                                    <div className={styles.headerCellContent}>
                                        <MdFormatListNumbered size={14} />
                                        <span>No</span>
                                    </div>
                                </th>
                                <th className={styles.tableHeaderCell} style={{ width: "220px" }}>
                                    <div className={styles.headerCellContent}>
                                        <MdTitle size={14} />
                                        <span>İş / Kalem Adı</span>
                                    </div>
                                </th>
                                <th className={styles.tableHeaderCell}>
                                    <div className={styles.headerCellContent}>
                                        <MdDescription size={14} />
                                        <span>Açıklama & Notlar</span>
                                    </div>
                                </th>
                                <th className={styles.tableHeaderCell} style={{ width: "125px" }}>
                                    <div className={styles.headerCellContent}>
                                        <MdAttachMoney size={14} />
                                        <span>Ham Maliyet</span>
                                    </div>
                                </th>
                                <th className={styles.tableHeaderCell} style={{ width: "145px" }}>
                                    <div className={styles.headerCellContent}>
                                        <MdTrendingUp size={14} />
                                        <span>Kârlı Fiyat</span>
                                    </div>
                                </th>
                                <th className={styles.tableHeaderCell} style={{ width: "180px" }}>
                                    <div className={styles.headerCellContent}>
                                        <MdBusiness size={14} />
                                        <span>Faturalandırma Durumu</span>
                                    </div>
                                </th>
                                <th
                                    className={styles.tableHeaderCell}
                                    style={{ width: "110px", textAlign: "right" }}
                                >
                                    <span>İşlemler</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* INLINE NEW ROW */}
                            {isAddingRow && (
                                <tr className={`${styles.tableRow} ${styles.editingRow}`}>
                                    <td className={styles.tableCell}>
                                        <input
                                            type="text"
                                            value={newNumber}
                                            onChange={(e) => setNewNumber(e.target.value)}
                                            placeholder="01"
                                            className={styles.rowInput}
                                            style={{ width: "55px", textAlign: "center" }}
                                        />
                                    </td>
                                    <td className={styles.tableCell}>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="İş veya kalem adı..."
                                            className={styles.rowInput}
                                            autoFocus
                                        />
                                    </td>
                                    <td className={styles.tableCell}>
                                        <input
                                            type="text"
                                            value={newDescription}
                                            onChange={(e) => setNewDescription(e.target.value)}
                                            placeholder="Hizmet kapsamı veya açıklaması..."
                                            className={styles.rowInput}
                                        />
                                    </td>
                                    <td className={styles.tableCell}>
                                        <input
                                            type="number"
                                            value={newRawCost}
                                            onChange={(e) => setNewRawCost(e.target.value)}
                                            placeholder="0"
                                            className={styles.rowInput}
                                        />
                                    </td>
                                    <td className={styles.tableCell}>
                                        <div className={styles.cellProfitContainer}>
                                            <span className={styles.previewProfitPrice}>
                                                {effectiveProfit > 0
                                                    ? `~${formatCurrency(
                                                          (parseFloat(newRawCost.replace(/[^\d.-]/g, "")) || 0) +
                                                              (totalRawCost > 0
                                                                  ? Math.round(
                                                                        effectiveProfit *
                                                                            ((parseFloat(newRawCost.replace(/[^\d.-]/g, "")) || 0) /
                                                                                (totalRawCost + (parseFloat(newRawCost.replace(/[^\d.-]/g, "")) || 0)))
                                                                    )
                                                                  : effectiveProfit)
                                                      )}`
                                                    : "—"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className={styles.tableCell}>
                                        <CustomBillableStatusDropdown
                                            value={newCanBeBilled}
                                            onChange={(val) => setNewCanBeBilled(val)}
                                            compact
                                        />
                                    </td>
                                    <td className={styles.tableCell}>
                                        <div className={styles.actionsCell}>
                                            <button
                                                type="button"
                                                onClick={handleSaveNewItem}
                                                className={`${styles.actionBtn} ${styles.actionBtnSave}`}
                                                title="Kaydet"
                                            >
                                                <MdCheck size={18} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingRow(false)}
                                                className={`${styles.actionBtn} ${styles.actionBtnCancel}`}
                                                title="İptal"
                                            >
                                                <MdClose size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* LIST ROWS */}
                            {displayedItems.length === 0 && !isAddingRow ? (
                                <tr>
                                    <td colSpan={7} className={styles.tableCell}>
                                        <div className={styles.emptyStateContainer} style={{ padding: "2.5rem" }}>
                                            <TbReceiptTax className={styles.emptyStateIcon} />
                                            <h4 className={styles.emptyStateTitle}>
                                                İş Kalemi Bulunmuyor
                                            </h4>
                                            <p className={styles.emptyStateDesc}>
                                                Bu projeye henüz bir iş kalemi eklenmemiş. Aşağıdaki
                                                butonu kullanarak ilk kalemi ekleyebilirsiniz.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayedItems.map((item) => {
                                    const isEditing = editingItemId === item.id;

                                    if (isEditing) {
                                        return (
                                            <tr
                                                key={item.id}
                                                className={`${styles.tableRow} ${styles.editingRow}`}
                                            >
                                                <td className={styles.tableCell}>
                                                    <input
                                                        type="text"
                                                        value={editNumber}
                                                        onChange={(e) => setEditNumber(e.target.value)}
                                                        className={styles.rowInput}
                                                        style={{ width: "55px", textAlign: "center" }}
                                                    />
                                                </td>
                                                <td className={styles.tableCell}>
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className={styles.rowInput}
                                                    />
                                                </td>
                                                <td className={styles.tableCell}>
                                                    <input
                                                        type="text"
                                                        value={editDescription}
                                                        onChange={(e) =>
                                                            setEditDescription(e.target.value)
                                                        }
                                                        className={styles.rowInput}
                                                    />
                                                </td>
                                                <td className={styles.tableCell}>
                                                    <input
                                                        type="number"
                                                        value={editRawCost}
                                                        onChange={(e) =>
                                                            setEditRawCost(e.target.value)
                                                        }
                                                        className={styles.rowInput}
                                                    />
                                                </td>
                                                <td className={styles.tableCell}>
                                                    <div className={styles.cellProfitContainer}>
                                                        <span className={styles.previewProfitPrice}>
                                                            {effectiveProfit > 0
                                                                ? `~${formatCurrency(
                                                                      (parseFloat(editRawCost.replace(/[^\d.-]/g, "")) || 0) +
                                                                          (totalRawCost > 0
                                                                              ? Math.round(
                                                                                    effectiveProfit *
                                                                                        ((parseFloat(editRawCost.replace(/[^\d.-]/g, "")) || 0) /
                                                                                            totalRawCost)
                                                                                )
                                                                              : effectiveProfit)
                                                                  )}`
                                                                : "—"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className={styles.tableCell}>
                                                    <CustomBillableStatusDropdown
                                                        value={editCanBeBilled}
                                                        onChange={(val) => setEditCanBeBilled(val)}
                                                        compact
                                                    />
                                                </td>
                                                <td className={styles.tableCell}>
                                                    <div className={styles.actionsCell}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveEdit(item.id)}
                                                            className={`${styles.actionBtn} ${styles.actionBtnSave}`}
                                                            title="Kaydet"
                                                        >
                                                            <MdCheck size={18} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingItemId(null)}
                                                            className={`${styles.actionBtn} ${styles.actionBtnCancel}`}
                                                            title="İptal"
                                                        >
                                                            <MdClose size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={item.id} className={styles.tableRow}>
                                            <td className={`${styles.tableCell} ${styles.cellNo}`}>
                                                {item.number}
                                            </td>
                                            <td className={`${styles.tableCell} ${styles.cellTitle}`}>
                                                {item.name}
                                            </td>
                                            <td className={`${styles.tableCell} ${styles.cellDesc}`}>
                                                {item.description || "—"}
                                            </td>
                                            <td className={`${styles.tableCell} ${styles.cellPrice}`}>
                                                {formatCurrency(item.rawCost)}
                                            </td>
                                            {(() => {
                                                const { profitShare, profitPrice, profitPercent } =
                                                    getItemProfitMetrics(item.rawCost);
                                                return (
                                                    <td className={styles.tableCell}>
                                                        <div className={styles.cellProfitContainer}>
                                                            {effectiveProfit > 0 ? (
                                                                <>
                                                                    <span className={styles.cellProfitPrice}>
                                                                        {formatCurrency(profitPrice)}
                                                                    </span>
                                                                    <span className={styles.cellProfitBadge}>
                                                                        +{formatCurrency(profitShare)} kâr{isProjectBilled ? " (Vergi dahil)" : ""} (%{profitPercent})
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className={styles.cellProfitPriceMuted}>
                                                                        {formatCurrency(item.rawCost)}
                                                                    </span>
                                                                    <span className={styles.cellProfitBadgeMuted}>
                                                                        Kâr eklenmedi
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })()}
                                            <td className={styles.tableCell}>
                                                {item.canBeBilled ? (
                                                    <span className={styles.statusBadgeBillable}>
                                                        <MdCheck size={12} />
                                                        Faturalı (Şirketi Var)
                                                    </span>
                                                ) : (
                                                    <span
                                                        className={styles.statusBadgeNonBillable}
                                                        title={
                                                            isProjectBilled
                                                                ? "Fatura temin edilemediği için bu gider resmi muhasebede kâr gibi görünür ve %25 vergi doğurur."
                                                                : undefined
                                                        }
                                                    >
                                                        <MdClose size={12} />
                                                        Faturasız (Şirketi Yok)
                                                        {isProjectBilled && (
                                                            <span style={{ fontSize: "0.625rem", opacity: 0.85, fontWeight: 700, marginLeft: "3px" }}>
                                                                (+%25 Vergi)
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                            <td className={styles.tableCell}>
                                                <div className={styles.actionsCell}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartEdit(item)}
                                                        className={styles.actionBtn}
                                                        title="Düzenle"
                                                    >
                                                        <MdEdit size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDuplicate(item)}
                                                        className={styles.actionBtn}
                                                        title="Çoğalt"
                                                    >
                                                        <MdContentCopy size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item.id)}
                                                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                                        title="Sil"
                                                    >
                                                        <MdDelete size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ADD ROW BUTTON (MATCHING FINANCE TABLE) */}
            {selectedProjectId && !isAddingRow && (
                <div className={styles.addRowContainer}>
                    <button
                        type="button"
                        onClick={handleStartAddRow}
                        className={styles.addRowBtn}
                    >
                        <MdAdd size={18} />
                        <span>Yeni İş Kalemi Ekle</span>
                    </button>
                </div>
            )}
        </div>
    );
}
