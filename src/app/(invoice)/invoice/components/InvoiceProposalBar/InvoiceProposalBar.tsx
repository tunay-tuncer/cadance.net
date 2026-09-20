"use client";

import React, { useState } from "react";
import {
    TbFileInvoice,
    TbDeviceFloppy,
    TbCopy,
    TbPlus,
    TbCheck,
    TbFileDownload,
    TbTrash,
    TbEdit,
} from "react-icons/tb";
import { MdWorkOutline } from "react-icons/md";
import { ProjectItem } from "@/lib/fireabase/projectService";
import { ProjectInvoiceRecord } from "@/lib/fireabase/projectInvoiceService";
import CustomProjectDropdown from "../../calculator/components/CustomProjectDropdown";
import CustomProposalDropdown from "./CustomProposalDropdown";
import styles from "./InvoiceProposalBar.module.css";

interface InvoiceProposalBarProps {
    projects: ProjectItem[];
    selectedProjectId: string;
    onSelectProject: (projectId: string) => void;
    projectsLoading: boolean;

    invoices: ProjectInvoiceRecord[];
    invoicesLoading: boolean;
    selectedInvoiceId: string | null;

    activeProposalName: string;
    onChangeProposalName: (name: string) => void;

    onSelectInvoice: (invoice: ProjectInvoiceRecord) => void;
    onNewBlank: () => void;
    onSave: () => void;
    onSaveAsNew: () => void;
    onDeleteInvoice: (invoiceId: string, name: string) => void;
    onImportFromCalculator?: () => void;
    hasCalculatorItems?: boolean;

    isSaving?: boolean;
    hasUnsavedChanges?: boolean;
    saveSuccess?: boolean;
}

export default function InvoiceProposalBar({
    projects,
    selectedProjectId,
    onSelectProject,
    projectsLoading,
    invoices,
    invoicesLoading,
    selectedInvoiceId,
    activeProposalName,
    onChangeProposalName,
    onSelectInvoice,
    onNewBlank,
    onSave,
    onSaveAsNew,
    onDeleteInvoice,
    onImportFromCalculator,
    hasCalculatorItems = false,
    isSaving = false,
    hasUnsavedChanges = false,
    saveSuccess = false,
}: InvoiceProposalBarProps) {
    const selectedProject = projects.find((p) => p.id === selectedProjectId);

    const handleDeleteClick = (invoiceId: string, invoiceName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const confirmDelete = window.confirm(
            `"${invoiceName}" teklifini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
        );
        if (confirmDelete) {
            onDeleteInvoice(invoiceId, invoiceName);
        }
    };

    return (
        <div className={styles.proposalBarWrapper}>
            <div className={styles.topRow}>
                {/* LEFT CONTROLS: PROJECT SELECTOR & SAVED PROPOSALS DROPDOWN */}
                <div className={styles.leftControls}>
                    {/* 1. PROJECT DROPDOWN */}
                    <div className={styles.selectorItem}>
                        <span className={styles.selectorLabel}>
                            <MdWorkOutline size={14} />
                            Proje:
                        </span>
                        <CustomProjectDropdown
                            projects={projects}
                            selectedProjectId={selectedProjectId}
                            onChange={onSelectProject}
                            disabled={projectsLoading || projects.length === 0}
                            loading={projectsLoading}
                        />
                    </div>

                    {/* 2. SAVED PROPOSALS DROPDOWN (ONLY ACTIVE WHEN PROJECT SELECTED) */}
                    {selectedProjectId && (
                        <div className={styles.selectorItem}>
                            <CustomProposalDropdown
                                invoices={invoices}
                                selectedInvoiceId={selectedInvoiceId}
                                activeProposalName={activeProposalName}
                                onSelect={onSelectInvoice}
                                onNewBlank={onNewBlank}
                                onDelete={handleDeleteClick}
                                disabled={invoicesLoading}
                                loading={invoicesLoading}
                            />
                        </div>
                    )}

                    {/* 3. PROPOSAL NAME INPUT */}
                    {selectedProjectId && (
                        <div className={styles.proposalNameInputWrapper} title="Teklifinize bir versiyon veya açıklayıcı isim verin">
                            <TbEdit className={styles.nameInputIcon} />
                            <input
                                type="text"
                                value={activeProposalName}
                                onChange={(e) => onChangeProposalName(e.target.value)}
                                placeholder="Örn: Konsept Proje Teklifi (v1)"
                                className={styles.proposalNameInput}
                            />
                        </div>
                    )}
                </div>

                {/* RIGHT ACTIONS: SAVE, SAVE AS NEW, NEW BLANK, IMPORT */}
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
                        ) : selectedInvoiceId ? (
                            <span className={`${styles.statusChip} ${styles.statusSaved}`}>
                                ● Güncel
                            </span>
                        ) : (
                            <span className={`${styles.statusChip} ${styles.statusNew}`}>
                                ● Yeni Taslak
                            </span>
                        )}

                        {/* Import from Calculator (Bonus helper) */}
                        {hasCalculatorItems && onImportFromCalculator && (
                            <button
                                type="button"
                                onClick={onImportFromCalculator}
                                className={`${styles.btnBase} ${styles.btnImport}`}
                                title="Bu projenin Invoice Calculator sayfasındaki kârlı kalemlerini forma aktar"
                            >
                                <TbFileDownload size={15} />
                                <span>Hesaplayıcıdan Aktar</span>
                            </button>
                        )}

                        {/* New Blank Button */}
                        <button
                            type="button"
                            onClick={onNewBlank}
                            className={`${styles.btnBase} ${styles.btnSecondary}`}
                            title="Bu proje altında yeni boş bir teklif hazırla"
                        >
                            <TbPlus size={15} />
                            <span>Yeni Teklif</span>
                        </button>

                        {/* Save As New Button (when existing proposal is active) */}
                        {selectedInvoiceId && (
                            <button
                                type="button"
                                onClick={onSaveAsNew}
                                disabled={isSaving}
                                className={`${styles.btnBase} ${styles.btnSecondary}`}
                                title="Mevcut teklifi bozmadan yeni bir versiyon/kopya olarak kaydet"
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
                            title={selectedInvoiceId ? "Değişiklikleri mevcut teklife kaydet" : "Teklifi kaydet"}
                        >
                            {saveSuccess ? (
                                <>
                                    <TbCheck size={16} />
                                    <span>Kaydedildi</span>
                                </>
                            ) : (
                                <>
                                    <TbDeviceFloppy size={16} />
                                    <span>{selectedInvoiceId ? "Güncelle" : "Kaydet"}</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
