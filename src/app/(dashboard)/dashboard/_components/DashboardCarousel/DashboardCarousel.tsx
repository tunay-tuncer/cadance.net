"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import styles from "./DashboardCarousel.module.css";
import { HiArrowLeft, HiArrowRight } from "react-icons/hi2";

// 1. Sayfa Bileşenleri
import CalendarCard from "../CalendarCard/CalendarCard";
import WeatherCard from "../WeatherCard/WeatherCard";
import TodoCard from "../TodoCard/TodoCard";

// 2. Sayfa Bileşenleri
import GoalsCard from "../GoalsCard/GoalsCard";
import NotesCard from "../NotesCard/NotesCard";
import ShoppingCard from "../ShoppingCard/ShoppingCard";

export default function DashboardCarousel() {
    const [currentPage, setCurrentPage] = useState<number>(0);

    const goToPage = (pageIndex: number) => {
        setCurrentPage(pageIndex);
        if (typeof window !== "undefined" && window.innerWidth <= 768) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <div className={styles.carouselContainer}>
            {/* Üst Kontrol Barı */}
            <div className={styles.topControlBar}>
                <div className={styles.pageIndicator}>
                    <span className={styles.viewBadge}>
                        {currentPage === 0 ? "Daily Operations" : "Studio Workspace"}
                    </span>
                    <div className={styles.dotGroup}>
                        <button
                            type="button"
                            className={`${styles.dot} ${currentPage === 0 ? styles.activeDot : ""}`}
                            onClick={() => goToPage(0)}
                            aria-label="Daily Operations Sayfasına Git"
                        />
                        <button
                            type="button"
                            className={`${styles.dot} ${currentPage === 1 ? styles.activeDot : ""}`}
                            onClick={() => goToPage(1)}
                            aria-label="Studio Workspace Sayfasına Git"
                        />
                    </div>
                </div>

                <div className={styles.navButtonWrapper}>
                    {currentPage === 0 ? (
                        <button
                            type="button"
                            className={styles.navButton}
                            onClick={() => goToPage(1)}
                            aria-label="Studio Workspace Sayfasına Git"
                        >
                            <span className={styles.btnText}>Studio Workspace</span>
                            <HiArrowRight className={styles.navIcon} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={styles.navButton}
                            onClick={() => goToPage(0)}
                            aria-label="Daily Operations Sayfasına Dön"
                        >
                            <HiArrowLeft className={styles.navIcon} />
                            <span className={styles.btnText}>Daily Operations</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Viewport & Continuous Slider Track */}
            <div className={styles.viewport}>
                <motion.div
                    className={styles.sliderTrack}
                    animate={{ x: currentPage === 0 ? "0%" : "-50%" }}
                    transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 28,
                        mass: 0.8,
                    }}
                >
                    {/* 1. Sayfa: Daily Operations */}
                    <div
                        className={styles.sliderSlide}
                        inert={currentPage !== 0 ? true : undefined}
                    >
                        <div className={styles.datePageContainer}>
                            <CalendarCard />
                            <WeatherCard />
                            <TodoCard />
                        </div>
                    </div>

                    {/* 2. Sayfa: Studio Workspace */}
                    <div
                        className={styles.sliderSlide}
                        inert={currentPage !== 1 ? true : undefined}
                    >
                        <div className={styles.workspacePageContainer}>
                            <div className={styles.div1}>
                                <NotesCard />
                            </div>
                            <div className={styles.div2}>
                                <GoalsCard />
                            </div>
                            <div className={styles.div3}>
                                <ShoppingCard />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
