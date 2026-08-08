import styles from "./Navbar.module.css";

interface StockResponse {
    price: number;
    [key: string]: unknown;
}

async function getCurrencyPrice(symbol: string): Promise<number | null> {
    const CURRENCY_URL = process.env.NINJA_API_STOCK_URL || process.env.NEXT_PUBLIC_NINJA_API_STOCK_URL;
    const NINJA_API_KEY = process.env.NINJA_API_KEY || process.env.NEXT_PUBLIC_NINJA_API_KEY;

    if (!CURRENCY_URL || !NINJA_API_KEY) return null;

    try {
        const res = await fetch(`${CURRENCY_URL}${symbol}`, {
            headers: { "X-Api-Key": NINJA_API_KEY },
            next: { revalidate: 3600 },
        });

        if (!res.ok) return null;

        const data: StockResponse = await res.json();
        return data.price;
    } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        return null;
    }
}

const Currency = async () => {
    const [usdPrice, eurPrice, xauPrice] = await Promise.all([
        getCurrencyPrice("USDTRY"),
        getCurrencyPrice("EURTRY"),
        getCurrencyPrice("XAUTRY"),
    ]);

    const usd = usdPrice ?? 35;
    const eur = eurPrice ?? 37;
    const gold = xauPrice ? (xauPrice / 31.1035).toFixed(3) : 3000;

    return (
        <div className={styles.currencyContainer}>
            <p>USD: <span className={styles.bold}>{usd}</span></p>
            <p>EUR: <span className={styles.bold}>{eur}</span></p>
            <p>GOLD: <span className={styles.bold}>{gold}</span></p>
        </div>
    );
};

export default Currency;