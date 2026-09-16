"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO,
} from "date-fns";
import { FaChevronLeft, FaChevronRight, FaChevronDown } from "react-icons/fa";
import { MdCalendarToday } from "react-icons/md";
import styles from "./CustomDatePicker.module.css";

export interface CustomDatePickerProps {
    value: string; // 'yyyy-MM-dd'
    onChange: (date: string) => void;
    compact?: boolean;
    className?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
    value,
    onChange,
    compact = false,
    className = "",
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const parseValueToDate = (val: string) => {
        try {
            return val ? parseISO(val) : new Date();
        } catch {
            return new Date();
        }
    };

    const [currentMonth, setCurrentMonth] = useState<Date>(() => parseValueToDate(value));

    // Close on click outside
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

    // Calendar grid calculations
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const [openUpwards, setOpenUpwards] = useState<boolean>(false);

    const toggleOpen = () => {
        if (!isOpen) {
            setCurrentMonth(parseValueToDate(value));
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                setOpenUpwards(spaceBelow < 290 && rect.top > 290);
            }
        }
        setIsOpen((prev) => !prev);
    };

    const nextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const prevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const goToToday = (e: React.MouseEvent) => {
        e.stopPropagation();
        const today = new Date();
        setCurrentMonth(today);
        onChange(format(today, "yyyy-MM-dd"));
        setIsOpen(false);
    };

    const handleDayClick = (day: Date) => {
        onChange(format(day, "yyyy-MM-dd"));
        setIsOpen(false);
    };

    const formattedDisplayDate = (() => {
        try {
            return format(parseISO(value), compact ? "dd/MM/yy" : "dd MMM yyyy");
        } catch {
            return value || "Select date";
        }
    })();

    const selectedDateObj = (() => {
        try {
            return parseISO(value);
        } catch {
            return null;
        }
    })();

    return (
        <div className={`${styles.customDatePickerContainer} ${className}`} ref={containerRef}>
            {/* TRIGGER BUTTON */}
            <button
                type="button"
                className={`${styles.customDateTrigger} ${compact ? styles.compactTrigger : ""} ${
                    isOpen ? styles.customDateTriggerActive : ""
                }`}
                onClick={toggleOpen}
                aria-label="Select date"
                aria-expanded={isOpen}
            >
                <div className={styles.dateTriggerLeft}>
                    <MdCalendarToday className={styles.calendarIcon} />
                    <span className={styles.dateTriggerText}>{formattedDisplayDate}</span>
                </div>
                <FaChevronDown
                    className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ""}`}
                />
            </button>

            {/* CUSTOM CALENDAR POPOVER */}
            {isOpen && (
                <div
                    className={`${styles.calendarDropdown} ${
                        openUpwards ? styles.dropdownUpwards : ""
                    }`}
                >
                    {/* Header: Month, Year, Today, Prev/Next buttons */}
                    <div className={styles.pickerHeader}>
                        <div className={styles.pickerTitleSection}>
                            <span className={styles.pickerMonthTitle}>
                                {format(currentMonth, "MMMM yyyy")}
                            </span>
                            <button
                                type="button"
                                onClick={goToToday}
                                className={styles.pickerTodayBtn}
                            >
                                Today
                            </button>
                        </div>

                        <div className={styles.pickerNavButtons}>
                            <button
                                type="button"
                                onClick={prevMonth}
                                className={styles.pickerNavBtn}
                                aria-label="Previous month"
                            >
                                <FaChevronLeft size={10} />
                            </button>
                            <button
                                type="button"
                                onClick={nextMonth}
                                className={styles.pickerNavBtn}
                                aria-label="Next month"
                            >
                                <FaChevronRight size={10} />
                            </button>
                        </div>
                    </div>

                    {/* Weekdays row: Mon Tue Wed Thu Fri Sat Sun */}
                    <div className={styles.pickerWeekdays}>
                        <span>Mo</span>
                        <span>Tu</span>
                        <span>We</span>
                        <span>Th</span>
                        <span>Fr</span>
                        <span>Sa</span>
                        <span>Su</span>
                    </div>

                    {/* Days grid */}
                    <div className={styles.pickerDaysGrid}>
                        {days.map((day) => {
                            const isSelected = selectedDateObj && isSameDay(day, selectedDateObj);
                            const isToday = isSameDay(day, new Date());
                            const isCurrentMonth = isSameMonth(day, currentMonth);

                            return (
                                <button
                                    key={day.toISOString()}
                                    type="button"
                                    onClick={() => handleDayClick(day)}
                                    className={`
                                        ${styles.pickerDayCell}
                                        ${!isCurrentMonth ? styles.pickerOtherMonthDay : ""}
                                        ${isSelected ? styles.pickerSelectedDay : ""}
                                        ${isToday && !isSelected ? styles.pickerTodayCell : ""}
                                    `}
                                >
                                    {format(day, "d")}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;
