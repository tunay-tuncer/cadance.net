"use client";

import React, { useState, useEffect, useMemo } from "react";
import BaseCard from "@/components/ui/BaseCard/BaseCard";
import { useAuth } from "@/context/AuthContext";
import Filter, { sortFinanceRecords, filterFinanceRecords, FilterCriteria } from "./Filter";
import TableRow from "./TableRow";
import AddTableRowButton from "./AddTableRowButton";
import {
    MdOutlineAttachMoney,
    MdCalendarToday,
    MdTune,
    MdOutlineFolder,
    MdOutlineTextSnippet,
    MdMoneyOff,
    MdCreditCard,
    MdCheckCircleOutline,
    MdAccountBalanceWallet,
} from "react-icons/md";
import { TbPlusMinus } from "react-icons/tb";
import {
    FinanceItem,
    NewFinanceInput,
    subscribeToUserFinanceRecords,
    addFinanceRecordToUser,
    updateFinanceRecord,
    deleteFinanceRecord,
} from "@/lib/fireabase/financeService";
import styles from "./FinanceTableCard.module.css";
import { IconType } from "react-icons";

interface TableHeader {
    id: string;
    label: string;
    icon: IconType;
}

const TABLE_HEADERS: TableHeader[] = [
    { id: "date", label: "Date", icon: MdCalendarToday },
    { id: "transactionType", label: "Transactıon Type", icon: MdTune },
    { id: "catagory", label: "Catagory", icon: MdOutlineFolder },
    { id: "explanation", label: "Explanatıon", icon: MdOutlineTextSnippet },
    { id: "income", label: "Income", icon: MdOutlineAttachMoney },
    { id: "expense", label: "Expense", icon: MdMoneyOff },
    { id: "paymentMethod", label: "Payment Method", icon: MdCreditCard },
    { id: "status", label: "Status", icon: MdCheckCircleOutline },
    { id: "summary", label: "Summary", icon: TbPlusMinus },
];

const formatCurrency = (amount: number): string => {
    const absFormatted = Math.abs(Math.round(amount)).toLocaleString("tr-TR");
    return `₺${absFormatted}`;
};

const FinanceTableCard = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState<FinanceItem[]>([]);
    const [loading, setLoading] = useState<boolean>(Boolean(user?.uid));
    const [isAddingRow, setIsAddingRow] = useState<boolean>(false);
    const [sortType, setSortType] = useState<string>("dateUp");
    const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
        field: "",
        operator: "",
        value: "",
    });

    // Real-time Firestore subscription
    useEffect(() => {
        if (!user?.uid) {
            setRecords([]);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToUserFinanceRecords(user.uid, (fetched) => {
            setRecords(fetched);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    // 1. Filter records based on user-defined 3-step criteria
    const filteredRecords = useMemo(() => {
        return filterFinanceRecords(records, filterCriteria);
    }, [records, filterCriteria]);

    // 2. Immutably sort the filtered records based on selected sort option
    const displayedRecords = useMemo(() => {
        return sortFinanceRecords(filteredRecords, sortType);
    }, [filteredRecords, sortType]);

    // Financial calculations (reflects filtered subset for live financial insights)
    const totalIncome = filteredRecords.reduce((sum, r) => sum + (Number(r.income) || 0), 0);
    const totalExpense = filteredRecords.reduce((sum, r) => sum + (Number(r.expense) || 0), 0);
    const netBalance = totalIncome - totalExpense;

    const isFilterActive = Boolean(
        filterCriteria.field && filterCriteria.operator && filterCriteria.value !== ""
    );

    // Handlers
    const handleSaveNewRecord = async (record: NewFinanceInput) => {
        if (!user?.uid) return;
        try {
            await addFinanceRecordToUser(user.uid, record);
            setIsAddingRow(false);
        } catch (error) {
            console.error("Error adding finance record:", error);
        }
    };

    const handleUpdateRecord = async (
        id: string,
        updates: Partial<NewFinanceInput>
    ) => {
        if (!user?.uid) return;
        try {
            await updateFinanceRecord(user.uid, id, updates);
        } catch (error) {
            console.error("Error updating finance record:", error);
        }
    };

    const handleDeleteRecord = async (id: string) => {
        if (!user?.uid) return;
        try {
            await deleteFinanceRecord(user.uid, id);
        } catch (error) {
            console.error("Error deleting finance record:", error);
        }
    };

    const isLoading = user ? loading : false;

    return (
        <BaseCard className={styles.financeTableCard}>
            {/* HEADER AREA */}
            <div className={styles.headerArea}>
                <div className={styles.titleWrapper}>
                    <MdOutlineAttachMoney className={styles.headerIcon} />
                    <h3 className={styles.sectionTitle}>Finances</h3>
                    <span
                        className={`${styles.recordCountBadge} ${
                            isFilterActive ? styles.recordCountBadgeFiltered : ""
                        }`}
                        title={
                            isFilterActive
                                ? `Showing ${filteredRecords.length} filtered out of ${records.length} total records`
                                : `${records.length} total records`
                        }
                    >
                        {isLoading
                            ? "..."
                            : isFilterActive
                            ? `${filteredRecords.length} of ${records.length} Records`
                            : `${records.length} Records`}
                    </span>
                </div>

                {/* FILTER & SORT OPTIONS */}
                <Filter
                    sortType={sortType}
                    onSortChange={setSortType}
                    filterCriteria={filterCriteria}
                    onFilterChange={setFilterCriteria}
                />

                {/* FINANCIAL METRICS CHIPS */}
                <div className={styles.metricsGroup}>
                    <div className={styles.metricChip}>
                        <span className={styles.metricLabel}>Income:</span>
                        <span className={styles.metricIncome}>+{formatCurrency(totalIncome)}</span>
                    </div>

                    <div className={styles.metricChip}>
                        <span className={styles.metricLabel}>Expense:</span>
                        <span className={styles.metricExpense}>-{formatCurrency(totalExpense)}</span>
                    </div>

                    <div className={styles.metricChip}>
                        <span className={styles.metricLabel}>Balance:</span>
                        <span
                            className={
                                netBalance >= 0 ? styles.metricBalancePositive : styles.metricBalanceNegative
                            }
                        >
                            {netBalance >= 0 ? "+" : "-"}
                            {formatCurrency(netBalance)}
                        </span>
                    </div>
                </div>
            </div>

            {/* SCROLLABLE TABLE CONTAINER */}
            <div className={styles.tableScrollWrapper}>
                <table className={styles.tableContainer}>
                    <thead className={styles.tableHeader}>
                        <tr>
                            {TABLE_HEADERS.map((header) => (
                                <th key={header.id} className={styles.tableHeaderItem}>
                                    <header.icon className={styles.tableHeaderIcon} />
                                    <span className={styles.tableHeaderText}>
                                        {header.label}
                                    </span>
                                </th>
                            ))}
                            {/* Actions Column Header */}
                            <th className={`${styles.tableHeaderItem} ${styles.tableHeaderAction}`}>
                                <span>Actions</span>
                            </th>
                        </tr>
                    </thead>

                    <tbody className={styles.tableBody}>
                        {/* INLINE DRAFT ROW WHEN ADDING */}
                        {isAddingRow && (
                            <TableRow
                                isNew={true}
                                onSaveNew={handleSaveNewRecord}
                                onCancelNew={() => setIsAddingRow(false)}
                            />
                        )}

                        {/* EXISTING ROWS (FILTERED & SORTED) */}
                        {displayedRecords.map((item) => (
                            <TableRow
                                key={item.id}
                                item={item}
                                onUpdate={handleUpdateRecord}
                                onDelete={handleDeleteRecord}
                            />
                        ))}
                    </tbody>
                </table>

                {/* LOADING STATE */}
                {isLoading && (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner} />
                        <span>Loading transactions...</span>
                    </div>
                )}

                {/* EMPTY STATE - NO RECORDS IN FIRESTORE */}
                {!isLoading && records.length === 0 && !isAddingRow && (
                    <div className={styles.emptyState}>
                        <MdAccountBalanceWallet className={styles.emptyIcon} />
                        <h4>No financial records</h4>
                        <p>
                            {user
                                ? "Keep track of all your income, expenses, and cash flow by adding your first row below."
                                : "Please sign in to view and manage your financial records."}
                        </p>
                    </div>
                )}

                {/* EMPTY STATE - NO RECORDS MATCH ACTIVE FILTER */}
                {!isLoading && records.length > 0 && displayedRecords.length === 0 && !isAddingRow && (
                    <div className={styles.emptyState}>
                        <MdAccountBalanceWallet className={styles.emptyIcon} />
                        <h4>No matching records</h4>
                        <p>No transactions match your current filter criteria.</p>
                        <button
                            type="button"
                            className={styles.clearFilterEmptyBtn}
                            onClick={() => setFilterCriteria({ field: "", operator: "", value: "" })}
                        >
                            Clear Filter
                        </button>
                    </div>
                )}
            </div>

            {/* FOOTER AREA WITH ADD BUTTON */}
            <div className={styles.footerArea}>
                <AddTableRowButton
                    onClick={() => setIsAddingRow(true)}
                    isAddingRow={isAddingRow}
                />
            </div>
        </BaseCard>
    );
};

export default FinanceTableCard;