'use client';

import React, { useEffect } from 'react';
import { MdWarningAmber, MdDelete, MdClose } from 'react-icons/md';
import { ProjectItem } from '@/lib/fireabase/projectService';
import { getProjectTypeConfig } from './ProjectTypeDropdown';
import styles from './DeleteProjectModal.module.css';

interface DeleteProjectModalProps {
    isOpen: boolean;
    project: ProjectItem | null;
    onClose: () => void;
    onConfirm: (projectId: string) => Promise<void> | void;
    isDeleting?: boolean;
}

const formatCurrency = (amount: number): string => {
    return `₺${Math.round(amount || 0).toLocaleString('tr-TR')}`;
};

export default function DeleteProjectModal({
    isOpen,
    project,
    onClose,
    onConfirm,
    isDeleting = false,
}: DeleteProjectModalProps) {
    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isDeleting) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isDeleting, onClose]);

    if (!isOpen || !project) return null;

    const typeConfig = getProjectTypeConfig(project.type);

    const handleConfirm = () => {
        if (isDeleting) return;
        onConfirm(project.id);
    };

    return (
        <div
            className={styles.modalOverlay}
            onClick={() => !isDeleting && onClose()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            aria-describedby="delete-project-desc"
        >
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* CLOSE BUTTON */}
                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={onClose}
                    disabled={isDeleting}
                    aria-label="Close dialog"
                >
                    <MdClose size={18} />
                </button>

                {/* MODAL BODY */}
                <div className={styles.modalBody}>
                    <div className={styles.alertIconWrapper}>
                        <MdWarningAmber />
                    </div>

                    <div className={styles.titleArea}>
                        <h3 id="delete-project-title" className={styles.modalTitle}>
                            Delete Project?
                        </h3>
                        <p id="delete-project-desc" className={styles.modalDescription}>
                            Are you sure you want to delete{' '}
                            <span className={styles.projectNameHighlight}>&ldquo;{project.name}&rdquo;</span>?
                        </p>
                    </div>

                    {/* PROJECT DETAILS PREVIEW */}
                    <div className={styles.projectPreviewBox}>
                        <div className={styles.previewHeaderRow}>
                            <span className={styles.previewProjectName}>{project.name}</span>
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.68rem',
                                    fontWeight: 600,
                                    padding: '0.12rem 0.45rem',
                                    borderRadius: '5px',
                                    color: typeConfig.color,
                                    backgroundColor: typeConfig.bg,
                                    border: `1px solid ${typeConfig.border}`,
                                }}
                            >
                                {typeConfig.icon}
                                {typeConfig.label}
                            </span>
                        </div>

                        <div className={styles.previewStatsRow}>
                            <div className={styles.previewStatItem}>
                                <span>Agreed:</span>
                                <span className={styles.previewStatValue}>
                                    {formatCurrency(project.agreedPayment)}
                                </span>
                            </div>
                            <div className={styles.previewStatItem}>
                                <span>Received:</span>
                                <span className={styles.previewStatValue} style={{ color: '#34d399' }}>
                                    {formatCurrency(project.totalMoneyReceived)}
                                </span>
                            </div>
                            <div className={styles.previewStatItem}>
                                <span>Spent:</span>
                                <span className={styles.previewStatValue} style={{ color: '#f87171' }}>
                                    {formatCurrency(project.totalMoneySpent)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.warningNotice}>
                        <span>⚠️ This action cannot be undone. All tracked milestones and financial history will be permanently deleted.</span>
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={styles.deleteConfirmBtn}
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        autoFocus
                    >
                        <MdDelete size={16} />
                        <span>{isDeleting ? 'Deleting...' : 'Delete Project'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
