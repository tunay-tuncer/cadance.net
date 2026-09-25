"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";
import { MdCheck, MdClose, MdLayers } from "react-icons/md";
import styles from "./CustomDropdowns.module.css";

export type BillableFilterType = "ALL" | "BILLABLE" | "NON_BILLABLE";

interface FilterOption {
    id: BillableFilterType;
    label: string;
    icon: React.ReactNode;
    color: string;
}

const FILTER_OPTIONS: FilterOption[] = [
    {
        id: "ALL",
        label: "Tüm Kalemler",
        icon: <MdLayers size={15} />,
        color: "#93c5fd",
    },
    {
        id: "BILLABLE",
        label: "Faturalı (Şirketi Var)",
        icon: <MdCheck size={15} />,
        color: "#4ade80",
    },
    {
        id: "NON_BILLABLE",
        label: "Faturasız (Şirketi Yok)",
        icon: <MdClose size={15} />,
        color: "#fbbf24",
    },
];

interface CustomBillableFilterDropdownProps {
    value: BillableFilterType;
    onChange: (val: BillableFilterType) => void;
    className?: string;
}

export default function CustomBillableFilterDropdown({
    value,
    onChange,
    className = "",
}: CustomBillableFilterDropdownProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [openUpwards, setOpenUpwards] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentOption = FILTER_OPTIONS.find((opt) => opt.id === value) || FILTER_OPTIONS[0];

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
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setOpenUpwards(spaceBelow < 220 && rect.top > 220);
        }
        setIsOpen((prev) => !prev);
    };

    const handleSelect = (optionId: BillableFilterType) => {
        onChange(optionId);
        setIsOpen(false);
    };

    return (
        <div className={`${styles.dropdownContainer} ${styles.filterDropdown} ${className}`} ref={containerRef}>
            {/* TRIGGER BUTTON */}
            <button
                type="button"
                className={`${styles.dropdownTrigger} ${isOpen ? styles.dropdownTriggerActive : ""}`}
                onClick={handleToggle}
                aria-label="Filter work items"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className={styles.triggerLeft}>
                    <span className={styles.triggerIcon} style={{ color: currentOption.color }}>
                        {currentOption.icon}
                    </span>
                    <span className={styles.triggerText}>{currentOption.label}</span>
                </div>
                <FaChevronDown className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ""}`} />
            </button>

            {/* FLOATING MENU */}
            {isOpen && (
                <div
                    className={`${styles.dropdownMenu} ${openUpwards ? styles.dropdownUpwards : ""}`}
                    role="listbox"
                    aria-label="Filtreleme seçenekleri"
                    style={{ minWidth: "180px", maxWidth: "min(320px, calc(100vw - 2rem))" }}
                >
                    {FILTER_OPTIONS.map((opt) => {
                        const isSelected = opt.id === value;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ""}`}
                                onClick={() => handleSelect(opt.id)}
                            >
                                <div className={styles.optionLeft}>
                                    <span className={styles.optionIcon} style={{ color: opt.color }}>
                                        {opt.icon}
                                    </span>
                                    <span className={styles.optionTitle}>{opt.label}</span>
                                </div>
                                {isSelected && <MdCheck className={styles.checkIcon} />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
