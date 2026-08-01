'use client';

import Link from "next/link";
import styles from "./Navbar.module.css";
import User from "@/app/(home)/login/_components/User";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
    const { user } = useAuth();

    return (
        <nav className={styles.navBar}>
            <div className={styles.navContainer}>
                <Link href={"/"}>HOME</Link>
                {user && <Link href={"/dashboard"}>DASHBOARD</Link>}
            </div>

            <User />


        </nav>
    );
};

export default Navbar;