"use client";

import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import {
    MdCheckCircle,
    MdRadioButtonUnchecked,
    MdDelete,
    MdEdit,
    MdCheck,
    MdClose,
} from "react-icons/md";
import { ProjectItem, ProjectType } from "@/lib/fireabase/projectService";
import ProjectTypeDropdown, { getProjectTypeConfig } from "./ProjectTypeDropdown";
import CustomDatePicker from "@/components/ui/CustomDatePicker/CustomDatePicker";
import styles from "./ProjectsCard.module.css";

interface ProjectItemCardProps {
    project: ProjectItem;
    onToggleComplete: (id: string, currentStatus: boolean) => void;
    onToggleBilled: (id: string, currentStatus: boolean) => void;
    onUpdate: (id: string, updates: Partial<ProjectItem>) => Promise<void>;
    onDelete: (id: string) => void;
}

const formatCurrency = (amount: number): string => {
    const isNegative = amount < 0;
    const absFormatted = Math.abs(Math.round(amount)).toLocaleString("tr-TR");
    return isNegative ? `-₺${absFormatted}` : `₺${absFormatted}`;
};

const ProjectItemCard: React.FC<ProjectItemCardProps> = ({
    project,
    onToggleComplete,
    onToggleBilled,
    onUpdate,
    onDelete,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editType, setEditType] = useState<ProjectType>(project.type || "Renovation");
    const [editAgreed, setEditAgreed] = useState(project.agreedPayment.toString());
    const [editStartDate, setEditStartDate] = useState(
        project.startDate || format(new Date(), "yyyy-MM-dd")
    );

    const typeConfig = getProjectTypeConfig(project.type);

    // If billed, invoice is automatically cut off: 20% of received amount
    const billedAmount = project.isBilled ? project.totalMoneyReceived * 0.2 : 0;
    const effectiveReceived = project.totalMoneyReceived - billedAmount;

    // Calculate completion percentage based on net received payment after invoice deduction vs agreed payment
    const completionPercentage = (() => {
        if (project.agreedPayment > 0) {
            return Math.round((project.totalMoneyReceived / project.agreedPayment) * 100);
        }
        return project.isComplete ? 100 : 0;
    })();

    // Total profit: effective received (after invoice cutoff) - spent
    const profit = effectiveReceived - project.totalMoneySpent;
    const isProfitable = profit >= 0;

    // Format start date safely
    const formattedStartDate = (() => {
        if (!project.startDate) return "No date";
        try {
            return format(parseISO(project.startDate), "MMM d, yyyy");
        } catch {
            return project.startDate;
        }
    })();

    const handleToggleEdit = () => {
        if (!isEditing) {
            setEditType(project.type || "Renovation");
            setEditAgreed(project.agreedPayment.toString());
            setEditStartDate(project.startDate || format(new Date(), "yyyy-MM-dd"));
        }
        setIsEditing(!isEditing);
    };

    const handleSaveEdit = async () => {
        await onUpdate(project.id, {
            type: editType,
            agreedPayment: Number(editAgreed) || 0,
            startDate: editStartDate,
        });
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditType(project.type || "Renovation");
        setEditAgreed(project.agreedPayment.toString());
        setEditStartDate(project.startDate || format(new Date(), "yyyy-MM-dd"));
        setIsEditing(false);
    };

    return (
        <li className={`${styles.projectCardItem} ${project.isComplete ? styles.projectComplete : ""}`}>
            {/* TOP ROW: isComplete button, Name, Type Badge, Start Date, Percentage, and Actions */}
            <div className={styles.projectTopRow}>
                <div className={styles.projectIdentity}>
                    <button
                        type="button"
                        className={styles.completeToggleButton}
                        onClick={() => onToggleComplete(project.id, project.isComplete)}
                        title={project.isComplete ? "Mark as active" : "Mark as complete"}
                        aria-label="Toggle complete"
                    >
                        {project.isComplete ? (
                            <MdCheckCircle className={`${styles.statusIcon} ${styles.statusCompleted}`} />
                        ) : (
                            <MdRadioButtonUnchecked className={styles.statusIcon} />
                        )}
                    </button>

                    <div className={styles.nameAndDate}>
                        <div className={styles.nameHeaderRow}>
                            <h4 className={`${styles.projectName} ${project.isComplete ? styles.strikeName : ""}`}>
                                {project.name}
                            </h4>
                            <span
                                className={styles.projectTypeBadge}
                                style={{
                                    color: typeConfig.color,
                                    backgroundColor: typeConfig.bg,
                                    borderColor: typeConfig.border,
                                }}
                                title={`Type: ${typeConfig.label}`}
                            >
                                <span className={styles.typeBadgeIcon}>{typeConfig.icon}</span>
                                <span>{typeConfig.label}</span>
                            </span>
                        </div>
                        <span className={styles.startDateBadge}>
                            Start: {formattedStartDate}
                        </span>
                    </div>
                </div>

                <div className={styles.topRightArea}>
                    {/* Percentage completion text based on payment received after invoice cutoff */}
                    <div className={styles.percentageWrapper}>
                        <span className={styles.percentageText}>
                            {completionPercentage}%
                        </span>
                        <span className={styles.percentageSubtext}>
                            {project.isBilled ? "net paid" : "paid"}
                        </span>
                    </div>

                    <div className={styles.itemActionButtons}>
                        <button
                            type="button"
                            className={styles.editButton}
                            onClick={handleToggleEdit}
                            title="Edit project"
                            aria-label="Edit project"
                        >
                            <MdEdit />
                        </button>
                        <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => onDelete(project.id)}
                            title="Delete project"
                            aria-label="Delete project"
                        >
                            <MdDelete />
                        </button>
                    </div>
                </div>
            </div>

            {/* PROGRESS BAR */}
            <div className={styles.progressBarContainer}>
                <div
                    className={`${styles.progressBarFill} ${project.isComplete ? styles.progressComplete : ""}`}
                    style={{ width: `${Math.min(Math.max(completionPercentage, 0), 100)}%` }}
                />
            </div>

            {/* QUICK EDIT INLINE DRAWER */}
            {isEditing && (
                <div className={styles.inlineEditArea}>
                    <div className={styles.editFieldsGrid}>
                        <div className={styles.editField}>
                            <label className={styles.editLabel}>Project Type</label>
                            <ProjectTypeDropdown value={editType} onChange={setEditType} />
                        </div>
                        <div className={styles.editField}>
                            <label className={styles.editLabel}>Start Date</label>
                            <CustomDatePicker value={editStartDate} onChange={setEditStartDate} />
                        </div>
                        <div className={styles.editField}>
                            <label className={styles.editLabel}>Agreed (₺)</label>
                            <div className={styles.currencyInputWrapper}>
                                <span className={styles.currencySymbol}>₺</span>
                                <input
                                    type="number"
                                    className={styles.subInputWithSymbol}
                                    value={editAgreed}
                                    onChange={(e) => setEditAgreed(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={styles.editButtonsRow}>
                        <button
                            type="button"
                            className={styles.saveEditBtn}
                            onClick={handleSaveEdit}
                        >
                            <MdCheck /> Save
                        </button>
                        <button
                            type="button"
                            className={styles.cancelEditBtn}
                            onClick={handleCancelEdit}
                        >
                            <MdClose /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* FINANCIAL STATS GRID: agreed payment, total received, [billed amount if billed], total spent, total profit, isBilled */}
            <div className={styles.financialStatsGrid}>
                <div className={styles.statBox}>
                    <span className={styles.statLabel}>Agreed</span>
                    <span className={styles.statValue}>{formatCurrency(project.agreedPayment)}</span>
                </div>

                <div className={styles.statBox}>
                    <span className={styles.statLabel}>Received</span>
                    <span className={`${styles.statValue} ${styles.statReceived}`}>
                        {formatCurrency(project.totalMoneyReceived)}
                    </span>
                </div>

                {/* Additional space if project is billed: billed amount = received * 0.2 */}
                {project.isBilled && (
                    <div className={`${styles.statBox} ${styles.billedAmountBox}`}>
                        <span className={styles.statLabel}>Billed (20%)</span>
                        <span className={`${styles.statValue} ${styles.statBilledCut}`}>
                            -{formatCurrency(billedAmount)}
                        </span>
                    </div>
                )}

                <div className={styles.statBox}>
                    <span className={styles.statLabel}>Spent</span>
                    <span className={`${styles.statValue} ${styles.statSpent}`}>
                        {formatCurrency(project.totalMoneySpent)}
                    </span>
                </div>

                <div className={styles.statBox}>
                    <span className={styles.statLabel}>Total Profit</span>
                    <span
                        className={`${styles.statValue} ${isProfitable ? styles.profitPositive : styles.profitNegative
                            }`}
                    >
                        {isProfitable && profit > 0 ? "+" : ""}
                        {formatCurrency(profit)}
                    </span>
                </div>

                <div className={styles.statBox}>
                    <span className={styles.statLabel}>Billing</span>
                    <button
                        type="button"
                        onClick={() => onToggleBilled(project.id, project.isBilled)}
                        className={`${styles.billedBadge} ${project.isBilled ? styles.isBilledTrue : styles.isBilledFalse
                            }`}
                        title="Click to toggle billing status"
                    >
                        {project.isBilled ? "Billed" : "Not Billed"}
                    </button>
                </div>
            </div>
        </li>
    );
};

export default ProjectItemCard;
