"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";
import { MdWorkOutline, MdCheck } from "react-icons/md";
import { ProjectItem, ProjectType } from "@/lib/fireabase/projectService";
import styles from "./CustomDropdowns.module.css";

interface CustomProjectDropdownProps {
    projects: ProjectItem[];
    selectedProjectId: string;
    onChange: (id: string) => void;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
}

const getTypeColor = (type?: ProjectType) => {
    switch (type) {
        case "Renovation":
            return { color: "#fb923c", bg: "rgba(249, 115, 22, 0.12)", border: "rgba(249, 115, 22, 0.28)" };
        case "Drawing":
            return { color: "#60a5fa", bg: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.28)" };
        case "Modelling":
            return { color: "#c084fc", bg: "rgba(168, 85, 247, 0.12)", border: "rgba(168, 85, 247, 0.28)" };
        default:
            return { color: "#a1a1aa", bg: "rgba(255, 255, 255, 0.08)", border: "rgba(255, 255, 255, 0.15)" };
    }
};

export default function CustomProjectDropdown({
    projects,
    selectedProjectId,
    onChange,
    disabled = false,
    loading = false,
    className = "",
}: CustomProjectDropdownProps) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [openUpwards, setOpenUpwards] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedProject = projects.find((p) => p.id === selectedProjectId);

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
        if (disabled || loading || projects.length === 0) return;
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setOpenUpwards(spaceBelow < 280 && rect.top > 280);
        }
        setIsOpen((prev) => !prev);
    };

    const handleSelect = (id: string) => {
        onChange(id);
        setIsOpen(false);
    };

    const typeConfig = getTypeColor(selectedProject?.type);

    return (
        <div className={`${styles.dropdownContainer} ${styles.projectDropdown} ${className}`} ref={containerRef}>
            {/* TRIGGER BUTTON */}
            <button
                type="button"
                className={`${styles.dropdownTrigger} ${isOpen ? styles.dropdownTriggerActive : ""}`}
                onClick={handleToggle}
                disabled={disabled || loading || projects.length === 0}
                aria-label="Select project"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className={styles.triggerLeft}>
                    <MdWorkOutline className={styles.triggerIcon} />
                    <span className={styles.triggerText}>
                        {loading
                            ? "Projeler yükleniyor..."
                            : projects.length === 0
                            ? "Proje bulunamadı"
                            : selectedProject
                            ? selectedProject.name
                            : "Proje seçiniz..."}
                    </span>
                    {selectedProject?.type && (
                        <span
                            className={styles.triggerBadge}
                            style={{
                                color: typeConfig.color,
                                background: typeConfig.bg,
                                border: `1px solid ${typeConfig.border}`,
                            }}
                        >
                            {selectedProject.type}
                        </span>
                    )}
                </div>
                <FaChevronDown className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ""}`} />
            </button>

            {/* FLOATING LISTBOX */}
            {isOpen && (
                <div
                    className={`${styles.dropdownMenu} ${openUpwards ? styles.dropdownUpwards : ""}`}
                    role="listbox"
                    aria-label="Projeler"
                    style={{ minWidth: "240px", maxWidth: "min(360px, calc(100vw - 2rem))" }}
                >
                    {projects.map((project) => {
                        const isSelected = project.id === selectedProjectId;
                        const itemType = getTypeColor(project.type);
                        return (
                            <button
                                key={project.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ""}`}
                                onClick={() => handleSelect(project.id)}
                            >
                                <div className={styles.optionLeft}>
                                    <MdWorkOutline
                                        className={styles.optionIcon}
                                        style={{ color: itemType.color }}
                                    />
                                    <div className={styles.optionTextWrapper}>
                                        <div className={styles.optionTitleRow}>
                                            <span className={styles.optionTitle}>{project.name}</span>
                                            {project.type && (
                                                <span
                                                    className={styles.triggerBadge}
                                                    style={{
                                                        color: itemType.color,
                                                        background: itemType.bg,
                                                        border: `1px solid ${itemType.border}`,
                                                    }}
                                                >
                                                    {project.type}
                                                </span>
                                            )}
                                        </div>
                                        {project.agreedPayment > 0 && (
                                            <span className={styles.optionSubtitle}>
                                                ₺{project.agreedPayment.toLocaleString("tr-TR")}
                                            </span>
                                        )}
                                    </div>
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
