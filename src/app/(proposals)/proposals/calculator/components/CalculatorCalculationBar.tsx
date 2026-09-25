"use client";

import React from "react";
import {
    TbEdit,
    TbPlus,
    TbDeviceFloppy,
    TbCopy,
    TbCheck,
} from "react-icons/tb";
import { ProjectItem } from "@/lib/fireabase/projectService";
import { ProjectCalculationRecord } from "@/lib/fireabase/projectCalculationService";
import CustomProjectDropdown from "./CustomProjectDropdown";
import CustomCalculationDropdown from "./CustomCalculationDropdown";
import styles from "./CalculatorCalculationBar.module.css";

interface CalculatorCalculationBarProps {
    projects: ProjectItem[];
    selectedProjectId: string;
    onSelectProject: (projectId: string) => void;
    projectsLoading?: boolean;

    calculations: ProjectCalculationRecord[];
    selectedCalculationId: string | null;
    activeCalculationName: string;
    onChangeCalculationName: (name: string) => void;
    onSelectCalculation: (calc: ProjectCalculationRecord) => void;
    onNewBlank: () => void;
    onDeleteCalculation: (calcId: string, calcName: string, e: React.MouseEvent) => void;

    hasUnsavedChanges: boolean;
    isSaving: boolean;
    saveSuccess: boolean;
    onSave: () => void;
    onSaveAsNew: () => void;
}

export default function CalculatorCalculationBar({
    projects,
    selectedProjectId,
    onSelectProject,
    projectsLoading = false,

    calculations,
    selectedCalculationId,
    activeCalculationName,
    onChangeCalculationName,
    onSelectCalculation,
    onNewBlank,
    onDeleteCalculation,

    hasUnsavedChanges,
    isSaving,
    saveSuccess,
    onSave,
    onSaveAsNew,
}: CalculatorCalculationBarProps) {
    return (
        <div className={styles.calculationBarWrapper}>
            <div className={styles.topRow}>
                {/* LEFT CONTROLS: PROJECT DROPDOWN + CALCULATION DROPDOWN + CALCULATION NAME INPUT */}
                <div className={styles.leftControls}>
                    {/* Project Selector */}
                    <div className={styles.selectorItem}>
                        <CustomProjectDropdown
                            projects={projects}
                            selectedProjectId={selectedProjectId}
                            onChange={onSelectProject}
                            loading={projectsLoading}
                        />
                    </div>

                    {/* Calculation Selector (when project selected) */}
                    {selectedProjectId && (
                        <div className={styles.selectorItem}>
                            <CustomCalculationDropdown
                                calculations={calculations}
                                selectedCalculationId={selectedCalculationId}
                                activeCalculationName={activeCalculationName}
                                onSelect={onSelectCalculation}
                                onNewBlank={onNewBlank}
                                onDelete={onDeleteCalculation}
                                disabled={isSaving}
                            />
                        </div>
                    )}

                    {/* Active Calculation Name Editable Input */}
                    {selectedProjectId && (
                        <div className={styles.calculationNameInputWrapper}>
                            <TbEdit className={styles.nameInputIcon} />
                            <input
                                type="text"
                                value={activeCalculationName}
                                onChange={(e) => onChangeCalculationName(e.target.value)}
                                placeholder="Hesap Adı (örn: Maliyet Planı v1)..."
                                className={styles.calculationNameInput}
                                aria-label="Hesap Adı"
                            />
                        </div>
                    )}
                </div>

                {/* RIGHT ACTIONS: SAVE, SAVE AS NEW, NEW BLANK */}
                {selectedProjectId && (
                    <div className={styles.rightActions}>
                        {/* Status Chip */}
                        {saveSuccess ? (
                            <span className={`${styles.statusChip} ${styles.statusSaved}`}>
                                <TbCheck size={13} />
                                Kaydedildi
                            </span>
                        ) : hasUnsavedChanges ? (
                            <span className={`${styles.statusChip} ${styles.statusUnsaved}`}>
                                ● Kaydedilmemiş
                            </span>
                        ) : selectedCalculationId ? (
                            <span className={`${styles.statusChip} ${styles.statusSaved}`}>
                                ● Güncel
                            </span>
                        ) : (
                            <span className={`${styles.statusChip} ${styles.statusNew}`}>
                                ● Yeni Hesap
                            </span>
                        )}

                        {/* New Blank Calculation Button */}
                        <button
                            type="button"
                            onClick={onNewBlank}
                            className={`${styles.btnBase} ${styles.btnSecondary}`}
                            title="Bu proje altında yeni boş bir hesap başlat"
                        >
                            <TbPlus size={15} />
                            <span>Yeni Hesap</span>
                        </button>

                        {/* Save As New Button (when existing calculation is active) */}
                        {selectedCalculationId && (
                            <button
                                type="button"
                                onClick={onSaveAsNew}
                                disabled={isSaving}
                                className={`${styles.btnBase} ${styles.btnSecondary}`}
                                title="Mevcut hesabı bozmadan yeni bir versiyon/kopya olarak kaydet"
                            >
                                <TbCopy size={15} />
                                <span>Farklı Kaydet</span>
                            </button>
                        )}

                        {/* Main Save / Update Button */}
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={isSaving}
                            className={`${styles.btnBase} ${saveSuccess ? styles.btnSuccess : styles.btnPrimary}`}
                            title={selectedCalculationId ? "Değişiklikleri mevcut hesaba kaydet" : "Hesabı kaydet"}
                        >
                            {saveSuccess ? (
                                <>
                                    <TbCheck size={16} />
                                    <span>Kaydedildi</span>
                                </>
                            ) : (
                                <>
                                    <TbDeviceFloppy size={16} />
                                    <span>{selectedCalculationId ? "Güncelle" : "Kaydet"}</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
