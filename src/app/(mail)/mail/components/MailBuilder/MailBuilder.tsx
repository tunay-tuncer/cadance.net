'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MdCheckCircle, MdInfo } from 'react-icons/md';
import { useAuth } from '@/context/AuthContext';
import { ProjectItem, subscribeToUserProjects } from '@/lib/fireabase/projectService';
import { MailContentData, MailDesignConfig } from '@/types/mail';
import { MAIL_TEMPLATES } from '../../templates/templateData';
import { generateResponsiveEmailHtml } from '../../utils/htmlGenerator';
import MailTopBar from '../MailTopBar/MailTopBar';
import MailEditor from '../MailEditor/MailEditor';
import MailPreview from '../MailPreview/MailPreview';
import SendMailModal from '../SendMailModal/SendMailModal';
import styles from './MailBuilder.module.css';

export default function MailBuilder() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');

    // Active template
    const [activeTemplateId, setActiveTemplateId] = useState<string>('standard-studio-mail');

    // Email content state
    const currentTemplate = useMemo(() => {
        return MAIL_TEMPLATES.find((t) => t.id === activeTemplateId) || MAIL_TEMPLATES[0];
    }, [activeTemplateId]);

    const [content, setContent] = useState<MailContentData>(currentTemplate.defaultContent);
    const [design, setDesign] = useState<MailDesignConfig>(currentTemplate.defaultDesign);

    // Toast feedback & modal states
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
    const [isSendModalOpen, setIsSendModalOpen] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    }, []);

    // Subscribe to projects from Firestore
    useEffect(() => {
        if (!user?.uid) {
            setProjects([]);
            return;
        }
        const unsubscribe = subscribeToUserProjects(user.uid, (data) => {
            setProjects(data);
        });
        return () => unsubscribe();
    }, [user?.uid]);

    // Handle template switch
    const handleSelectTemplate = useCallback(
        (templateId: string) => {
            const nextTemplate = MAIL_TEMPLATES.find((t) => t.id === templateId);
            if (!nextTemplate) return;

            setActiveTemplateId(templateId);

            // Preserve already entered client email & name
            setContent((prev) => ({
                ...nextTemplate.defaultContent,
                clientEmail: prev.clientEmail || nextTemplate.defaultContent.clientEmail,
                clientName: prev.clientName || nextTemplate.defaultContent.clientName,
            }));

            setDesign(nextTemplate.defaultDesign);
            showToast(`"${nextTemplate.name}" şablonu yüklendi`);
        },
        [showToast]
    );

    // Reset template to original defaults
    const handleResetTemplate = useCallback(() => {
        setContent(currentTemplate.defaultContent);
        setDesign(currentTemplate.defaultDesign);
        setSelectedProjectId('');
        showToast('Şablon varsayılan ayarlara sıfırlandı');
    }, [currentTemplate, showToast]);

    // Handle project autofill selection
    const handleSelectProject = useCallback(
        (projectId: string) => {
            setSelectedProjectId(projectId);
            if (!projectId) return;

            const proj = projects.find((p) => p.id === projectId);
            if (!proj) return;

            setContent((prev) => ({
                ...prev,
                clientName: `Sn. ${proj.name} Yetkilisi`,
                subject: `Cadance Studio | ${proj.name} Projesi Bilgilendirmesi`,
                highlightText: `Sn. ${proj.name} Yetkilisi,`,
                primaryButtonUrl: `https://flow.cadancestudio.com/project/${proj.id}`,
                bidDetails: prev.bidDetails
                    ? {
                          ...prev.bidDetails,
                          projectName: proj.name,
                          priceAmount: proj.agreedPayment > 0
                              ? `₺${proj.agreedPayment.toLocaleString('tr-TR')} + KDV`
                              : prev.bidDetails.priceAmount,
                      }
                    : undefined,
            }));

            showToast(`"${proj.name}" proje bilgileri uygulandı`);
        },
        [projects, showToast]
    );

    // Real-time generated email HTML
    const emailHtml = useMemo(() => {
        return generateResponsiveEmailHtml(content, design);
    }, [content, design]);

    // Copy HTML to clipboard
    const handleCopyHtml = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(emailHtml);
            setIsCopied(true);
            showToast('Duyarlı e-posta HTML kodu panoya kopyalandı!');
            setTimeout(() => setIsCopied(false), 2500);
        } catch (err) {
            console.error('Failed to copy HTML:', err);
        }
    }, [emailHtml, showToast]);

    // Download .html file
    const handleDownloadHtml = useCallback(() => {
        try {
            const blob = new Blob([emailHtml], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const cleanName = (content.clientName || 'email')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-');
            link.href = url;
            link.download = `cadance-${cleanName}-${Date.now()}.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setDownloadSuccess(true);
            showToast('.HTML e-posta dosyası indirildi!');
            setTimeout(() => setDownloadSuccess(false), 2500);
        } catch (err) {
            console.error('Failed to download HTML:', err);
        }
    }, [content.clientName, emailHtml, showToast]);

    // Open in default mail client (mailto link)
    const handleOpenMailClient = useCallback(() => {
        const to = encodeURIComponent(content.clientEmail || '');
        const subject = encodeURIComponent(content.subject || 'Cadance Studio');
        const plainBody = encodeURIComponent(
            `${content.heading} ${content.highlightText}\n\n` +
            `${content.leadParagraph}\n\n` +
            (content.subheading ? `${content.subheading}\n` : '') +
            content.bulletPoints.map((b) => `• ${b.text}`).join('\n') +
            (content.infoNotice ? `\n\n${content.infoNotice}` : '') +
            `\n\n${content.primaryButtonText}: ${content.primaryButtonUrl}` +
            (content.showSecondaryButton ? `\n${content.secondaryButtonText}: ${content.secondaryButtonUrl}` : '') +
            `\n\n${content.footerNote}\n${content.copyrightText}`
        );

        window.location.href = `mailto:${to}?subject=${subject}&body=${plainBody}`;
        showToast('Varsayılan e-posta istemcisi açılıyor...');
    }, [content, showToast]);

    // Direct automatic send via /api/send-mail
    const [isDirectSending, setIsDirectSending] = useState(false);
    const handleDirectSend = useCallback(async () => {
        if (!content.clientEmail || !content.clientEmail.trim()) {
            showToast('Lütfen geçerli bir alıcı e-posta adresi girin.');
            return;
        }

        setIsDirectSending(true);
        try {
            const response = await fetch('/api/send-mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: content.clientEmail.trim(),
                    subject: content.subject,
                    html: emailHtml,
                    text: `${content.heading} ${content.highlightText}\n\n${content.leadParagraph}\n\n${content.primaryButtonText}: ${content.primaryButtonUrl}`,
                    cc: content.ccEmail,
                    bcc: content.bccEmail,
                    fromName: design.studioName || 'Cadance Studio',
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'E-posta gönderilemedi');
            }

            showToast(`E-posta başarıyla ${content.clientEmail} adresine iletildi!`);
        } catch (err: any) {
            console.error('Direct send error:', err);
            showToast(`Hata: ${err.message || 'Gönderim başarısız'}`);
        } finally {
            setIsDirectSending(false);
        }
    }, [content, design, emailHtml, showToast]);

    return (
        <div className={styles.builderWrapper}>
            {/* TOP BAR WITH TEMPLATE & PROJECT SELECTORS & QUICK ACTIONS */}
            <MailTopBar
                templates={MAIL_TEMPLATES}
                activeTemplateId={activeTemplateId}
                onSelectTemplate={handleSelectTemplate}
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={handleSelectProject}
                onResetTemplate={handleResetTemplate}
                onCopyHtml={handleCopyHtml}
                onOpenSendModal={() => setIsSendModalOpen(true)}
                isCopied={isCopied}
                accentColor={design.accentColor}
            />

            {/* 2-COLUMN BUILDER CONTAINER */}
            <div className={styles.mailColumnsContainer}>
                {/* LEFT: FORM & CONTROLS EDITOR */}
                <MailEditor
                    content={content}
                    onChangeContent={(updates) => setContent((prev) => ({ ...prev, ...updates }))}
                    design={design}
                    onChangeDesign={(updates) => setDesign((prev) => ({ ...prev, ...updates }))}
                    templateName={currentTemplate.name}
                    templateBadge={currentTemplate.badge}
                    onCopyHtml={handleCopyHtml}
                    onDownloadHtml={handleDownloadHtml}
                    onOpenMailClient={handleOpenMailClient}
                    onDirectSend={handleDirectSend}
                    isDirectSending={isDirectSending}
                    isCopied={isCopied}
                    downloadSuccess={downloadSuccess}
                />

                {/* RIGHT: LIVE RESPONSIVE PREVIEW */}
                <MailPreview
                    htmlContent={emailHtml}
                    accentColor={design.accentColor}
                    onCopyHtml={handleCopyHtml}
                    isCopied={isCopied}
                />
            </div>

            {/* SEND / EXPORT MODAL */}
            <SendMailModal
                isOpen={isSendModalOpen}
                onClose={() => setIsSendModalOpen(false)}
                content={content}
                design={design}
                emailHtml={emailHtml}
                onCopyHtml={handleCopyHtml}
                onDownloadHtml={handleDownloadHtml}
                onOpenMailClient={handleOpenMailClient}
                onSentSuccessfully={(id) => showToast(`E-posta başarıyla iletildi! (${id})`)}
                isCopied={isCopied}
                downloadSuccess={downloadSuccess}
            />

            {/* FLOATING TOAST NOTIFICATION */}
            {toastMessage && (
                <div
                    className={styles.floatingToast}
                    style={{ '--accent': design.accentColor } as React.CSSProperties}
                >
                    <MdCheckCircle className={styles.toastIcon} />
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}
