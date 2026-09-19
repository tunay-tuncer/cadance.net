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
