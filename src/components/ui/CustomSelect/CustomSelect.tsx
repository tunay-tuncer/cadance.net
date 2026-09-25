'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import styles from './CustomSelect.module.css';

export interface SelectOption {
    value: string;
    label: string;
    subtext?: string;
}

export interface CustomSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: React.ReactNode;
    compact?: boolean;
    disabled?: boolean;
    className?: string;
    accentColor?: string;
}

export default function CustomSelect({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    icon,
    compact = false,
    disabled = false,
    className = '',
    accentColor,
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpwards, setOpenUpwards] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const toggleOpen = () => {
        if (disabled) return;
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setOpenUpwards(spaceBelow < 220 && rect.top > 220);
        }
        setIsOpen((prev) => !prev);
    };

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    const containerStyle = accentColor
        ? ({ '--accent': accentColor } as React.CSSProperties)
        : undefined;

    return (
        <div
            className={`${styles.customSelectContainer} ${className}`}
            ref={containerRef}
            style={containerStyle}
        >
            <button
                type="button"
                className={`${styles.selectTrigger} ${compact ? styles.compactTrigger : ''} ${
                    isOpen ? styles.selectTriggerActive : ''
                }`}
                onClick={toggleOpen}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <div className={styles.triggerLeft}>
                    {icon && <span className={styles.triggerIcon}>{icon}</span>}
                    <span className={styles.triggerText}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <FaChevronDown
                    className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ''}`}
                />
            </button>

            {isOpen && (
                <div
                    className={`${styles.dropdownMenu} ${
                        openUpwards ? styles.dropdownUpwards : ''
                    }`}
                    role="listbox"
                >
                    {options.map((option) => {
                        const isSelected = option.value === value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                className={`${styles.optionItem} ${
                                    isSelected ? styles.optionSelected : ''
                                }`}
                                onClick={() => handleSelect(option.value)}
                                role="option"
                                aria-selected={isSelected}
                            >
                                <div className={styles.optionLeft}>
                                    <span className={styles.optionLabel}>{option.label}</span>
                                    {option.subtext && (
                                        <span className={styles.optionSubtext}>
                                            {option.subtext}
                                        </span>
                                    )}
                                </div>
                                {isSelected && <FaCheck className={styles.checkIcon} />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
