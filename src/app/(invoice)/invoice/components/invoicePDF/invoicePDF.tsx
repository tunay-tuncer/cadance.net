import { Page, Image, Text, View, Font, Document, StyleSheet } from "@react-pdf/renderer";
import { InvoiceData, calculateTotal } from "../../types/invoice";

// Register Noto Sans font for full Unicode & Turkish Lira (₺, U+20BA) character support
Font.register({
    family: "Noto Sans",
    fonts: [
        {
            src: "https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A99d.ttf",
            fontWeight: "normal",
        },
        {
            src: "https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyAaBN9d.ttf",
            fontWeight: "bold",
        },
    ],
});

// Disable hyphenation for clean Turkish text wrapping
Font.registerHyphenationCallback((word) => [word]);

// PDF styling with full Turkish font support
const styles = StyleSheet.create({
    page: {
        padding: 36,
        fontSize: 9,
        fontFamily: "Noto Sans",
        color: "#27272a",
        backgroundColor: "#ffffff",
        lineHeight: 1.45,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 16,
        borderBottomWidth: 1.5,
        borderBottomColor: "#e4e4e7",
    },
    logoWrapper: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    logo: {
        width: 48,
        height: 48,
        objectFit: "contain",
    },
    logoTextWrapper: {
        flexDirection: "column",
        justifyContent: "center",
        gap: 4,
    },
    brandTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#09090b",
        letterSpacing: 0.2,
    },
    docSub: {
        fontSize: 9,
        color: "#71717a",
        marginTop: 2,
    },
    metaBlock: {
        alignItems: "flex-end",
    },
    invoiceNumber: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#2972f5",
    },
    dateText: {
        fontSize: 8.5,
        color: "#71717a",
        marginTop: 3,
    },
    docTitleBanner: {
        marginTop: 14,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#f8fafc",
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: "#2972f5",
    },
    docTitleText: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#18181b",
    },
    section: {
        marginTop: 16,
    },
    twoCol: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 16,
    },
    col: {
        flex: 1,
        backgroundColor: "#fafafa",
        padding: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#f4f4f5",
    },
    label: {
        fontSize: 7.5,
        fontWeight: "bold",
        color: "#71717a",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    valPrimary: {
        fontSize: 10.5,
        fontWeight: "bold",
        color: "#18181b",
    },
    valSecondary: {
        fontSize: 8.5,
        color: "#52525b",
        marginTop: 2,
    },
    table: {
        marginTop: 18,
        borderWidth: 1,
        borderColor: "#e4e4e7",
        borderRadius: 6,
        overflow: "hidden",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f4f4f5",
        paddingVertical: 7,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#e4e4e7",
        alignItems: "center",
    },
    colNo: {
        width: "8%",
        textAlign: "center",
    },
    colTitle: {
        width: "30%",
        paddingRight: 6,
    },
    colDesc: {
        width: "44%",
        paddingRight: 6,
    },
    colPrice: {
        width: "18%",
        textAlign: "right",
    },
    thText: {
        fontSize: 8,
        fontWeight: "bold",
        color: "#52525b",
        textTransform: "uppercase",
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f4f4f5",
        alignItems: "flex-start",
    },
    tableRowAlt: {
        backgroundColor: "#fafafa",
    },
    tdTextNo: {
        fontSize: 8.5,
        color: "#71717a",
        fontWeight: "bold",
    },
    tdTextTitle: {
        fontSize: 8.5,
        fontWeight: "bold",
        color: "#18181b",
    },
    tdTextDesc: {
        fontSize: 8,
        color: "#52525b",
        lineHeight: 1.35,
    },
    tdTextPrice: {
        fontSize: 8.5,
        fontWeight: "bold",
        color: "#18181b",
    },
    totalWrapper: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 14,
    },
    totalBox: {
        minWidth: 220,
        backgroundColor: "#f8fafc",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    totalLabel: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#475569",
        textTransform: "uppercase",
    },
    totalValue: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#2972f5",
    },
    notesSection: {
        marginTop: 18,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#f4f4f5",
    },
    notesLabel: {
        fontSize: 7.5,
        fontWeight: "bold",
        color: "#71717a",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    notesText: {
        fontSize: 8,
        color: "#52525b",
        lineHeight: 1.4,
    },
    footer: {
        position: "absolute",
        bottom: 24,
        left: 36,
        right: 36,
        textAlign: "center",
        fontSize: 7.5,
        color: "#a1a1aa",
        borderTopWidth: 1,
        borderTopColor: "#f4f4f5",
        paddingTop: 8,
    },
});

interface DocumentProps {
    data: InvoiceData;
}

export const MyDocument = ({ data }: DocumentProps) => {
    const logoUrl =
        "https://res.cloudinary.com/dabmjz0xr/image/upload/v1774878670/LogoBluePNG_ul26pj.png";
    const totalAmount = calculateTotal(data.items);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* 1. Header with Logo and Info */}
                <View style={styles.header}>
                    <View style={styles.logoWrapper}>
                        <Image src={logoUrl} style={styles.logo} />
                        <View style={styles.logoTextWrapper}>
                            <Text style={styles.brandTitle}>CADANCE MİMARLIK</Text>
                            <Text style={styles.docSub}>Sanayi ve Ticaret Limited Şirketi</Text>
                        </View>
                    </View>
                    <View style={styles.metaBlock}>
                        <Text style={styles.invoiceNumber}>
                            {data.invoiceNumber || "TEK-001"}
                        </Text>
                        <Text style={styles.dateText}>
                            Teklif Tarihi: {data.issueDate || "—"}
                        </Text>
                    </View>
                </View>

                {/* 2. Document Title Banner */}
                {data.documentTitle ? (
                    <View style={styles.docTitleBanner}>
                        <Text style={styles.docTitleText}>{data.documentTitle}</Text>
                    </View>
                ) : null}

                {/* 3. Müşteri Bilgileri & Fatura Durumu */}
                <View style={[styles.section, styles.twoCol]}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Müşteri Bilgileri</Text>
                        <Text style={styles.valPrimary}>
                            {data.clientName || "Müşteri Adı Belirtilmedi"}
                        </Text>
                        {data.clientEmail ? (
                            <Text style={styles.valSecondary}>{data.clientEmail}</Text>
                        ) : null}
                        {data.clientAddress ? (
                            <Text style={styles.valSecondary}>{data.clientAddress}</Text>
                        ) : null}
                    </View>

                    <View style={styles.col}>
                        <Text style={styles.label}>Teklif ve Fatura Durumu</Text>
                        <Text style={styles.valPrimary}>
                            {data.isBilled ? "Faturalı Teklif (+ KDV)" : "Faturasız Teklif"}
                        </Text>
                        <Text style={styles.valSecondary}>
                            {data.isBilled
                                ? "Fiyatlara KDV tutarı dahil değildir (+KDV eklenecektir)"
                                : "KDV uygulanmamıştır"}
                        </Text>
                    </View>
                </View>

                {/* 4. Kalemler / Hizmetler Tablosu */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <View style={styles.colNo}>
                            <Text style={styles.thText}>No</Text>
                        </View>
                        <View style={styles.colTitle}>
                            <Text style={styles.thText}>Hizmet / Kalem</Text>
                        </View>
                        <View style={styles.colDesc}>
                            <Text style={styles.thText}>Açıklama</Text>
                        </View>
                        <View style={styles.colPrice}>
                            <Text style={styles.thText}>Tutar</Text>
                        </View>
                    </View>

                    {data.items && data.items.length > 0 ? (
                        data.items.map((item, index) => {
                            const formattedPrice = item.price
                                ? item.price.includes("₺") || item.price.toLowerCase().includes("tl")
                                    ? item.price
                                    : `₺ ${item.price}`
                                : "₺ 0,00";

                            return (
                                <View
                                    key={item.id || index}
                                    style={[
                                        styles.tableRow,
                                        index % 2 === 1 ? styles.tableRowAlt : {},
                                    ]}
                                >
                                    <View style={styles.colNo}>
                                        <Text style={styles.tdTextNo}>
                                            {item.itemNumber || String(index + 1).padStart(2, "0")}
                                        </Text>
                                    </View>
                                    <View style={styles.colTitle}>
                                        <Text style={styles.tdTextTitle}>
                                            {item.title || "—"}
                                        </Text>
                                    </View>
                                    <View style={styles.colDesc}>
                                        <Text style={styles.tdTextDesc}>
                                            {item.description || "—"}
                                        </Text>
                                    </View>
                                    <View style={styles.colPrice}>
                                        <Text style={styles.tdTextPrice}>
                                            {formattedPrice}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.tableRow}>
                            <View style={{ flex: 1, padding: 8, alignItems: "center" }}>
                                <Text style={styles.tdTextDesc}>Kalem bulunmamaktadır.</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* 5. Toplam Tutar (+ KDV kontrolü) */}
                <View style={styles.totalWrapper}>
                    <View style={styles.totalBox}>
                        <Text style={styles.totalLabel}>Genel Toplam:</Text>
                        <Text style={styles.totalValue}>
                            ₺ {totalAmount}
                            {data.isBilled ? " + KDV" : ""}
                        </Text>
                    </View>
                </View>

                {/* 6. Notlar & Şartlar */}
                {data.notes ? (
                    <View style={styles.notesSection}>
                        <Text style={styles.notesLabel}>Notlar & Şartlar</Text>
                        <Text style={styles.notesText}>{data.notes}</Text>
                    </View>
                ) : null}

                {/* 7. Footer */}
                <Text style={styles.footer}>
                    Cadance Mimarlık San. Tic. A.Ş. • info@cadancestudio.com • www.cadancestudio.com • Tüm hakları saklıdır
                </Text>
            </Page>
        </Document>
    );
};
