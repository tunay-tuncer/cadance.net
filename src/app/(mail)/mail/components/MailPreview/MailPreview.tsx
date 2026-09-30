'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    MdDesktopMac,
    MdTabletMac,
    MdPhoneIphone,
    MdFitScreen,
    MdVisibility,
    MdCode,
    MdContentCopy,
    MdCheck,
    MdZoomIn,
    MdZoomOut,
} from 'react-icons/md';
import styles from './MailPreview.module.css';

type ViewportMode = 'desktop' | 'tablet' | 'mobile' | 'fluid';
type PreviewTab = 'visual' | 'code';

interface MailPreviewProps {
    htmlContent: string;
    accentColor: string;
    onCopyHtml: () => void;
    isCopied: boolean;
}

export default function MailPreview({
    htmlContent,
    accentColor,
    onCopyHtml,
    isCopied,
}: MailPreviewProps) {
    const [viewport, setViewport] = useState<ViewportMode>('desktop');
    const [activeTab, setActiveTab] = useState<PreviewTab>('visual');
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Compute container width based on device
    const getContainerWidth = () => {
        switch (viewport) {
            case 'mobile':
                return '375px';
            case 'tablet':
                return '480px';
            case 'desktop':
                return '600px';
            case 'fluid':
                return '100%';
            default:
                return '600px';
        }
    };

    // Auto-adjust iframe height to match content
    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const updateHeight = () => {
            try {
                if (iframe.contentWindow && iframe.contentWindow.document.body) {
                    const scrollHeight = iframe.contentWindow.document.body.scrollHeight;
                    if (scrollHeight > 100) {
                        iframe.style.height = `${scrollHeight + 40}px`;
                    }
                }
            } catch (e) {
                // Cross-origin fallback
            }
        };

        iframe.addEventListener('load', updateHeight);
        // Delay to allow images to load
        const timeout = setTimeout(updateHeight, 300);

        return () => {
            iframe.removeEventListener('load', updateHeight);
            clearTimeout(timeout);
        };
    }, [htmlContent, viewport]);

    return (
        <div
            className={styles.previewWrapper}
            style={{ '--accent': accentColor } as React.CSSProperties}
        >
            {/* TOP TOOLBAR */}
            <div className={styles.previewToolbar}>
                <div className={styles.toolbarLeft}>
                    <div className={styles.toolbarTitle}>
                        <MdVisibility size={16} color={accentColor} />
                        <span>Canlı E-Posta Önizleme</span>
                    </div>
                    <span className={styles.viewportIndicator}>{getContainerWidth()}</span>
                </div>

                {/* DEVICE TOGGLES */}
                <div className={styles.toolbarCenter}>
                    <div className={styles.deviceBtnGroup}>
                        <button
                            type="button"
                            className={`${styles.deviceBtn} ${viewport === 'desktop' ? styles.deviceBtnActive : ''}`}
                            onClick={() => setViewport('desktop')}
                            title="Masaüstü Görünüm (600px)"
                            aria-label="Desktop view"
                        >
                            <MdDesktopMac />
                        </button>

                        <button
                            type="button"
                            className={`${styles.deviceBtn} ${viewport === 'tablet' ? styles.deviceBtnActive : ''}`}
                            onClick={() => setViewport('tablet')}
                            title="Tablet Görünüm (480px)"
                            aria-label="Tablet view"
                        >
                            <MdTabletMac />
                        </button>

                        <button
                            type="button"
                            className={`${styles.deviceBtn} ${viewport === 'mobile' ? styles.deviceBtnActive : ''}`}
                            onClick={() => setViewport('mobile')}
                            title="Mobil Görünüm (375px)"
                            aria-label="Mobile view"
                        >
                            <MdPhoneIphone />
                        </button>

                        <button
                            type="button"
                            className={`${styles.deviceBtn} ${viewport === 'fluid' ? styles.deviceBtnActive : ''}`}
                            onClick={() => setViewport('fluid')}
                            title="Akışkan Görünüm (100%)"
                            aria-label="Fluid view"
                        >
                            <MdFitScreen />
                        </button>
                    </div>

                    {/* ZOOM BUTTONS */}
                    <div className={styles.deviceBtnGroup}>
                        <button
                            type="button"
                            className={styles.deviceBtn}
                            onClick={() => setZoomLevel((z) => Math.max(z - 10, 70))}
                            title="Uzaklaştır"
                            aria-label="Zoom out"
                        >
                            <MdZoomOut />
                        </button>
                        <span style={{ fontSize: '0.65rem', color: '#a1a1aa', padding: '0 0.3rem', userSelect: 'none' }}>
                            {zoomLevel}%
                        </span>
                        <button
                            type="button"
                            className={styles.deviceBtn}
                            onClick={() => setZoomLevel((z) => Math.min(z + 10, 130))}
                            title="Yakınlaştır"
                            aria-label="Zoom in"
                        >
                            <MdZoomIn />
                        </button>
                    </div>
                </div>

                {/* MODE TOGGLE (VISUAL / CODE) */}
                <div className={styles.toolbarRight}>
                    <div className={styles.viewModeBtnGroup}>
                        <button
                            type="button"
                            className={`${styles.viewModeBtn} ${activeTab === 'visual' ? styles.viewModeBtnActive : ''}`}
                            onClick={() => setActiveTab('visual')}
                        >
                            <MdVisibility size={14} />
                            <span>Görsel</span>
                        </button>

                        <button
                            type="button"
                            className={`${styles.viewModeBtn} ${activeTab === 'code' ? styles.viewModeBtnActive : ''}`}
                            onClick={() => setActiveTab('code')}
                        >
                            <MdCode size={14} />
                            <span>HTML Kodu</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* PREVIEW CANVAS */}
            <div className={styles.previewCanvas}>
                {activeTab === 'visual' ? (
                    <div
                        className={styles.iframeContainer}
                        style={{
                            width: getContainerWidth(),
                            transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : 'none',
                            transformOrigin: 'top center',
                        }}
                    >
                        <iframe
                            ref={iframeRef}
                            srcDoc={htmlContent}
                            title="Cadance Email Live Preview"
                            sandbox="allow-same-origin"
                            className={styles.previewIframe}
                        />
                    </div>
                ) : (
                    <div className={styles.codeViewContainer}>
                        <div className={styles.codeViewHeader}>
                            <span className={styles.codeViewTitle}>Duyarlı Email HTML Kodu (Tüm İstemcilerle Uyumlu)</span>
                            <button
                                type="button"
                                onClick={onCopyHtml}
                                className={styles.viewModeBtn}
                                style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                            >
                                {isCopied ? <MdCheck size={14} color="#10b981" /> : <MdContentCopy size={14} />}
                                <span>{isCopied ? 'Kopyalandı!' : 'HTML Kopyala'}</span>
                            </button>
                        </div>
                        <textarea
                            readOnly
                            value={htmlContent}
                            className={styles.codeTextarea}
                            spellCheck={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
