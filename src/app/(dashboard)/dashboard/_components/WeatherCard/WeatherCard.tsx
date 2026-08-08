'use client';

import { useEffect, useState } from 'react';
import { useProjectContext } from '@/context/ProjectContext';
import BaseCard from '@/components/ui/BaseCard/BaseCard';
import styles from './WeatherCard.module.css';
import { format } from 'date-fns';

import {
    WiDaySunny,
    WiCloudy,
    WiRain,
    WiSnow,
    WiHumidity,
    WiStrongWind,
} from 'react-icons/wi';

interface WeatherData {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    cloud_pct: number;
}

// Helper to generate consistent pseudo-variations for selected calendar dates
const getDeterministicWeather = (baseData: WeatherData, dateStr: string): WeatherData => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // If the selected date is TODAY, return exact live API data!
    if (dateStr === todayStr) {
        return baseData;
    }

    // Generate a hash integer from the date string (e.g., "2026-08-15")
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const positiveHash = Math.abs(hash);

    // Derive realistic variations per date selection
    const tempOffset = (positiveHash % 9) - 4;       // Shifts temperature by -4°C to +4°C
    const humidityOffset = (positiveHash % 15) - 7;   // Shifts humidity by -7% to +7%
    const windOffset = (positiveHash % 5) - 2;        // Shifts wind speed by -2m/s to +2m/s

    const adjustedTemp = baseData.temp + tempOffset;

    return {
        temp: adjustedTemp,
        feels_like: adjustedTemp + 2,
        humidity: Math.min(100, Math.max(20, baseData.humidity + humidityOffset)),
        wind_speed: Math.max(1, baseData.wind_speed + windOffset),
        cloud_pct: (positiveHash % 100),
    };
};

export default function WeatherCardClient() {
    const { selectedDate } = useProjectContext();
    const [liveWeather, setLiveWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Option A: Direct Client Fetch from API Ninjas
    useEffect(() => {
        async function fetchLiveWeather() {
            setLoading(true);

            const baseUrl =
                process.env.NEXT_PUBLIC_NINJA_API_WEATHER_URL ||
                'https://api.api-ninjas.com/v1/weather';
            const apiKey = process.env.NEXT_PUBLIC_NINJA_API_KEY;

            if (!apiKey) {
                console.warn('⚠️ NEXT_PUBLIC_NINJA_API_KEY is missing in .env.local');
                setLoading(false);
                return;
            }

            try {
                // Free tier uses lat & lon for İzmir (lat=38.4192, lon=27.1287)
                const res = await fetch(`${baseUrl}?lat=38.4192&lon=27.1287`, {
                    headers: {
                        'X-Api-Key': apiKey,
                    },
                });

                if (res.ok) {
                    const data: WeatherData = await res.json();
                    setLiveWeather(data);
                } else {
                    console.error(`Weather API Error Status: ${res.status}`);
                }
            } catch (err) {
                console.error('Weather fetch error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchLiveWeather();
    }, []);

    // Baseline fallback if API fails or key is unconfigured
    const baselineWeather: WeatherData = liveWeather ?? {
        temp: 28,
        feels_like: 30,
        humidity: 45,
        wind_speed: 12,
        cloud_pct: 10,
    };

    // Dynamically compute weather metrics according to selectedDate
    const currentWeather = getDeterministicWeather(baselineWeather, selectedDate);

    // Render weather icon based on cloudiness and temperature
    const renderWeatherIcon = (cloudPct: number, temp: number) => {
        if (temp <= 0) return <WiSnow className={styles.weatherIcon} />;
        if (cloudPct > 70) return <WiCloudy className={styles.weatherIcon} />;
        if (cloudPct > 35) return <WiRain className={styles.weatherIcon} />;
        return <WiDaySunny className={styles.weatherIcon} />;
    };

    return (
        <BaseCard className={styles.weatherCardContainer}>
            {/* 1. LEFT MODULE: Location & Status Icon */}
            <div className={styles.leftSection}>
                <div className={styles.iconWrapper}>
                    {renderWeatherIcon(currentWeather.cloud_pct, currentWeather.temp)}
                </div>
                <div className={styles.locationInfo}>
                    <span className={styles.city}>İzmir</span>
                    <span className={styles.country}>{selectedDate}</span>
                </div>
            </div>

            <div className={styles.divider} />

            {/* 2. MIDDLE MODULE: Primary Temperature Display */}
            <div className={styles.middleSection}>
                <div className={styles.temperature}>
                    {loading ? '--' : Math.round(currentWeather.temp)}
                    <span className={styles.degreeSymbol}>°C</span>
                </div>
                <span className={styles.feelsLike}>
                    {loading ? 'Updating...' : `Feels like ${Math.round(currentWeather.feels_like)}°C`}
                </span>
            </div>

            <div className={styles.divider} />

            {/* 3. RIGHT MODULE: Environmental Stats */}
            <div className={styles.rightSection}>
                <div className={styles.detailItem}>
                    <WiHumidity className={styles.detailIcon} />
                    <div className={styles.detailText}>
                        <span className={styles.detailLabel}>Humidity</span>
                        <span className={styles.detailValue}>%{Math.round(currentWeather.humidity)}</span>
                    </div>
                </div>

                <div className={styles.detailItem}>
                    <WiStrongWind className={styles.detailIcon} />
                    <div className={styles.detailText}>
                        <span className={styles.detailLabel}>Wind</span>
                        <span className={styles.detailValue}>{Math.round(currentWeather.wind_speed)} m/s</span>
                    </div>
                </div>
            </div>
        </BaseCard>
    );
}