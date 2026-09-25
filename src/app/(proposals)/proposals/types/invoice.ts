export interface InvoiceItem {
    id: string;
    itemNumber: string;
    title: string;
    description: string;
    price: string;
}

export interface InvoiceData {
    documentTitle: string;
    invoiceNumber: string;
    issueDate: string;
    clientName: string;
    clientEmail: string;
    clientAddress: string;
    isBilled: boolean;
    items: InvoiceItem[];
    notes: string;
}

export const initialInvoiceData: InvoiceData = {
    documentTitle: "Mimari Tasarım ve Uygulama Teklifi",
    invoiceNumber: "TEK-2026-001",
    issueDate: "2026-09-19",
    clientName: "Örnek Mimarlık & İnşaat Ltd. Şti.",
    clientEmail: "proje@ornekinsaat.com",
    clientAddress: "Büyükdere Cad. No: 124, Şişli / İstanbul",
    isBilled: true,
    items: [
        {
            id: "1",
            itemNumber: "01",
            title: "Konsept Mimari Tasarım Projesi",
            description: "Avan proje çalışmaları, fonksiyon şeması, vaziyet planı ve 3D görselleştirme.",
            price: "35.000,00",
        },
        {
            id: "2",
            itemNumber: "02",
            title: "Uygulama ve Ruhsat Çizimleri",
            description: "1/50 ölçekli mimari uygulama planları, sistem detayları ve belediye onay dosyası.",
            price: "25.000,00",
        },
    ],
    notes: "Teklif geçerlilik süresi 15 iş günüdür. Belirtilen tutarlar sözleşme imzalanmasını takiben geçerli olup, ödemeler aşama teslimlerinde tahsil edilir.",
};

// Helper to sum all item prices
export const calculateTotal = (items: InvoiceItem[]): string => {
    let sum = 0;
    let hasValidNumber = false;

    for (const item of items) {
        if (!item.price) continue;
        let cleaned = item.price.replace(/[^\d.,]/g, "").trim();
        if (!cleaned) continue;

        if (cleaned.includes(".") && cleaned.includes(",")) {
            if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
                cleaned = cleaned.replace(/\./g, "").replace(",", ".");
            } else {
                cleaned = cleaned.replace(/,/g, "");
            }
        } else if (cleaned.includes(",")) {
            cleaned = cleaned.replace(",", ".");
        }

        const val = parseFloat(cleaned);
        if (!isNaN(val)) {
            sum += val;
            hasValidNumber = true;
        }
    }

    if (!hasValidNumber) return "0,00";
    return sum.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Helper to format date strings for display (e.g. "2026-09-23" -> "23.09.2026")
export const formatDisplayDate = (dateStr?: string): string => {
    if (!dateStr || !dateStr.trim()) return "—";
    const trimmed = dateStr.trim();
    // Already in DD.MM.YYYY format
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) return trimmed;
    // YYYY-MM-DD or ISO string
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
        const [, year, month, day] = ymdMatch;
        return `${day}.${month}.${year}`;
    }
    // Fallback: try parsing with Date
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
        const day = String(parsed.getDate()).padStart(2, "0");
        const month = String(parsed.getMonth() + 1).padStart(2, "0");
        const year = parsed.getFullYear();
        return `${day}.${month}.${year}`;
    }
    return trimmed;
};

