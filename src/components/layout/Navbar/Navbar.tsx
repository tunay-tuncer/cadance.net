'use client';

// DEPENDENCIES
import Link from "next/link";
import { ReactNode, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
    MdMenu,
    MdClose,
    MdHome,
    MdDashboard,
    MdAttachMoney,
    MdWorkOutline,
} from "react-icons/md";
// STYLES
import styles from "./Navbar.module.css";
// COMPONENTS
import User from "@/app/(home)/login/_components/User";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
    currencySlot?: ReactNode;
}

const Navbar = ({ currencySlot }: NavbarProps) => {
    const { user } = useAuth();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const navRef = useRef<HTMLElement>(null);

    // Close mobile menu on pathname change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Close when clicking outside navbar or on Escape key
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setIsMobileMenuOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMobileMenuOpen]);

    return (
        <nav className={styles.navBar} ref={navRef}>
            {/* MOBILE HAMBURGER BUTTON */}
            <button
                type="button"
                className={styles.mobileHamburgerBtn}
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMobileMenuOpen}
            >
                {isMobileMenuOpen ? <MdClose size={22} /> : <MdMenu size={22} />}
            </button>

            {/* DESKTOP NAV LINKS */}
            <div className={styles.navContainer}>
                <Link
                    href={"/"}
                    className={pathname === "/" ? styles.activeNavLink : ""}
                >
                    HOME
                </Link>
                {user && (
                    <Link
                        href={"/dashboard"}
                        className={pathname === "/dashboard" ? styles.activeNavLink : ""}
                    >
                        DASHBOARD
                    </Link>
                )}
                {user && (
                    <Link
                        href={"/projects"}
                        className={pathname === "/projects" ? styles.activeNavLink : ""}
                    >
                        PROJECTS
                    </Link>
                )}
                {user && (
                    <Link
                        href={"/finance"}
                        className={pathname === "/finance" ? styles.activeNavLink : ""}
                    >
                        FINANCE
                    </Link>
                )}
            </div>

            {/* Render the pre-rendered Server Component slot if user is logged in (desktop) */}
            {user && currencySlot}

            <User />

            {/* MOBILE COLLAPSIBLE DRAWER */}
            {isMobileMenuOpen && (
                <div className={styles.mobileMenuDrawer}>
                    <div className={styles.mobileLinksList}>
                        <Link
                            href={"/"}
                            className={`${styles.mobileNavLink} ${pathname === "/" ? styles.activeMobileLink : ""}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <MdHome size={18} className={styles.mobileLinkIcon} />
                            <span>HOME</span>
                        </Link>
                        {user && (
                            <Link
                                href={"/dashboard"}
                                className={`${styles.mobileNavLink} ${pathname === "/dashboard" ? styles.activeMobileLink : ""}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <MdDashboard size={18} className={styles.mobileLinkIcon} />
                                <span>DASHBOARD</span>
                            </Link>
                        )}
                        {user && (
                            <Link
                                href={"/projects"}
                                className={`${styles.mobileNavLink} ${pathname === "/projects" ? styles.activeMobileLink : ""}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <MdWorkOutline size={18} className={styles.mobileLinkIcon} />
                                <span>PROJECTS</span>
                            </Link>
                        )}
                        {user && (
                            <Link
                                href={"/finance"}
                                className={`${styles.mobileNavLink} ${pathname === "/finance" ? styles.activeMobileLink : ""}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <MdAttachMoney size={18} className={styles.mobileLinkIcon} />
                                <span>FINANCE</span>
                            </Link>
                        )}
                    </div>

                    {user && currencySlot && (
                        <div className={styles.mobileCurrencySlot}>
                            {currencySlot}
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;