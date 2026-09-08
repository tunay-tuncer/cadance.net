"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
    const [direction, setDirection] = useState<number>(0);

    const paginate = (newDirection: number) => {
        setDirection(newDirection);
        setCurrentPage((prev) => prev + newDirection);
    };

    const slideVariants: Variants = {
        enter: (dir: number) => ({
            x: dir > 0 ? "100%" : "-100%",
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
            transition: {
                x: { type: "spring", stiffness: 280, damping: 28 },
                opacity: { duration: 0.1 },
            },
        },
        exit: (dir: number) => ({
            x: dir < 0 ? "100%" : "-100%",
            opacity: 0,
            transition: {
                x: { type: "spring", stiffness: 280, damping: 28 },
                opacity: { duration: 0.1 },
            },
        }),
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
                        <span className={`${styles.dot} ${currentPage === 0 ? styles.activeDot : ""}`} />
                        <span className={`${styles.dot} ${currentPage === 1 ? styles.activeDot : ""}`} />
                    </div>
                </div>

                <div className={styles.navButtonWrapper}>
                    {currentPage === 0 ? (
                        <button
                            type="button"
                            className={styles.navButton}
                            onClick={() => paginate(1)}
                            aria-label="Studio Workspace Sayfasına Git"
                        >
                            <span className={styles.btnText}>Studio Workspace</span>
                            <HiArrowRight className={styles.navIcon} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={styles.navButton}
                            onClick={() => paginate(-1)}
                            aria-label="Daily Operations Sayfasına Dön"
                        >
                            <HiArrowLeft className={styles.navIcon} />
                            <span className={styles.btnText}>Daily Operations</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Viewport */}
            <div className={styles.viewport}>
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    {currentPage === 0 ? (
                        <motion.div
                            key="page-daily"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className={styles.datePageContainer}
                        >
                            {/* Orijinal 5x5 Grid Yerleşimi */}
                            <CalendarCard />
                            <WeatherCard />
                            <TodoCard />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="page-workspace"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className={styles.workspacePageContainer}
                        >
                            {/* 2. Sayfa Grid Yerleşimi */}
                            <div className={styles.div1}>
                                <NotesCard />
                            </div>
                            <div className={styles.div2}>
                                <GoalsCard />
                            </div>
                            <div className={styles.div3}>
                                <ShoppingCard />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
