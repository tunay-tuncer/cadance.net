'use client';

// DEPENDENCIES
import Link from "next/link";
import { ReactNode } from "react";
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

    return (
        <nav className={styles.navBar}>
            <div className={styles.navContainer}>
                <Link href={"/"}>HOME</Link>
                {user && <Link href={"/dashboard"}>DASHBOARD</Link>}
            </div>

            {/* Render the pre-rendered Server Component slot if user is logged in */}
            {user && currencySlot}

            <User />
        </nav>
    );
};

export default Navbar;