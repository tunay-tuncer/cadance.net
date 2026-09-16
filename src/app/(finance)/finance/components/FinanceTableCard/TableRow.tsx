"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { format, parseISO } from "date-fns";
import {
    ProjectItem,
    subscribeToUserProjects
} from "@/lib/fireabase/projectService";
import {
    MdEdit,
    MdDelete,
    MdCheck,
    MdClose,
    MdTrendingUp,
    MdTrendingDown,
} from "react-icons/md";
import { FaChevronDown } from "react-icons/fa";
import CustomDatePicker from "@/components/ui/CustomDatePicker/CustomDatePicker";
import { FinanceItem, NewFinanceInput } from "@/lib/fireabase/financeService";
import styles from "./FinanceTableCard.module.css";

interface TableRowProps {
    item?: FinanceItem;
    isNew?: boolean;
    onSaveNew?: (record: NewFinanceInput) => Promise<void>;
    onCancelNew?: () => void;
    onUpdate?: (id: string, updates: Partial<NewFinanceInput>) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}

const formatCurrency = (amount: number): string => {
    const absFormatted = Math.abs(Math.round(amount)).toLocaleString("tr-TR");
    return `₺${absFormatted}`;
};

const TableRow: React.FC<TableRowProps> = ({
    item,
    isNew = false,
    onSaveNew,
    onCancelNew,
    onUpdate,
    onDelete,
}) => {
    const [isEditing, setIsEditing] = useState<boolean>(isNew);

    // Form states
    const [date, setDate] = useState<string>(
        item?.date || format(new Date(), "yyyy-MM-dd")
    );
    const [transactionType, setTransactionType] = useState<string>(
        item?.transactionType || "Income"
    );
    const [catagory, setCatagory] = useState<string>(item?.catagory || "Project");
    const { user } = useAuth();
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [loading, setLoading] = useState<boolean>(Boolean(user?.uid));
    const [explanation, setExplanation] = useState<string>(
        item?.explanation || ""
    );
    const [income, setIncome] = useState<string>(
        item ? item.income.toString() : "0"
    );
    const [expense, setExpense] = useState<string>(
        item ? item.expense.toString() : "0"
    );
    const [paymentMethod, setPaymentMethod] = useState<string>(
        item?.paymentMethod || "Bank Transfer"
    );
    const [status, setStatus] = useState<string>(item?.status || "Completed");
    const [saving, setSaving] = useState<boolean>(false);

    // Calculate dynamic summary during editing
    const currentSummary = (Number(income) || 0) - (Number(expense) || 0);

    useEffect(() => {
        if (!user?.uid) return;

        const unsubscribe = subscribeToUserProjects(user.uid, (fetchedProjects) => {
            setProjects(fetchedProjects);
            setLoading(false);
            if (isNew && fetchedProjects.length > 0) {
                setExplanation((prev) => (!prev ? fetchedProjects[0].name : prev));
            }
        });

        return () => unsubscribe();
    }, [user?.uid, isNew]);


    const handleSave = async () => {
        setSaving(true);
        try {
            const matchedProject =
                catagory === "Project"
                    ? projects.find((p) => p.name.trim().toLowerCase() === explanation.trim().toLowerCase())
                    : null;

            const payload: NewFinanceInput = {
                date: date || format(new Date(), "yyyy-MM-dd"),
                transactionType,
                catagory: catagory.trim() || "General",
                explanation: explanation.trim(),
                income: Number(income) || 0,
                expense: Number(expense) || 0,
                paymentMethod,
                status,
                summary: currentSummary,
                projectId: matchedProject?.id || "",
            };

            if (isNew && onSaveNew) {
                await onSaveNew(payload);
            } else if (item && onUpdate) {
                await onUpdate(item.id, payload);
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Error saving finance row:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (isNew && onCancelNew) {
            onCancelNew();
        } else if (item) {
            setDate(item.date);
            setTransactionType(item.transactionType);
            setCatagory(item.catagory);
            setExplanation(item.explanation);
            setIncome(item.income.toString());
            setExpense(item.expense.toString());
            setPaymentMethod(item.paymentMethod);
            setStatus(item.status);
            setIsEditing(false);
        }
    };

    const formattedDate = (() => {
        if (!item?.date) return "-";
        try {
            return format(parseISO(item.date), "MMM d, yyyy");
        } catch {
            return item.date;
        }
    })();

    // Status pill style helper
    const getStatusClass = (statusStr: string) => {
        const lower = statusStr.toLowerCase();
        if (lower === "completed") return styles.statusCompleted;
        if (lower === "pending") return styles.statusPending;
        if (lower === "cancelled" || lower === "failed") return styles.statusCancelled;
        return styles.statusDefault;
    };

    // Type pill style helper
    const getTypeClass = (typeStr: string) => {
        const lower = typeStr.toLowerCase();
        if (lower === "income") return styles.typeIncome;
        if (lower === "expense") return styles.typeExpense;
        return styles.typeDefault;
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCat = e.target.value;
        setCatagory(newCat);
        if (newCat === "Project") {
            const matchesProject = projects.some((p) => p.name === explanation);
            if (!matchesProject && projects.length > 0) {
                setExplanation(projects[0].name);
            }
        } else {
            const matchesProject = projects.some((p) => p.name === explanation);
            if (matchesProject) {
                setExplanation("");
            }
        }
    };

    // EDIT / NEW ROW VIEW
    if (isEditing) {
        return (
            <tr className={`${styles.tableRow} ${styles.tableRowEditing} ${isNew ? styles.tableRowNew : ""}`}>
                {/* 1. Date */}
                <td className={styles.tableRowItem}>
                    <CustomDatePicker
                        value={date}
                        onChange={setDate}
                        compact={true}
                    />
                </td>

                {/* 2. Transaction Type */}
                <td className={styles.tableRowItem}>
                    <div className={styles.rowSelectWrapper}>
                        <select
                            className={`${styles.rowSelect} ${transactionType === "Income" ? styles.selectIncome : styles.selectExpense
                                }`}
                            value={transactionType}
                            onChange={(e) => setTransactionType(e.target.value)}
                            disabled={saving}
                        >
                            <option value="Income">▲ Income</option>
                            <option value="Expense">▼ Expense</option>
                        </select>
                        <FaChevronDown className={styles.selectChevron} />
                    </div>
                </td>

                {/* 3. Catagory */}
                <td className={styles.tableRowItem}>
                    <div className={styles.rowSelectWrapper}>
                        <select
                            className={styles.rowSelect}
                            value={catagory}
                            onChange={handleCategoryChange}
                            disabled={saving}
                        >
                            <option value="Project">Project</option>
                            <option value="Tunay Salary">Tunay Salary</option>
                            <option value="Gökcan Salary">Gökcan Salary</option>
                            <option value="Payment">Payment</option>
                            {/* If existing item has a different custom category, keep it */}
                            {catagory &&
                                !["Project", "Tunay Salary", "TunaySalary", "Gökcan Salary", "GökcanSalary", "Payment"].includes(
                                    catagory
                                ) && <option value={catagory}>{catagory}</option>}
                        </select>
                        <FaChevronDown className={styles.selectChevron} />
                    </div>
                </td>

                {/* 4. Explanation */}
                <td className={styles.tableRowItem}>
                    {catagory === "Project" ? (
                        <div className={styles.rowSelectWrapper}>
                            <select
                                className={styles.rowSelect}
                                value={explanation}
                                onChange={(e) => setExplanation(e.target.value)}
                                disabled={saving || projects.length === 0}
                            >
                                {projects.length === 0 ? (
                                    <option value="">No projects available</option>
                                ) : (
                                    <>
                                        {!projects.some((p) => p.name === explanation) && (
                                            <option value="" disabled>
                                                Select a project...
                                            </option>
                                        )}
                                        {projects.map((proj) => (
                                            <option key={proj.id} value={proj.name}>
                                                {proj.name} ({proj.type})
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                            <FaChevronDown className={styles.selectChevron} />
                        </div>
                    ) : (
                        <input
                            type="text"
                            placeholder="Description..."
                            className={styles.rowInput}
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                            disabled={saving}
                        />
                    )}
                </td>

                {/* 5. Income */}
                <td className={styles.tableRowItem}>
                    <div className={styles.currencyInputWrapper}>
                        <span className={styles.currencySymbol}>₺</span>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            className={styles.subInputWithSymbol}
                            value={income}
                            onChange={(e) => setIncome(e.target.value)}
                            disabled={saving}
                        />
                    </div>
                </td>

                {/* 6. Expense */}
                <td className={styles.tableRowItem}>
                    <div className={styles.currencyInputWrapper}>
                        <span className={styles.currencySymbol}>₺</span>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            className={styles.subInputWithSymbol}
                            value={expense}
                            onChange={(e) => setExpense(e.target.value)}
                            disabled={saving}
                        />
                    </div>
                </td>

                {/* 7. Payment Method */}
                <td className={styles.tableRowItem}>
                    <div className={styles.rowSelectWrapper}>
                        <select
                            className={styles.rowSelect}
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            disabled={saving}
                        >
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Cash">Cash</option>
                            <option value="EFT">EFT</option>
                        </select>
                        <FaChevronDown className={styles.selectChevron} />
                    </div>
                </td>

                {/* 8. Status */}
                <td className={styles.tableRowItem}>
                    <div className={styles.rowSelectWrapper}>
                        <select
                            className={`${styles.rowSelect} ${status === "Completed"
                                ? styles.selectCompleted
                                : status === "Pending"
                                    ? styles.selectPending
                                    : styles.selectCancelled
                                }`}
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            disabled={saving}
                        >
                            <option value="Completed">● Completed</option>
                            <option value="Pending">● Pending</option>
                            <option value="Cancelled">● Cancelled</option>
                        </select>
                        <FaChevronDown className={styles.selectChevron} />
                    </div>
                </td>

                {/* 9. Summary (live preview) */}
                <td className={styles.tableRowItem}>
                    <span
                        className={`${styles.summaryText} ${currentSummary >= 0 ? styles.summaryPositive : styles.summaryNegative
                            }`}
                    >
                        {currentSummary >= 0 ? "+" : "-"}
                        {formatCurrency(currentSummary)}
                    </span>
                </td>

                {/* 10. Actions */}
                <td className={`${styles.tableRowItem} ${styles.tableRowActions}`}>
                    <div className={styles.actionButtonGroup}>
                        <button
                            type="button"
                            className={styles.actionSaveBtn}
                            onClick={handleSave}
                            disabled={saving}
                            title="Save"
                            aria-label="Save row"
                        >
                            <MdCheck />
                        </button>
                        <button
                            type="button"
                            className={styles.actionCancelBtn}
                            onClick={handleCancel}
                            disabled={saving}
                            title="Cancel"
                            aria-label="Cancel editing"
                        >
                            <MdClose />
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    if (!item) return null;

    const isPositiveSummary = item.summary >= 0;

    // READ-ONLY VIEW ROW
    return (
        <tr className={styles.tableRow}>
            {/* 1. Date */}
            <td className={styles.tableRowItem}>
                <span className={styles.tableRowText} title={item.date}>
                    {formattedDate}
                </span>
            </td>

            {/* 2. Transaction Type */}
            <td className={styles.tableRowItem}>
                <span className={`${styles.typeBadge} ${getTypeClass(item.transactionType)}`}>
                    {item.transactionType.toLowerCase() === "income" ? (
                        <MdTrendingUp className={styles.typeBadgeIcon} />
                    ) : (
                        <MdTrendingDown className={styles.typeBadgeIcon} />
                    )}
                    <span>{item.transactionType}</span>
                </span>
            </td>

            {/* 3. Catagory */}
            <td className={styles.tableRowItem}>
                <span className={styles.categoryBadge}>
                    {item.catagory === "TunaySalary"
                        ? "Tunay Salary"
                        : item.catagory === "GökcanSalary"
                        ? "Gökcan Salary"
                        : item.catagory}
                </span>
            </td>

            {/* 4. Explanation */}
            <td className={styles.tableRowItem}>
                <span className={styles.explanationText} title={item.explanation}>
                    {item.explanation || <span className={styles.mutedPlaceholder}>No description</span>}
                </span>
            </td>

            {/* 5. Income */}
            <td className={styles.tableRowItem}>
                {item.income > 0 ? (
                    <span className={styles.incomeAmount}>+{formatCurrency(item.income)}</span>
                ) : (
                    <span className={styles.zeroAmount}>-</span>
                )}
            </td>

            {/* 6. Expense */}
            <td className={styles.tableRowItem}>
                {item.expense > 0 ? (
                    <span className={styles.expenseAmount}>-{formatCurrency(item.expense)}</span>
                ) : (
                    <span className={styles.zeroAmount}>-</span>
                )}
            </td>

            {/* 7. Payment Method */}
            <td className={styles.tableRowItem}>
                <span className={styles.paymentMethodBadge}>{item.paymentMethod}</span>
            </td>

            {/* 8. Status */}
            <td className={styles.tableRowItem}>
                <span className={`${styles.statusBadge} ${getStatusClass(item.status)}`}>
                    <span className={styles.statusDot} />
                    <span>{item.status}</span>
                </span>
            </td>

            {/* 9. Summary */}
            <td className={styles.tableRowItem}>
                <span
                    className={`${styles.summaryText} ${isPositiveSummary ? styles.summaryPositive : styles.summaryNegative
                        }`}
                >
                    {isPositiveSummary && item.summary > 0 ? "+" : ""}
                    {formatCurrency(item.summary)}
                </span>
            </td>

            {/* 10. Actions */}
            <td className={`${styles.tableRowItem} ${styles.tableRowActions}`}>
                <div className={styles.actionButtonGroup}>
                    <button
                        type="button"
                        className={styles.actionEditBtn}
                        onClick={() => setIsEditing(true)}
                        title="Edit record"
                        aria-label="Edit record"
                    >
                        <MdEdit />
                    </button>
                    <button
                        type="button"
                        className={styles.actionDeleteBtn}
                        onClick={() => onDelete && onDelete(item.id)}
                        title="Delete record"
                        aria-label="Delete record"
                    >
                        <MdDelete />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default TableRow;