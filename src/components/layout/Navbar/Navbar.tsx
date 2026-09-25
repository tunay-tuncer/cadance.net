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
import { BsPiggyBank } from "react-icons/bs";
import { TbCalculator, TbFileInvoice } from "react-icons/tb";
import { FaChevronDown } from "react-icons/fa";
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
    const [isproposalsDropdownOpen, setIsproposalsDropdownOpen] = useState<boolean>(false);
    const [isMobileproposalsOpen, setIsMobileproposalsOpen] = useState<boolean>(false);
    const navRef = useRef<HTMLElement>(null);
    const dropdownTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnterproposals = () => {
        if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
        setIsproposalsDropdownOpen(true);
    };

    const handleMouseLeaveproposals = () => {
        dropdownTimerRef.current = setTimeout(() => {
            setIsproposalsDropdownOpen(false);
        }, 150);
    };

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
                {/* {user && (
                    <Link
                        href={"/investment"}
                        className={pathname === "/investment" ? styles.activeNavLink : ""}
                    >
                        INVESTMENT
                    </Link>
                )} */}
                {user && (
                    <div
                        className={styles.proposalsDropdownWrapper}
                        onMouseEnter={handleMouseEnterproposals}
                        onMouseLeave={handleMouseLeaveproposals}
                    >
                        <button
                            type="button"
                            className={`${styles.navDropdownTrigger} ${pathname?.startsWith("/proposals") || pathname?.startsWith("/invoice") ? styles.activeNavLink : ""
                                }`}
                            onClick={() => setIsproposalsDropdownOpen((prev) => !prev)}
                            aria-expanded={isproposalsDropdownOpen}
                        >
                            <span>PROPOSALS</span>
                            <FaChevronDown
                                size={9}
                                className={`${styles.dropdownChevron} ${isproposalsDropdownOpen ? styles.dropdownChevronOpen : ""
                                    }`}
                            />
                        </button>

                        {isproposalsDropdownOpen && (
                            <div className={styles.proposalsDropdownMenu}>
                                <Link
                                    href="/proposals/calculator"
                                    className={`${styles.dropdownItem} ${pathname === "/proposals/calculator" || pathname === "/invoice/calculator" ? styles.activeDropdownItem : ""
                                        }`}
                                    onClick={() => setIsproposalsDropdownOpen(false)}
                                >
                                    <TbCalculator size={18} className={styles.dropdownItemIcon} />
                                    <div className={styles.dropdownItemText}>
                                        <span className={styles.dropdownItemTitle}>Proposal Calculator</span>
                                        <span className={styles.dropdownItemDesc}>İş kalemi ve maliyet hesaplayıcı</span>
                                    </div>
                                </Link>
                                <Link
                                    href="/proposals"
                                    className={`${styles.dropdownItem} ${pathname === "/proposals" || pathname === "/invoice" ? styles.activeDropdownItem : ""
                                        }`}
                                    onClick={() => setIsproposalsDropdownOpen(false)}
                                >
                                    <TbFileInvoice size={18} className={styles.dropdownItemIcon} />
                                    <div className={styles.dropdownItemText}>
                                        <span className={styles.dropdownItemTitle}>Proposal Builder</span>
                                        <span className={styles.dropdownItemDesc}>Canlı PDF teklif & fatura</span>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>
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
                        {/* {user && (
                            <Link
                                href={"/investment"}
                                className={`${styles.mobileNavLink} ${pathname === "/investment" ? styles.activeMobileLink : ""}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <BsPiggyBank size={18} className={styles.mobileLinkIcon} />
                                <span>INVESTMENT</span>
                            </Link>
                        )} */}
                        {user && (
                            <div className={styles.mobileCollapsibleWrapper}>
                                <button
                                    type="button"
                                    className={`${styles.mobileNavLink} ${styles.mobileCollapsibleTrigger} ${pathname?.startsWith("/proposals") || pathname?.startsWith("/invoice") ? styles.activeMobileLink : ""
                                        }`}
                                    onClick={() => setIsMobileproposalsOpen((prev) => !prev)}
                                >
                                    <div className={styles.mobileCollapsibleTitle}>
                                        <TbFileInvoice size={18} className={styles.mobileLinkIcon} />
                                        <span>PROPOSALS</span>
                                    </div>
                                    <FaChevronDown
                                        size={11}
                                        className={`${styles.dropdownChevron} ${isMobileproposalsOpen ? styles.dropdownChevronOpen : ""
                                            }`}
                                    />
                                </button>

                                {isMobileproposalsOpen && (
                                    <div className={styles.mobileSubLinks}>
                                        <Link
                                            href="/proposals/calculator"
                                            className={`${styles.mobileSubNavLink} ${pathname === "/proposals/calculator" || pathname === "/invoice/calculator" ? styles.activeMobileSubLink : ""
                                                }`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <TbCalculator size={16} />
                                            <span>Proposal Calculator</span>
                                        </Link>
                                        <Link
                                            href="/proposals"
                                            className={`${styles.mobileSubNavLink} ${pathname === "/proposals" || pathname === "/invoice" ? styles.activeMobileSubLink : ""
                                                }`}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <TbFileInvoice size={16} />
                                            <span>Proposal Builder</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
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