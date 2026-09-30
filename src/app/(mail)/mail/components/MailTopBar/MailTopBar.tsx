'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    MdOutlineDashboardCustomize,
    MdWorkOutline,
    MdCheck,
    MdRefresh,
    MdContentCopy,
    MdSend,
} from 'react-icons/md';
import { FaChevronDown } from 'react-icons/fa';
import { MailTemplate } from '@/types/mail';
import { ProjectItem } from '@/lib/fireabase/projectService';
import styles from './MailTopBar.module.css';

interface MailTopBarProps {
    templates: MailTemplate[];
    activeTemplateId: string;
    onSelectTemplate: (templateId: string) => void;
    projects: ProjectItem[];
    selectedProjectId: string;
    onSelectProject: (projectId: string) => void;
    onResetTemplate: () => void;
    onCopyHtml: () => void;
    onOpenSendModal: () => void;
    isCopied: boolean;
    accentColor: string;
}

export default function MailTopBar({
    templates,
    activeTemplateId,
    onSelectTemplate,
    projects,
    selectedProjectId,
    onSelectProject,
    onResetTemplate,
    onCopyHtml,
    onOpenSendModal,
    isCopied,
    accentColor,
}: MailTopBarProps) {
    const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
    const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);

    const templateRef = useRef<HTMLDivElement>(null);
    const projectRef = useRef<HTMLDivElement>(null);

    const activeTemplate = templates.find((t) => t.id === activeTemplateId) || templates[0];
    const selectedProject = projects.find((p) => p.id === selectedProjectId);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (templateRef.current && !templateRef.current.contains(event.target as Node)) {
                setIsTemplateMenuOpen(false);
            }
            if (projectRef.current && !projectRef.current.contains(event.target as Node)) {
                setIsProjectMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            className={styles.barWrapper}
            style={{ '--accent': accentColor } as React.CSSProperties}
        >
            <div className={styles.leftSelectors}>
                {/* 1. TEMPLATE SELECTOR */}
                <div className={styles.selectorItem}>
                    <div className={styles.dropdownWrapper} ref={templateRef}>
                        <button
                            type="button"
                            className={`${styles.dropdownTrigger} ${isTemplateMenuOpen ? styles.dropdownTriggerActive : ''}`}
                            onClick={() => setIsTemplateMenuOpen((prev) => !prev)}
                            aria-haspopup="listbox"
                            aria-expanded={isTemplateMenuOpen}
                        >
                            <div className={styles.triggerTextGroup}>
                                <span className={styles.triggerSubtext}>Şablon Seçimi</span>
                                <span className={styles.triggerMainText}>
                                    {activeTemplate?.name || 'Şablon Seç'}
                                </span>
                            </div>
                            <FaChevronDown
                                className={`${styles.chevronIcon} ${isTemplateMenuOpen ? styles.chevronOpen : ''}`}
                            />
                        </button>

                        {isTemplateMenuOpen && (
                            <div className={styles.dropdownMenu} role="listbox">
                                {templates.map((tpl) => {
                                    const isSelected = tpl.id === activeTemplateId;
                                    return (
                                        <button
                                            key={tpl.id}
                                            type="button"
                                            className={`${styles.dropdownItem} ${isSelected ? styles.dropdownItemSelected : ''}`}
                                            onClick={() => {
                                                onSelectTemplate(tpl.id);
                                                setIsTemplateMenuOpen(false);
                                            }}
                                            role="option"
                                            aria-selected={isSelected}
                                        >
                                            <div className={styles.itemLeft}>
                                                <div className={styles.itemHeader}>
                                                    <span className={styles.itemTitle}>{tpl.name}</span>
                                                    <span className={styles.itemBadge}>{tpl.badge}</span>
                                                </div>
                                                <span className={styles.itemDesc}>{tpl.description}</span>
                                            </div>
                                            {isSelected && <MdCheck className={styles.itemCheckIcon} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. PROJECT AUTOFILL SELECTOR */}
                <div className={styles.selectorItem}>
                    <div className={styles.dropdownWrapper} ref={projectRef}>
                        <button
                            type="button"
                            className={`${styles.dropdownTrigger} ${isProjectMenuOpen ? styles.dropdownTriggerActive : ''}`}
                            onClick={() => setIsProjectMenuOpen((prev) => !prev)}
                            aria-haspopup="listbox"
                            aria-expanded={isProjectMenuOpen}
                        >
                            <div className={styles.triggerTextGroup}>
                                <span className={styles.triggerSubtext}>Proje Otomatik Doldur</span>
                                <span className={styles.triggerMainText}>
                                    {selectedProject ? selectedProject.name : 'Projeden Bilgi Çek...'}
                                </span>
                            </div>
                            <FaChevronDown
                                className={`${styles.chevronIcon} ${isProjectMenuOpen ? styles.chevronOpen : ''}`}
                            />
                        </button>

                        {isProjectMenuOpen && (
                            <div className={styles.dropdownMenu} role="listbox">
                                <button
                                    type="button"
                                    className={`${styles.dropdownItem} ${!selectedProjectId ? styles.dropdownItemSelected : ''}`}
                                    onClick={() => {
                                        onSelectProject('');
                                        setIsProjectMenuOpen(false);
                                    }}
                                    role="option"
                                    aria-selected={!selectedProjectId}
                                >
                                    <div className={styles.itemLeft}>
                                        <span className={styles.itemTitle}>Proje Seçilmedi (Manuel)</span>
                                        <span className={styles.itemDesc}>
                                            Alanları manuel olarak düzenleyin
                                        </span>
                                    </div>
                                    {!selectedProjectId && <MdCheck className={styles.itemCheckIcon} />}
                                </button>

                                {projects.map((proj) => {
                                    const isSelected = proj.id === selectedProjectId;
                                    return (
                                        <button
                                            key={proj.id}
                                            type="button"
                                            className={`${styles.dropdownItem} ${isSelected ? styles.dropdownItemSelected : ''}`}
                                            onClick={() => {
                                                onSelectProject(proj.id);
                                                setIsProjectMenuOpen(false);
                                            }}
                                            role="option"
                                            aria-selected={isSelected}
                                        >
                                            <div className={styles.itemLeft}>
                                                <div className={styles.itemHeader}>
                                                    <span className={styles.itemTitle}>{proj.name}</span>
                                                    {proj.type && (
                                                        <span className={styles.itemBadge}>{proj.type}</span>
                                                    )}
                                                </div>
                                                <span className={styles.itemDesc}>
                                                    {proj.agreedPayment > 0
                                                        ? `₺${proj.agreedPayment.toLocaleString('tr-TR')} · `
                                                        : ''}
                                                    {proj.startDate || 'Tarih belirtilmedi'}
                                                </span>
                                            </div>
                                            {isSelected && <MdCheck className={styles.itemCheckIcon} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT QUICK ACTIONS */}
            <div className={styles.rightActions}>
                <button
                    type="button"
                    className={`${styles.btnBase} ${styles.btnSecondary}`}
                    onClick={onResetTemplate}
                    title="Şablonu varsayılan ayarlara sıfırla"
                >
                    <MdRefresh size={16} />
                    <span>Sıfırla</span>
                </button>

                <button
                    type="button"
                    className={`${styles.btnBase} ${isCopied ? styles.btnSuccess : styles.btnSecondary}`}
                    onClick={onCopyHtml}
                    title="Duyarlı e-posta HTML kodunu panoya kopyala"
                >
                    {isCopied ? <MdCheck size={16} /> : <MdContentCopy size={16} />}
                    <span>{isCopied ? 'Kopyalandı!' : 'HTML Kopyala'}</span>
                </button>

                <button
                    type="button"
                    className={`${styles.btnBase} ${styles.btnPrimary}`}
                    onClick={onOpenSendModal}
                    title="E-posta gönder veya dışa aktar"
                >
                    <MdSend size={15} />
                    <span>Gönder / Dışa Aktar</span>
                </button>
            </div>
        </div>
    );
}
