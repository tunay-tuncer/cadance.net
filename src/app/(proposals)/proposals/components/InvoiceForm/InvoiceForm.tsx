"use client";

import { ChangeEvent } from "react";
import { TbFileInvoice, TbPlus, TbTrash } from "react-icons/tb";
import CustomDatePicker from "@/components/ui/CustomDatePicker/CustomDatePicker";
import { InvoiceData, InvoiceItem, calculateTotal } from "../../types/invoice";
import styles from "./InvoiceForm.module.css";

interface InvoiceFormProps {
    data: InvoiceData;
    onChange: <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => void;
    onAddItem: () => void;
    onDeleteItem: (id: string) => void;
    onItemChange: (id: string, field: keyof InvoiceItem, value: string) => void;
}

export default function InvoiceForm({
    data,
    onChange,
    onAddItem,
    onDeleteItem,
    onItemChange,
}: InvoiceFormProps) {
    const handleInputChange =
        <K extends keyof InvoiceData>(field: K) =>
        (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            onChange(field, e.target.value as InvoiceData[K]);
        };

    const calculatedTotal = calculateTotal(data.items);

    return (
        <div className={styles.formCard}>
            <div className={styles.headerArea}>
                <div className={styles.titleWrapper}>
                    <TbFileInvoice className={styles.headerIcon} />
                    <h2 className={styles.sectionTitle}>Teklif Düzenleyici</h2>
                </div>
                <span className={styles.badge}>Canlı Önizleme</span>
            </div>

            <div className={styles.formBody}>
                {/* 1. TEKLİF BİLGİLERİ */}
                <div className={styles.sectionGroup}>
                    <span className={styles.groupLabel}>Teklif Bilgileri</span>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel}>Teklif Başlığı</label>
                        <input
                            type="text"
                            value={data.documentTitle}
                            onChange={handleInputChange("documentTitle")}
                            placeholder="Örn: Mimari Tasarım ve Uygulama Teklifi"
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.rowGrid}>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>Teklif Numarası</label>
                            <input
                                type="text"
                                value={data.invoiceNumber}
                                onChange={handleInputChange("invoiceNumber")}
                                placeholder="TEK-2026-001"
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>Teklif Tarihi</label>
                            <CustomDatePicker
                                value={data.issueDate}
                                onChange={(val) => onChange("issueDate", val)}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. FATURALI MI? (isBilled & +KDV) */}
                <div className={styles.sectionGroup}>
                    <span className={styles.groupLabel}>Fatura & KDV Durumu</span>
                    <div className={styles.radioGroup}>
                        <label
                            className={`${styles.radioCard} ${
                                data.isBilled ? styles.radioCardActive : ""
                            }`}
                        >
                            <input
                                type="radio"
                                name="isBilled"
                                checked={data.isBilled === true}
                                onChange={() => onChange("isBilled", true)}
                                className={styles.radioInput}
                            />
                            <div className={styles.radioTextWrapper}>
                                <span className={styles.radioTitle}>Faturalı (+ KDV)</span>
                                <span className={styles.radioSubtitle}>
                                    Tutara "+ KDV" ibaresi eklenir
                                </span>
                            </div>
                        </label>
                        <label
                            className={`${styles.radioCard} ${
                                !data.isBilled ? styles.radioCardActive : ""
                            }`}
                        >
                            <input
                                type="radio"
                                name="isBilled"
                                checked={data.isBilled === false}
                                onChange={() => onChange("isBilled", false)}
                                className={styles.radioInput}
                            />
                            <div className={styles.radioTextWrapper}>
                                <span className={styles.radioTitle}>Faturasız</span>
                                <span className={styles.radioSubtitle}>
                                    Yalnızca net teklif tutarı gösterilir
                                </span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* 3. MÜŞTERİ BİLGİLERİ */}
                <div className={styles.sectionGroup}>
                    <span className={styles.groupLabel}>Müşteri Bilgileri</span>
                    <div className={styles.rowGrid}>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>Müşteri / Firma Adı</label>
                            <input
                                type="text"
                                value={data.clientName}
                                onChange={handleInputChange("clientName")}
                                placeholder="Örn: Cadance Mimarlık Ltd. Şti."
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel}>E-posta Adresi</label>
                            <input
                                type="email"
                                value={data.clientEmail}
                                onChange={handleInputChange("clientEmail")}
                                placeholder="iletisim@firma.com"
                                className={styles.input}
                            />
                        </div>
                    </div>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel}>Fatura / İletişim Adresi</label>
                        <input
                            type="text"
                            value={data.clientAddress}
                            onChange={handleInputChange("clientAddress")}
                            placeholder="Cadde, Sokak, No, İlçe / İl"
                            className={styles.input}
                        />
                    </div>
                </div>

                {/* 4. HİZMET / KALEMLER (ÇOKLU KALEM LİSTESİ) */}
                <div className={styles.sectionGroup}>
                    <div className={styles.groupHeaderRow}>
                        <span className={styles.groupLabel}>Hizmet / Kalem Listesi</span>
                    </div>

                    <div className={styles.itemsList}>
                        {data.items.map((item, index) => (
                            <div key={item.id} className={styles.itemCard}>
                                <div className={styles.itemCardHeader}>
                                    <span className={styles.itemNumberBadge}>
                                        Kalem #{index + 1}
                                    </span>
                                    {data.items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => onDeleteItem(item.id)}
                                            className={styles.deleteItemBtn}
                                            title="Kalemi Sil"
                                        >
                                            <TbTrash size={14} />
                                            <span>Sil</span>
                                        </button>
                                    )}
                                </div>

                                <div className={styles.itemTopGrid}>
                                    <div className={styles.field}>
                                        <label className={styles.fieldLabel}>No</label>
                                        <input
                                            type="text"
                                            value={item.itemNumber}
                                            onChange={(e) =>
                                                onItemChange(item.id, "itemNumber", e.target.value)
                                            }
                                            placeholder="01"
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.fieldLabel}>Hizmet / Başlık</label>
                                        <input
                                            type="text"
                                            value={item.title}
                                            onChange={(e) =>
                                                onItemChange(item.id, "title", e.target.value)
                                            }
                                            placeholder="Hizmet veya ürün başlığı"
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.fieldLabel}>Fiyat (₺)</label>
                                        <input
                                            type="text"
                                            value={item.price}
                                            onChange={(e) =>
                                                onItemChange(item.id, "price", e.target.value)
                                            }
                                            placeholder="0,00"
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.fieldLabel}>Açıklama</label>
                                    <textarea
                                        value={item.description}
                                        onChange={(e) =>
                                            onItemChange(item.id, "description", e.target.value)
                                        }
                                        placeholder="Hizmet kapsamı, teknik detaylar ve açıklamalar..."
                                        className={styles.textarea}
                                        style={{ minHeight: "55px" }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={onAddItem}
                        className={styles.addItemBtn}
                    >
                        <TbPlus size={16} />
                        <span>Yeni Kalem Ekle</span>
                    </button>

                    <div className={styles.totalSummaryBar}>
                        <span className={styles.totalSummaryLabel}>Hesaplanan Toplam:</span>
                        <span className={styles.totalSummaryValue}>
                            ₺ {calculatedTotal}
                            {data.isBilled && <span className={styles.kdvBadge}>+ KDV</span>}
                        </span>
                    </div>
                </div>

                {/* 5. NOTLAR VE AÇIKLAMALAR */}
                <div className={styles.sectionGroup}>
                    <span className={styles.groupLabel}>Notlar & Şartlar</span>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel}>Teklif Notları</label>
                        <textarea
                            value={data.notes}
                            onChange={handleInputChange("notes")}
                            placeholder="Ödeme koşulları, geçerlilik süresi veya banka hesap bilgileri..."
                            className={styles.textarea}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
