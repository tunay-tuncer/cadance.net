'use client';

import React, { useState } from 'react';
import {
    MdClose,
    MdSend,
    MdOpenInNew,
    MdContentCopy,
    MdFileDownload,
    MdCheck,
    MdOutlineMarkEmailRead,
    MdErrorOutline,
    MdOutlineAutoMode,
} from 'react-icons/md';
import { MailContentData, MailDesignConfig } from '@/types/mail';
import styles from './SendMailModal.module.css';

interface SendMailModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: MailContentData;
    design: MailDesignConfig;
    emailHtml: string;
    onCopyHtml: () => void;
    onDownloadHtml: () => void;
    onOpenMailClient: () => void;
    isCopied: boolean;
    downloadSuccess: boolean;
    onSentSuccessfully?: (messageId: string) => void;
}

export default function SendMailModal({
    isOpen,
    onClose,
    content,
    design,
    emailHtml,
    onCopyHtml,
    onDownloadHtml,
    onOpenMailClient,
    isCopied,
    downloadSuccess,
    onSentSuccessfully,
}: SendMailModalProps) {
    const [isSending, setIsSending] = useState(false);
    const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
    const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleDirectSend = async () => {
        if (!content.clientEmail || !content.clientEmail.trim()) {
            setSendErrorMessage('Lütfen geçerli bir alıcı e-posta adresi girin.');
            return;
        }

        setIsSending(true);
        setSendErrorMessage(null);
        setSendSuccessMessage(null);

        try {
            const response = await fetch('/api/send-mail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
                throw new Error(data.error || 'E-posta gönderilirken bir hata oluştu.');
            }

            setSendSuccessMessage(
                `E-posta başarıyla ${content.clientEmail} adresine iletildi! (${data.messageId || 'OK'})`
            );

            if (onSentSuccessfully) {
                onSentSuccessfully(data.messageId);
            }
        } catch (err: any) {
            console.error('Send mail error:', err);
            setSendErrorMessage(
                err.message || 'E-posta gönderilemedi. Lütfen bağlantınızı ve .env ayarlarınızı kontrol edin.'
            );
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* MODAL HEADER */}
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>
                        <MdSend size={18} color={design.accentColor} />
                        <span>E-Postayı Gönder / Dışa Aktar</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={styles.modalCloseBtn}
                        aria-label="Kapat"
                    >
                        <MdClose size={18} />
                    </button>
                </div>

                {/* MODAL BODY */}
                <div className={styles.modalBody}>
                    {/* RECIPIENT SUMMARY */}
                    <div className={styles.recipientSummaryBox}>
                        <div className={styles.summaryRow}>
                            <span>Alıcı E-Posta:</span>
                            <span className={styles.summaryVal}>
                                {content.clientEmail || 'Belirtilmedi'}
                            </span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Alıcı İsim:</span>
                            <span className={styles.summaryVal}>
                                {content.clientName || 'Belirtilmedi'}
                            </span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Konu:</span>
                            <span className={styles.summaryVal}>
                                {content.subject || 'Konu Yok'}
                            </span>
                        </div>
                    </div>

                    {/* SUCCESS FEEDBACK */}
                    {sendSuccessMessage && (
                        <div className={styles.successFeedback}>
                            <MdOutlineMarkEmailRead size={18} />
                            <span>{sendSuccessMessage}</span>
                        </div>
                    )}

                    {/* ERROR FEEDBACK */}
                    {sendErrorMessage && (
                        <div className={styles.errorFeedback}>
                            <div className={styles.errorTitle}>
                                <MdErrorOutline size={17} />
                                <span>Gönderim Başarısız Oldu</span>
                            </div>
                            <span>{sendErrorMessage}</span>
                        </div>
                    )}

                    {/* ACTION OPTIONS */}
                    <div className={styles.actionOptionsList}>
                        {/* 1. DIRECT AUTOMATIC SEND (NODE.JS NODEMAILER + ENV) */}
                        <button
                            type="button"
                            className={`${styles.actionCard} ${styles.primaryActionCard}`}
                            onClick={handleDirectSend}
                            disabled={isSending}
                        >
                            <div className={styles.cardLeft}>
                                <div
                                    className={styles.cardIconWrap}
                                    style={{
                                        background: 'rgba(41, 114, 245, 0.25)',
                                        color: '#60a5fa',
                                    }}
                                >
                                    {isSending ? <div className={styles.spinner} /> : <MdOutlineAutoMode />}
                                </div>
                                <div className={styles.cardTexts}>
                                    <span className={styles.cardTitle}>
                                        {isSending ? 'E-Posta Gönderiliyor...' : 'Doğrudan Gönder (.env Otomasyonu)'}
                                    </span>
                                    <span className={styles.cardDesc}>
                                        .env içindeki Email_User ve Email_Pass bilgileriyle anında alıcıya iletir
                                    </span>
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: '0.725rem',
                                    fontWeight: 700,
                                    padding: '0.3rem 0.65rem',
                                    borderRadius: '6px',
                                    background: '#2563eb',
                                    color: '#ffffff',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {isSending ? 'İletiliyor...' : 'Gönder'}
                            </span>
                        </button>

                        {/* 2. DEFAULT MAIL CLIENT (MAILTO) */}
                        <button
                            type="button"
                            className={styles.actionCard}
                            onClick={onOpenMailClient}
                        >
                            <div className={styles.cardLeft}>
                                <div
                                    className={styles.cardIconWrap}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.06)',
                                        color: '#e4e4e7',
                                    }}
                                >
                                    <MdOpenInNew />
                                </div>
                                <div className={styles.cardTexts}>
                                    <span className={styles.cardTitle}>
                                        Varsayılan E-Posta İstemcisinde Aç (mailto)
                                    </span>
                                    <span className={styles.cardDesc}>
                                        Apple Mail, Outlook veya Thunderbird ile yeni ileti açar
                                    </span>
                                </div>
                            </div>
                        </button>

                        {/* 3. COPY HTML */}
                        <button
                            type="button"
                            className={styles.actionCard}
                            onClick={onCopyHtml}
                        >
                            <div className={styles.cardLeft}>
                                <div
                                    className={styles.cardIconWrap}
                                    style={{
                                        background: 'rgba(16, 185, 129, 0.12)',
                                        color: '#10b981',
                                    }}
                                >
                                    {isCopied ? <MdCheck /> : <MdContentCopy />}
                                </div>
                                <div className={styles.cardTexts}>
                                    <span className={styles.cardTitle}>
                                        {isCopied ? 'HTML Panoya Kopyalandı!' : 'Duyarlı HTML Kodunu Kopyala'}
                                    </span>
                                    <span className={styles.cardDesc}>
                                        Mailchimp, Brevo veya SendGrid şablon düzenleyicilerine yapıştırmak için
                                    </span>
                                </div>
                            </div>
                        </button>

                        {/* 4. DOWNLOAD HTML FILE */}
                        <button
                            type="button"
                            className={styles.actionCard}
                            onClick={onDownloadHtml}
                        >
                            <div className={styles.cardLeft}>
                                <div
                                    className={styles.cardIconWrap}
                                    style={{
                                        background: 'rgba(139, 92, 246, 0.12)',
                                        color: '#8b5cf6',
                                    }}
                                >
                                    {downloadSuccess ? <MdCheck /> : <MdFileDownload />}
                                </div>
                                <div className={styles.cardTexts}>
                                    <span className={styles.cardTitle}>
                                        {downloadSuccess ? 'Dosya İndirildi!' : '.HTML Dosyası Olarak İndir'}
                                    </span>
                                    <span className={styles.cardDesc}>
                                        Web tarayıcınızda veya arşivinizde saklamak için tam HTML dosyası
                                    </span>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
