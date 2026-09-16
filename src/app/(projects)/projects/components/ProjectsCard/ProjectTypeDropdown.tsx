"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";
import { MdDraw, MdViewInAr, MdHomeRepairService, MdCheck } from "react-icons/md";
import { ProjectType } from "@/lib/fireabase/projectService";
import styles from "./ProjectsCard.module.css";

export interface ProjectTypeOption {
    id: ProjectType;
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
}

export const PROJECT_TYPE_OPTIONS: ProjectTypeOption[] = [
    {
        id: "Renovation",
        label: "Renovation",
        icon: <MdHomeRepairService size={16} />,
        color: "#fb923c", // Soft Orange/Amber
        bg: "rgba(249, 115, 22, 0.12)",
        border: "rgba(249, 115, 22, 0.28)",
    },
    {
        id: "Drawing",
        label: "Drawing",
        icon: <MdDraw size={16} />,
        color: "#60a5fa", // Soft Blue
        bg: "rgba(59, 130, 246, 0.12)",
        border: "rgba(59, 130, 246, 0.28)",
    },
    {
        id: "Modelling",
        label: "Modelling",
        icon: <MdViewInAr size={16} />,
        color: "#c084fc", // Soft Purple
        bg: "rgba(168, 85, 247, 0.12)",
        border: "rgba(168, 85, 247, 0.28)",
    }
];

export const getProjectTypeConfig = (type?: ProjectType): ProjectTypeOption => {
    const found = PROJECT_TYPE_OPTIONS.find((opt) => opt.id === type);
    return found || PROJECT_TYPE_OPTIONS[0]; // default to Renovation
};

interface ProjectTypeDropdownProps {
    value: ProjectType;
    onChange: (type: ProjectType) => void;
    disabled?: boolean;
    className?: string;
}

const ProjectTypeDropdown: React.FC<ProjectTypeDropdownProps> = ({
    value,
    onChange,
    disabled = false,
    className = "",
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentConfig = getProjectTypeConfig(value);

    // Close dropdown when clicking outside
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

    const handleSelect = (typeId: ProjectType) => {
        onChange(typeId);
        setIsOpen(false);
    };

    return (
        <div
            className={`${styles.typeDropdownContainer} ${className}`}
            ref={containerRef}
        >
            {/* TRIGGER BUTTON */}
            <button
                type="button"
                className={`${styles.typeDropdownTrigger} ${isOpen ? styles.typeDropdownTriggerActive : ""}`}
                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                disabled={disabled}
                aria-label="Select project type"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className={styles.typeTriggerLeft}>
                    <span
                        className={styles.typeTriggerIcon}
                        style={{ color: currentConfig.color }}
                    >
                        {currentConfig.icon}
                    </span>
                    <span className={styles.typeTriggerText}>{currentConfig.label}</span>
                </div>
                <FaChevronDown
                    className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ""}`}
                />
            </button>

            {/* DROPDOWN MENU */}
            {isOpen && (
                <div
                    className={styles.typeDropdownMenu}
                    role="listbox"
                    aria-label="Project types"
                >
                    {PROJECT_TYPE_OPTIONS.map((option) => {
                        const isSelected = option.id === value;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                className={`${styles.typeOptionItem} ${isSelected ? styles.typeOptionSelected : ""
                                    }`}
                                onClick={() => handleSelect(option.id)}
                            >
                                <div className={styles.typeOptionInfo}>
                                    <span
                                        className={styles.typeOptionIcon}
                                        style={{ color: option.color }}
                                    >
                                        {option.icon}
                                    </span>
                                    <span className={styles.typeOptionLabel}>
                                        {option.label}
                                    </span>
                                </div>
                                {isSelected && (
                                    <MdCheck
                                        className={styles.typeOptionCheck}
                                        style={{ color: option.color }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ProjectTypeDropdown;
