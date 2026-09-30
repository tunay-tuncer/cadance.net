'use client';

import React, { useState } from 'react';
import {
    MdOutlineFormatQuote,
    MdEmail,
    MdPersonOutline,
    MdPalette,
    MdSend,
    MdLink,
    MdOutlineTitle,
    MdImage,
    MdOutlineCheckCircle,
    MdFileDownload,
    MdContentCopy,
    MdOpenInNew,
    MdOutlineSecurity,
} from 'react-icons/md';
import { MailContentData, MailDesignConfig, EmailThemeMode, ButtonStyleMode } from '@/types/mail';
import { PRESET_HERO_IMAGES } from '../../templates/templateData';
import {
    CustomToggleSwitch,
    CustomColorPicker,
    CustomBulletListEditor,
    CustomSegmentControl,
} from '../CustomControls/CustomControls';
import styles from './MailEditor.module.css';

type EditorTab = 'content' | 'design' | 'send';

interface MailEditorProps {
    content: MailContentData;
    onChangeContent: (updates: Partial<MailContentData>) => void;
    design: MailDesignConfig;
    onChangeDesign: (updates: Partial<MailDesignConfig>) => void;
    templateName: string;
    templateBadge: string;
    onCopyHtml: () => void;
    onDownloadHtml: () => void;
    onOpenMailClient: () => void;
    onDirectSend?: () => void;
    isDirectSending?: boolean;
    isCopied: boolean;
    downloadSuccess: boolean;
}

export default function MailEditor({
    content,
    onChangeContent,
    design,
    onChangeDesign,
    templateName,
    templateBadge,
    onCopyHtml,
    onDownloadHtml,
    onOpenMailClient,
    onDirectSend,
    isDirectSending = false,
    isCopied,
    downloadSuccess,
}: MailEditorProps) {
    const [activeTab, setActiveTab] = useState<EditorTab>('content');

    const handleContentField = (field: keyof MailContentData, value: any) => {
        onChangeContent({ [field]: value });
    };

    const handleDesignField = (field: keyof MailDesignConfig, value: any) => {
        onChangeDesign({ [field]: value });
    };

    const handleBidDetailField = (field: string, value: string) => {
        onChangeContent({
            bidDetails: {
                projectName: content.bidDetails?.projectName || '',
                scopeText: content.bidDetails?.scopeText || '',
                priceAmount: content.bidDetails?.priceAmount || '',
                validityPeriod: content.bidDetails?.validityPeriod || '',
                [field]: value,
            },
        });
    };

    return (
        <div
            className={styles.editorCard}
            style={{ '--accent': design.accentColor } as React.CSSProperties}
        >
            {/* HEADER WITH TABS */}
            <div className={styles.editorHeader}>
                <div className={styles.titleRow}>
                    <div className={styles.editorTitle}>
                        <MdOutlineFormatQuote className={styles.editorTitleIcon} size={18} />
                        <span>E-Posta Düzenleyici</span>
                    </div>
                    <span className={styles.activeTemplateBadge}>{templateBadge}</span>
                </div>

                {/* TABS SEGMENT */}
                <CustomSegmentControl<EditorTab>
                    options={[
                        { value: 'content', label: 'İçerik & Metin', icon: <MdOutlineTitle size={14} /> },
                        { value: 'design', label: 'Tasarım & Tema', icon: <MdPalette size={14} /> },
                        { value: 'send', label: 'Gönder & İndir', icon: <MdSend size={14} /> },
                    ]}
                    value={activeTab}
                    onChange={setActiveTab}
                    accentColor={design.accentColor}
                />
            </div>

            {/* SCROLLABLE FORM BODY */}
            <div className={styles.editorScrollArea}>
                {/* ========================================================
                    TAB 1: CONTENT
                    ======================================================== */}
                {activeTab === 'content' && (
                    <>
                        {/* 1. RECIPIENT & SUBJECT */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionTitle}>
                                <div className={styles.sectionHeaderLeft}>
                                    <MdEmail size={15} color={design.accentColor} />
                                    <span>Alıcı & Başlık Bilgileri</span>
                                </div>
                            </div>

                            <div className={styles.formGrid2}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Alıcı E-Postası (To)</label>
                                    <div className={styles.fieldInputWrapper}>
                                        <MdEmail className={styles.inputIcon} />
                                        <input
                                            type="email"
                                            value={content.clientEmail}
                                            onChange={(e) => handleContentField('clientEmail', e.target.value)}
                                            placeholder="musteri@ornek.com"
                                            className={styles.fieldInput}
                                        />
                                    </div>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Alıcı Hitabı / Adı</label>
                                    <div className={styles.fieldInputWrapper}>
                                        <MdPersonOutline className={styles.inputIcon} />
                                        <input
                                            type="text"
                                            value={content.clientName}
                                            onChange={(e) => handleContentField('clientName', e.target.value)}
                                            placeholder="Sn. Abdullah Elmas"
                                            className={styles.fieldInput}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>E-Posta Konusu (Subject)</label>
                                <div className={styles.fieldInputWrapper}>
                                    <input
                                        type="text"
                                        value={content.subject}
                                        onChange={(e) => handleContentField('subject', e.target.value)}
                                        placeholder="Cadance Flow | Yeni Proje Başlangıcı..."
                                        className={styles.fieldInput}
                                    />
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Önizleme Metni (Preheader)</label>
                                <div className={styles.fieldInputWrapper}>
                                    <input
                                        type="text"
                                        value={content.preheader}
                                        onChange={(e) => handleContentField('preheader', e.target.value)}
                                        placeholder="Gelen kutusunda konu satırının yanında görünen özet..."
                                        className={styles.fieldInput}
                                    />
                                </div>
                                <span className={styles.fieldHelp}>
                                    Müşterinin gelen kutusunda (inbox) konu satırının hemen yanında görünen kısa açıklama.
                                </span>
                            </div>
                        </div>

                        {/* 2. MAIN MESSAGE BODY */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionTitle}>
                                <div className={styles.sectionHeaderLeft}>
                                    <MdOutlineTitle size={15} color={design.accentColor} />
                                    <span>Ana Metin & Karşılama</span>
                                </div>
                            </div>

                            <div className={styles.formGrid2}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Kategori Etiketi (Badge)</label>
                                    <div className={styles.fieldInputWrapper}>
                                        <input
                                            type="text"
                                            value={content.badgeText}
                                            onChange={(e) => handleContentField('badgeText', e.target.value)}
                                            placeholder="YENİ PROJE BAŞLANGICI"
                                            className={styles.fieldInput}
                                        />
                                    </div>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Etiket Rengi</label>
                                    <div className={styles.fieldInputWrapper}>
                                        <input
                                            type="color"
                                            value={content.badgeColor || design.accentColor}
                                            onChange={(e) => handleContentField('badgeColor', e.target.value)}
                                            style={{ width: '22px', height: '22px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                                        />
                                        <input
                                            type="text"
                                            value={content.badgeColor || design.accentColor}
                                            onChange={(e) => handleContentField('badgeColor', e.target.value)}
                                            className={styles.fieldInput}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formGrid2}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Başlık Başlangıcı</label>
                                    <div className={styles.fieldInputWrapper}>
                                        <input
                                            type="text"
                                            value={content.heading}
                                            onChange={(e) => handleContentField('heading', e.target.value)}
                                            placeholder="Harika bir şeye başlıyoruz,"
                                            className={styles.fieldInput}
                                        />
                                    </div>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Vurgulanan İsim (Mavi/Renkli)</label>
                                    <div className={styles.fieldInputWrapper}>
                                        <input
                                            type="text"
                                            value={content.highlightText}
                                            onChange={(e) => handleContentField('highlightText', e.target.value)}
                                            placeholder="Sn. Abdullah Elmas,"
                                            className={styles.fieldInput}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Giriş Paragrafı</label>
                                <textarea
                                    value={content.leadParagraph}
                                    onChange={(e) => handleContentField('leadParagraph', e.target.value)}
                                    rows={4}
                                    className={styles.fieldTextarea}
                                    placeholder="Stüdyomuzu tercih ettiğiniz için teşekkür ederiz..."
                                />
                            </div>
                        </div>

                        {/* 3. OPTIONAL BID CARD (if price bid template) */}
                        {content.bidDetails && (
                            <div className={styles.formSection}>
                                <div className={styles.sectionTitle}>
                                    <div className={styles.sectionHeaderLeft}>
                                        <span style={{ color: '#10b981' }}>₺</span>
                                        <span>Teklif & Fiyat Kartı Detayları</span>
                                    </div>
                                </div>

                                <div className={styles.formGrid2}>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Proje Başlığı</label>
                                        <div className={styles.fieldInputWrapper}>
                                            <input
                                                type="text"
                                                value={content.bidDetails.projectName}
                                                onChange={(e) => handleBidDetailField('projectName', e.target.value)}
                                                className={styles.fieldInput}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Teklif Tutarı</label>
                                        <div className={styles.fieldInputWrapper}>
                                            <input
                                                type="text"
                                                value={content.bidDetails.priceAmount}
                                                onChange={(e) => handleBidDetailField('priceAmount', e.target.value)}
                                                placeholder="₺75.000 + KDV"
                                                className={styles.fieldInput}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.formGrid2}>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Kapsam Özeti</label>
                                        <div className={styles.fieldInputWrapper}>
                                            <input
                                                type="text"
                                                value={content.bidDetails.scopeText}
                                                onChange={(e) => handleBidDetailField('scopeText', e.target.value)}
                                                placeholder="Avan Proje + 3D Render..."
                                                className={styles.fieldInput}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Geçerlilik Süresi</label>
                                        <div className={styles.fieldInputWrapper}>
                                            <input
                                                type="text"
                                                value={content.bidDetails.validityPeriod}
                                                onChange={(e) => handleBidDetailField('validityPeriod', e.target.value)}
                                                placeholder="15 Gün Geçerli"
                                                className={styles.fieldInput}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. DYNAMIC BULLETS / INSTRUCTIONS */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionTitle}>
                                <div className={styles.sectionHeaderLeft}>
                                    <span>Madde & Talimat Listesi</span>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Liste Başlığı (Opsiyonel)</label>
                                <div className={styles.fieldInputWrapper}>
                                    <input
                                        type="text"
                                        value={content.subheading || ''}
                                        onChange={(e) => handleContentField('subheading', e.target.value)}
                                        placeholder="Nasıl giriş yapılır :"
                                        className={styles.fieldInput}
                                    />
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Maddeler / Adımlar</label>
                                <CustomBulletListEditor
                                    items={content.bulletPoints}
                                    onChange={(newItems) => handleContentField('bulletPoints', newItems)}
                                    accentColor={design.accentColor}
                                />
                                <span className={styles.fieldHelp}>
                                    Tırnak içindeki kelimeler ve &quot;Cadance Flow&quot; otomatik olarak vurgulanır.
                                </span>
                            </div>
                        </div>

                        {/* 5. SECURITY / NOTICE BOX */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionTitle}>
                                <div className={styles.sectionHeaderLeft}>
                                    <MdOutlineSecurity size={15} color={design.accentColor} />
                                    <span>Bilgi & Güvenlik Kutusu</span>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <textarea
                                    value={content.infoNotice || ''}
                                    onChange={(e) => handleContentField('infoNotice', e.target.value)}
                                    rows={3}
                                    className={styles.fieldTextarea}
                                    placeholder="Üye olmak için Google / Apple hesabınızı kullanabilirsiniz..."
                                />
                            </div>
                        </div>

                        {/* 6. CALL TO ACTION BUTTONS */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionTitle}>
                                <div className={styles.sectionHeaderLeft}>
                                    <MdLink size={16} color={design.accentColor} />
                                    <span>Eylem Butonları (Call To Action)</span>
                                </div>
                            </div>

                            {/* Primary Button */}
                            <div className={styles.formGrid2}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Birincil Buton Yazısı</label>
                                    <div className={styles.fieldInputWrapper}>
                                        <input
                                            type="text"
                                            value={content.primaryButtonText}
                                            onChange={(e) => handleContentField('primaryButtonText', e.target.value)}
                                            placeholder="Proje sayfasına git"
                                            className={styles.fieldInput}
                                        />
                                    </div>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Birincil Buton Linki (URL)</label>
                                    <div className={styles.fieldInputWrapper}>
                                        <MdLink className={styles.inputIcon} />
                                        <input
                                            type="text"
                                            value={content.primaryButtonUrl}
                                            onChange={(e) => handleContentField('primaryButtonUrl', e.target.value)}
                                            placeholder="https://flow.cadancestudio.com"
                                            className={styles.fieldInput}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Button Toggle */}
                            <div style={{ paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <CustomToggleSwitch
                                    checked={content.showSecondaryButton}
                                    onChange={(checked) => handleContentField('showSecondaryButton', checked)}
                                    label="İkincil Butonu Göster"
                                    sublabel="Beyaz zeminli ikinci bir bağlantı butonu ekler"
                                    accentColor={design.accentColor}
                                />
                            </div>

                            {content.showSecondaryButton && (
                                <div className={styles.formGrid2}>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>İkincil Buton Yazısı</label>
                                        <div className={styles.fieldInputWrapper}>
                                            <input
                                                type="text"
                                                value={content.secondaryButtonText}
                                                onChange={(e) => handleContentField('secondaryButtonText', e.target.value)}
                                                placeholder="Cadance Flow'a git"
                                                className={styles.fieldInput}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>İkincil Buton Linki (URL)</label>
                                        <div className={styles.fieldInputWrapper}>
                                            <MdLink className={styles.inputIcon} />
                                            <input
                                                type="text"
                                                value={content.secondaryButtonUrl}
                                                onChange={(e) => handleContentField('secondaryButtonUrl', e.target.value)}
                                                placeholder="https://flow.cadancestudio.com"
                                                className={styles.fieldInput}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 7. FOOTER & COPYRIGHT */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionTitle}>
                                <div className={styles.sectionHeaderLeft}>
                                    <span>Altbilgi (Footer)</span>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Açıklama Notu</label>
                                <div className={styles.fieldInputWrapper}>
                                    <input
                                        type="text"
                                        value={content.footerNote}
                                        onChange={(e) => handleContentField('footerNote', e.target.value)}
                                        placeholder="Bu e-posta yeni başlayan projenizin erişim bilgileri için gönderilmiştir."
                                        className={styles.fieldInput}
                                    />
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Telif / İmza Metni</label>
                                <div className={styles.fieldInputWrapper}>
                                    <input
                                        type="text"
                                        value={content.copyrightText}
                                        onChange={(e) => handleContentField('copyrightText', e.target.value)}
                                        placeholder="© 2026 Cadance Studio. All rights reserved."
                                        className={styles.fieldInput}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ========================================================
                    TAB 2: DESIGN & THEME
                    ======================================================== */}
                {activeTab === 'design' && (
                    <>
                        {/* 1. ACCENT COLOR */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionTitle}>
                                <div className={styles.sectionHeaderLeft}>
                                    <MdPalette size={15} color={design.accentColor} />
                                    <span>Ana Vurgu Rengi (Accent)</span>
                                </div>
                            </div>
                            <CustomColorPicker
                                value={design.accentColor}
                                onChange={(hex) => handleDesignField('accentColor', hex)}
                            />
                        </div>

                        {/* 2. THEME MODE */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionTitle}>
                                <div className={styles.sectionHeaderLeft}>
                                    <span>E-Posta Teması</span>
                                </div>
                            </div>

                            <CustomSegmentControl<EmailThemeMode>
                                options={[
                                    { value: 'dark', label: 'Cadance Dark (Obsidian)' },
                                    { value: 'midnight', label: 'Midnight Black' },
                                    { value: 'light', label: 'Clean Light' },
                                ]}
                                value={design.themeMode}
                                onChange={(mode) => handleDesignField('themeMode', mode)}
                                accentColor={design.accentColor}
                            />
                        </div>

                        {/* 3. HERO BANNER IMAGE */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionTitle}>
                                <div className={styles.sectionHeaderLeft}>
                                    <MdImage size={15} color={design.accentColor} />
                                    <span>Kapak Görseli (Hero Banner)</span>
                                </div>
                            </div>

                            <CustomToggleSwitch
                                checked={design.showHeroImage}
                                onChange={(checked) => handleDesignField('showHeroImage', checked)}
                                label="Kapak Görselini Göster"
                                sublabel="E-posta kartının üst kısmında yüksek çözünürlüklü banner sergiler"
                                accentColor={design.accentColor}
                            />

                            {design.showHeroImage && (
                                <>
                                    <div className={styles.fieldGroup} style={{ marginTop: '0.5rem' }}>
                                        <label className={styles.fieldLabel}>Hazır Mimari / 3D Görseller</label>
                                        <div className={styles.heroImagesGrid}>
                                            {PRESET_HERO_IMAGES.map((img) => {
                                                const isSelected = design.heroImageUrl === img.url;
                                                return (
                                                    <button
                                                        key={img.id}
                                                        type="button"
                                                        className={`${styles.heroThumbBtn} ${isSelected ? styles.heroThumbActive : ''}`}
                                                        onClick={() => handleDesignField('heroImageUrl', img.url)}
                                                    >
                                                        <img src={img.url} alt={img.name} className={styles.thumbImg} />
                                                        <span className={styles.thumbTitle}>{img.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Özel Görsel URL'si</label>
                                        <div className={styles.fieldInputWrapper}>
                                            <input
                                                type="text"
                                                value={design.heroImageUrl}
                                                onChange={(e) => handleDesignField('heroImageUrl', e.target.value)}
                                                placeholder="https://... veya /images/..."
                                                className={styles.fieldInput}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* 4. BRANDING & HEADER */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionTitle}>
                                <div className={styles.sectionHeaderLeft}>
                                    <span>Stüdyo Başlığı & Tipografi</span>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Stüdyo Logosu / Başlık Yazısı</label>
                                <div className={styles.fieldInputWrapper}>
                                    <input
                                        type="text"
                                        value={design.studioName}
                                        onChange={(e) => handleDesignField('studioName', e.target.value)}
                                        placeholder="CADANCE STUDIO"
                                        className={styles.fieldInput}
                                    />
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Buton Köşe Yuvarlaklığı</label>
                                <CustomSegmentControl<ButtonStyleMode>
                                    options={[
                                        { value: 'rounded', label: 'Yuvarlatılmış (6px)' },
                                        { value: 'pill', label: 'Oval / Kapsül (Pill)' },
                                        { value: 'sharp', label: 'Keskin (2px)' },
                                    ]}
                                    value={design.buttonStyle}
                                    onChange={(styleMode) => handleDesignField('buttonStyle', styleMode)}
                                    accentColor={design.accentColor}
                                />
                            </div>

                            <div style={{ paddingTop: '0.4rem' }}>
                                <CustomToggleSwitch
                                    checked={design.showCardBorder}
                                    onChange={(checked) => handleDesignField('showCardBorder', checked)}
                                    label="Kart Çerçevesi (Border)"
                                    sublabel="E-posta kartının etrafında zarif sınır çizgisi"
                                    accentColor={design.accentColor}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* ========================================================
                    TAB 3: SEND & EXPORT
                    ======================================================== */}
                {activeTab === 'send' && (
                    <>
                        <div className={styles.formSection}>
                            <div className={styles.sectionTitle}>
                                <div className={styles.sectionHeaderLeft}>
                                    <MdSend size={15} color={design.accentColor} />
                                    <span>Hızlı Gönderim ve Dışa Aktarım</span>
                                </div>
                            </div>

                            <div className={styles.sendOptionsGrid}>
                                {/* OPTION 0: DIRECT AUTOMATIC SEND VIA .ENV */}
                                {onDirectSend && (
                                    <div
                                        className={styles.sendCardOption}
                                        style={{
                                            background: 'rgba(41, 114, 245, 0.08)',
                                            borderColor: 'rgba(41, 114, 245, 0.28)',
                                        }}
                                    >
                                        <div className={styles.sendCardLeft}>
                                            <div
                                                className={styles.sendOptionIconWrap}
                                                style={{
                                                    background: 'rgba(41, 114, 245, 0.2)',
                                                    color: '#60a5fa',
                                                }}
                                            >
                                                <MdSend />
                                            </div>
                                            <div className={styles.sendOptionTexts}>
                                                <span className={styles.sendOptionTitle}>
                                                    Doğrudan Gönder (.env Otomasyonu)
                                                </span>
                                                <span className={styles.sendOptionDesc}>
                                                    .env dosyasındaki Email_User ve Email_Pass ile anında alıcıya iletir
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={onDirectSend}
                                            disabled={isDirectSending}
                                            className={styles.btnOptionAction}
                                            style={{
                                                background: '#2563eb',
                                                color: '#ffffff',
                                                borderColor: '#3b82f6',
                                            }}
                                        >
                                            <MdSend size={14} />
                                            <span>{isDirectSending ? 'Gönderiliyor...' : 'Şimdi Gönder'}</span>
                                        </button>
                                    </div>
                                )}

                                {/* OPTION 1: MAIL CLIENT */}
                                <div className={styles.sendCardOption}>
                                    <div className={styles.sendCardLeft}>
                                        <div className={styles.sendOptionIconWrap}>
                                            <MdOpenInNew />
                                        </div>
                                        <div className={styles.sendOptionTexts}>
                                            <span className={styles.sendOptionTitle}>Varsayılan E-Posta İstemcisinde Aç</span>
                                            <span className={styles.sendOptionDesc}>
                                                Outlook, Apple Mail veya Thunderbird ile doğrudan taslak oluşturur (mailto)
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onOpenMailClient}
                                        className={styles.btnOptionAction}
                                    >
                                        <MdOpenInNew size={14} />
                                        <span>İstemcide Aç</span>
                                    </button>
                                </div>

                                {/* OPTION 2: COPY HTML */}
                                <div className={styles.sendCardOption}>
                                    <div className={styles.sendCardLeft}>
                                        <div className={styles.sendOptionIconWrap} style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                                            <MdContentCopy />
                                        </div>
                                        <div className={styles.sendOptionTexts}>
                                            <span className={styles.sendOptionTitle}>Canlı HTML Kodunu Kopyala</span>
                                            <span className={styles.sendOptionDesc}>
                                                Tüm e-posta istemcileri ile uyumlu, duyarlı ve inline stilli HTML kodu
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onCopyHtml}
                                        className={styles.btnOptionAction}
                                    >
                                        {isCopied ? <MdOutlineCheckCircle size={14} /> : <MdContentCopy size={14} />}
                                        <span>{isCopied ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
                                    </button>
                                </div>

                                {/* OPTION 3: DOWNLOAD HTML */}
                                <div className={styles.sendCardOption}>
                                    <div className={styles.sendCardLeft}>
                                        <div className={styles.sendOptionIconWrap} style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.12)', borderColor: 'rgba(139, 92, 246, 0.25)' }}>
                                            <MdFileDownload />
                                        </div>
                                        <div className={styles.sendOptionTexts}>
                                            <span className={styles.sendOptionTitle}>.HTML E-Posta Dosyasını İndir</span>
                                            <span className={styles.sendOptionDesc}>
                                                Doğrudan tarayıcıda incelemek veya gönderim servislerine yüklemek için
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onDownloadHtml}
                                        className={styles.btnOptionAction}
                                    >
                                        {downloadSuccess ? <MdOutlineCheckCircle size={14} /> : <MdFileDownload size={14} />}
                                        <span>{downloadSuccess ? 'İndirildi!' : '.html İndir'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RECIPIENT SUMMARY */}
                        <div className={styles.formSection}>
                            <div className={styles.sectionTitle}>
                                <div className={styles.sectionHeaderLeft}>
                                    <MdPersonOutline size={15} color={design.accentColor} />
                                    <span>Gönderim Özeti</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.75rem', color: '#a1a1aa' }}>
                                <div>
                                    <strong style={{ color: '#ffffff' }}>Alıcı: </strong>
                                    {content.clientName} &lt;{content.clientEmail || 'Belirtilmedi'}&gt;
                                </div>
                                <div>
                                    <strong style={{ color: '#ffffff' }}>Konu: </strong>
                                    {content.subject}
                                </div>
                                <div>
                                    <strong style={{ color: '#ffffff' }}>Şablon: </strong>
                                    {templateName}
                                </div>
                                <div>
                                    <strong style={{ color: '#ffffff' }}>Duyarlılık: </strong>
                                    Mobil, Masaüstü ve Tablet cihazlar ile %100 uyumlu
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
