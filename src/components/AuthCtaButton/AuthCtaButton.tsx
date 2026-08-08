'use client';

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "../../app/(home)/page.module.css";

export default function AuthCtaButton() {
    const { user, loading } = useAuth();

    if (loading) {
        return <span className={styles.signInDiv}>Yükleniyor...</span>;
    }

    return (
        <Link
            className={styles.signInDiv}
            href={user ? "/dashboard" : "/login"}
        >
            {user ? "Go to Dashboard" : "Sign In"}
        </Link>
    );
}