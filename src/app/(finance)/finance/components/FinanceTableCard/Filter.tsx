"use client";

import React from "react";
import { MdSort, MdFilterAlt, MdClose } from "react-icons/md";
import { FaChevronDown } from "react-icons/fa";
import { FinanceItem } from "@/lib/fireabase/financeService";
import CustomDatePicker from "@/components/ui/CustomDatePicker/CustomDatePicker";
import styles from "./FinanceTableCard.module.css";

export interface SortOption {
    value: string;
    label: string;
}

export const SORT_OPTIONS: SortOption[] = [
    { value: "dateUp", label: "Date: Newest first" },
    { value: "dateDown", label: "Date: Oldest first" },
    { value: "incomeHigh", label: "Income: Highest first" },
    { value: "incomeLow", label: "Income: Lowest first" },
    { value: "expenseHigh", label: "Expense: Highest first" },
    { value: "expenseLow", label: "Expense: Lowest first" },
];

export interface FilterCriteria {
    field: string;
    operator: string;
    value: string;
}

export interface FilterFieldConfig {
    id: string;
    label: string;
    type: "number" | "date" | "select" | "text";
    options?: string[];
}

export interface FilterOperatorConfig {
    value: string;
    label: string;
}

export const FILTER_FIELDS: FilterFieldConfig[] = [
    { id: "income", label: "Income", type: "number" },
    { id: "expense", label: "Expense", type: "number" },
    { id: "summary", label: "Summary", type: "number" },
    { id: "date", label: "Date", type: "date" },
    { id: "catagory", label: "Category", type: "select", options: ["Project", "Tunay Salary", "Gökcan Salary", "Payment"] },
    { id: "transactionType", label: "Transaction Type", type: "select", options: ["Income", "Expense"] },
    { id: "status", label: "Status", type: "select", options: ["Completed", "Pending", "Cancelled"] },
    { id: "paymentMethod", label: "Payment Method", type: "select", options: ["Bank Transfer", "Credit Card", "Cash"] },
    { id: "explanation", label: "Explanation", type: "text" },
];

export const OPERATORS_BY_TYPE: Record<string, FilterOperatorConfig[]> = {
    number: [
        { value: "greaterThan", label: "Bigger than (>)" },
        { value: "lessThan", label: "Smaller than (<)" },
        { value: "greaterThanOrEqual", label: "At least (≥)" },
        { value: "lessThanOrEqual", label: "At most (≤)" },
        { value: "equals", label: "Equal to (=)" },
    ],
    date: [
        { value: "after", label: "After date" },
        { value: "before", label: "Before date" },
        { value: "equals", label: "On date" },
    ],
    select: [
        { value: "equals", label: "Is" },
        { value: "notEquals", label: "Is not" },
    ],
    text: [
        { value: "contains", label: "Contains" },
        { value: "equals", label: "Equals" },
        { value: "startsWith", label: "Starts with" },
        { value: "notEquals", label: "Does not equal" },
    ],
};

/**
 * Safely parse date string into timestamp (fallback 0 to prevent NaN comparison issues)
 */
const safeGetTime = (dateStr?: string): number => {
    if (!dateStr) return 0;
    const time = new Date(dateStr).getTime();
    return isNaN(time) ? 0 : time;
};

/**
 * Pure function to sort finance records immutably
 */
export const sortFinanceRecords = (data: FinanceItem[], sortType: string): FinanceItem[] => {
    const copy = [...data];
    switch (sortType) {
        case "dateUp": // Newest first (descending date)
            return copy.sort((a, b) => safeGetTime(b.date) - safeGetTime(a.date));
        case "dateDown": // Oldest first (ascending date)
            return copy.sort((a, b) => safeGetTime(a.date) - safeGetTime(b.date));
        case "incomeHigh":
            return copy.sort((a, b) => {
                const diff = (Number(b.income) || 0) - (Number(a.income) || 0);
                return diff !== 0 ? diff : safeGetTime(b.date) - safeGetTime(a.date);
            });
        case "incomeLow":
            return copy.sort((a, b) => {
                const diff = (Number(a.income) || 0) - (Number(b.income) || 0);
                return diff !== 0 ? diff : safeGetTime(b.date) - safeGetTime(a.date);
            });
        case "expenseHigh":
            return copy.sort((a, b) => {
                const diff = (Number(b.expense) || 0) - (Number(a.expense) || 0);
                return diff !== 0 ? diff : safeGetTime(b.date) - safeGetTime(a.date);
            });
        case "expenseLow":
            return copy.sort((a, b) => {
                const diff = (Number(a.expense) || 0) - (Number(b.expense) || 0);
                return diff !== 0 ? diff : safeGetTime(b.date) - safeGetTime(a.date);
            });
        default:
            return copy;
    }
};

/**
 * Pure function to filter finance records by criteria
 */
export const filterFinanceRecords = (
    data: FinanceItem[],
    criteria: FilterCriteria
): FinanceItem[] => {
    const { field, operator, value } = criteria;
    if (!field || !operator || value === undefined || value === "") {
        return data;
    }

    const fieldConfig = FILTER_FIELDS.find((f) => f.id === field);
    if (!fieldConfig) return data;

    return data.filter((item) => {
        if (fieldConfig.type === "number") {
            const numVal = parseFloat(value);
            if (isNaN(numVal)) return true;

            const itemVal = Number((item as Record<string, any>)[field]) || 0;
            switch (operator) {
                case "greaterThan":
                    return itemVal > numVal;
                case "lessThan":
                    return itemVal < numVal;
                case "greaterThanOrEqual":
                    return itemVal >= numVal;
                case "lessThanOrEqual":
                    return itemVal <= numVal;
                case "equals":
                    return itemVal === numVal;
                default:
                    return true;
            }
        }

        if (fieldConfig.type === "date") {
            if (!item.date || !value) return true;
            switch (operator) {
                case "equals":
                    return item.date === value;
                case "after":
                    return item.date > value;
                case "before":
                    return item.date < value;
                default:
                    return true;
            }
        }

        if (fieldConfig.type === "select" || fieldConfig.type === "text") {
            const rawVal = (item as Record<string, any>)[field];
            const itemStr = rawVal ? String(rawVal).toLowerCase().trim() : "";
            const targetStr = value.toLowerCase().trim();

            switch (operator) {
                case "equals":
                    return itemStr === targetStr;
                case "notEquals":
                    return itemStr !== targetStr;
                case "contains":
                    return itemStr.includes(targetStr);
                case "startsWith":
                    return itemStr.startsWith(targetStr);
                default:
                    return true;
            }
        }

        return true;
    });
};

interface FilterProps {
    sortType: string;
    onSortChange: (sortType: string) => void;
    filterCriteria: FilterCriteria;
    onFilterChange: (criteria: FilterCriteria) => void;
}

const Filter: React.FC<FilterProps> = ({
    sortType,
    onSortChange,
    filterCriteria,
    onFilterChange,
}) => {
    const selectedFieldConfig = FILTER_FIELDS.find((f) => f.id === filterCriteria.field);
    const availableOperators = selectedFieldConfig
        ? OPERATORS_BY_TYPE[selectedFieldConfig.type] || []
        : [];

    const isStep2Enabled = Boolean(filterCriteria.field);
    const isStep3Enabled = Boolean(filterCriteria.field && filterCriteria.operator);
    const isFilterActive = Boolean(
        filterCriteria.field || filterCriteria.operator || filterCriteria.value
    );

    const handleFieldChange = (newField: string) => {
        onFilterChange({ field: newField, operator: "", value: "" });
    };

    const handleOperatorChange = (newOperator: string) => {
        onFilterChange({ ...filterCriteria, operator: newOperator, value: "" });
    };

    const handleValueChange = (newValue: string) => {
        onFilterChange({ ...filterCriteria, value: newValue });
    };

    const handleClear = () => {
        onFilterChange({ field: "", operator: "", value: "" });
    };

    const renderValueInput = () => {
        if (!isStep3Enabled) {
            return (
                <div className={`${styles.filterInputWrapper} ${styles.filterDisabled}`}>
                    <input
                        type="text"
                        placeholder="Value..."
                        disabled
                        className={styles.filterTextInput}
                    />
                </div>
            );
        }

        if (selectedFieldConfig?.type === "date") {
            return (
                <div className={styles.filterDatePickerWrapper}>
                    <CustomDatePicker
                        value={filterCriteria.value}
                        onChange={handleValueChange}
                        compact={true}
                    />
                </div>
            );
        }

        if (selectedFieldConfig?.type === "number") {
            return (
                <div className={styles.filterCurrencyWrapper}>
                    <span className={styles.filterCurrencySymbol}>₺</span>
                    <input
                        type="number"
                        placeholder="e.g. 30000"
                        value={filterCriteria.value}
                        onChange={(e) => handleValueChange(e.target.value)}
                        className={styles.filterNumberInput}
                        step="any"
                    />
                </div>
            );
        }

        if (selectedFieldConfig?.type === "select") {
            return (
                <div className={styles.filterSelectWrapper}>
                    <select
                        value={filterCriteria.value}
                        onChange={(e) => handleValueChange(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="">Select option...</option>
                        {selectedFieldConfig.options?.map((opt) => (
                            <option key={opt} value={opt} className={styles.sortOption}>
                                {opt}
                            </option>
                        ))}
                    </select>
                    <FaChevronDown className={styles.sortChevron} />
                </div>
            );
        }

        return (
            <div className={styles.filterInputWrapper}>
                <input
                    type="text"
                    placeholder="Enter keyword..."
                    value={filterCriteria.value}
                    onChange={(e) => handleValueChange(e.target.value)}
                    className={styles.filterTextInput}
                />
            </div>
        );
    };

    return (
        <div className={styles.filterMainContainer}>
            {/* SEQUENTIAL 3-STEP FILTER TOOLBAR */}
            <div className={styles.filterContainer}>
                <div className={styles.filterLabelWrapper}>
                    <MdFilterAlt className={styles.filterIcon} />
                    <span className={styles.filterText}>Filter:</span>
                </div>

                {/* 1. Field Dropdown */}
                <div className={styles.filterSelectWrapper}>
                    <select
                        value={filterCriteria.field}
                        onChange={(e) => handleFieldChange(e.target.value)}
                        className={styles.filterSelect}
                        aria-label="Filter field"
                    >
                        <option value="">Select Field...</option>
                        {FILTER_FIELDS.map((f) => (
                            <option key={f.id} value={f.id} className={styles.sortOption}>
                                {f.label}
                            </option>
                        ))}
                    </select>
                    <FaChevronDown className={styles.sortChevron} />
                </div>

                {/* 2. Operator Dropdown */}
                <div
                    className={`${styles.filterSelectWrapper} ${
                        !isStep2Enabled ? styles.filterDisabled : ""
                    }`}
                >
                    <select
                        value={filterCriteria.operator}
                        onChange={(e) => handleOperatorChange(e.target.value)}
                        disabled={!isStep2Enabled}
                        className={styles.filterSelect}
                        aria-label="Filter operator"
                    >
                        <option value="">
                            {isStep2Enabled ? "Select Operator..." : "Operator..."}
                        </option>
                        {availableOperators.map((op) => (
                            <option key={op.value} value={op.value} className={styles.sortOption}>
                                {op.label}
                            </option>
                        ))}
                    </select>
                    <FaChevronDown className={styles.sortChevron} />
                </div>

                {/* 3. Value Input */}
                <div className={styles.filterValueContainer}>{renderValueInput()}</div>

                {/* Clear Button */}
                {isFilterActive && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className={styles.filterClearBtn}
                        title="Clear filter"
                        aria-label="Clear filter"
                    >
                        <MdClose />
                        <span>Clear</span>
                    </button>
                )}
            </div>

            {/* SORT CONTROLS */}
            <div className={styles.sortContainer}>
                <MdSort className={styles.sortIcon} />
                <span className={styles.sortText}>Sort by:</span>
                <div className={styles.sortSelectWrapper}>
                    <select
                        value={sortType}
                        onChange={(e) => onSortChange(e.target.value)}
                        className={styles.sortSelect}
                        aria-label="Sort transactions"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className={styles.sortOption}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <FaChevronDown className={styles.sortChevron} />
                </div>
            </div>
        </div>
    );
};

export default Filter;