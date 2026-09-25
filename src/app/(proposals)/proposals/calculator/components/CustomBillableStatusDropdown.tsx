"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";
import { MdCheck, MdClose } from "react-icons/md";
import styles from "./CustomDropdowns.module.css";

interface CustomBillableStatusDropdownProps {
    value: boolean;
    onChange: (value: boolean) => void;
    compact?: boolean;
    disabled?: boolean;
    className?: string;
}

export default function CustomBillableStatusDropdown({
    value,
    onChange,
    compact = true,
    disabled = false,
    className = "",
}: CustomBillableStatusDropdownProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [openUpwards, setOpenUpwards] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

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
        if (disabled) return;
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setOpenUpwards(spaceBelow < 180 && rect.top > 180);
        }
        setIsOpen((prev) => !prev);
    };

    const handleSelect = (val: boolean) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className={`${styles.dropdownContainer} ${className}`} ref={containerRef} style={{ minWidth: "170px" }}>
            {/* TRIGGER BUTTON */}
            <button
                type="button"
                className={`${styles.dropdownTrigger} ${compact ? styles.compactTrigger : ""} ${
                    isOpen ? styles.dropdownTriggerActive : ""
                }`}
                onClick={handleToggle}
                disabled={disabled}
                aria-label="Select billing status"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className={styles.triggerLeft}>
                    {value ? (
                        <span className={styles.statusBadgeBillable}>
                            <MdCheck size={12} />
                            Faturalı (Şirketli)
                        </span>
                    ) : (
                        <span className={styles.statusBadgeNonBillable}>
                            <MdClose size={12} />
                            Faturasız (Şirketsiz)
                        </span>
                    )}
                </div>
                <FaChevronDown className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ""}`} />
            </button>

            {/* FLOATING MENU */}
            {isOpen && (
                <div
                    className={`${styles.dropdownMenu} ${openUpwards ? styles.dropdownUpwards : ""}`}
                    role="listbox"
                    aria-label="Faturalandırma Durumu"
                    style={{ minWidth: "210px" }}
                >
                    {/* OPTION 1: TRUE */}
                    <button
                        type="button"
                        role="option"
                        aria-selected={value === true}
                        className={`${styles.optionItem} ${value === true ? styles.optionSelected : ""}`}
                        onClick={() => handleSelect(true)}
                    >
                        <div className={styles.optionLeft}>
                            <div className={styles.optionTextWrapper}>
                                <span className={styles.statusBadgeBillable} style={{ width: "fit-content" }}>
                                    <MdCheck size={12} />
                                    Faturalı (Şirketi Var)
                                </span>
                                <span className={styles.optionSubtitle}>
                                    Fatura kesilebilir, şirketi mevcut
                                </span>
                            </div>
                        </div>
                        {value === true && <MdCheck className={styles.checkIcon} />}
                    </button>

                    {/* OPTION 2: FALSE */}
                    <button
                        type="button"
                        role="option"
                        aria-selected={value === false}
                        className={`${styles.optionItem} ${value === false ? styles.optionSelected : ""}`}
                        onClick={() => handleSelect(false)}
                    >
                        <div className={styles.optionLeft}>
                            <div className={styles.optionTextWrapper}>
                                <span className={styles.statusBadgeNonBillable} style={{ width: "fit-content" }}>
                                    <MdClose size={12} />
                                    Faturasız (Şirketi Yok)
                                </span>
                                <span className={styles.optionSubtitle}>
                                    Fatura kesilemez, şahıs / taşeron
                                </span>
                            </div>
                        </div>
                        {value === false && <MdCheck className={styles.checkIcon} />}
                    </button>
                </div>
            )}
        </div>
    );
}
