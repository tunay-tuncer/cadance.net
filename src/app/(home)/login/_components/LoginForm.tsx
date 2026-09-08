'use client';

import { useState, type FormEvent } from "react";
import styles from "../login.module.css";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        // Perform authentication logic (e.g., Supabase / NextAuth / Firebase)
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <label htmlFor="email" className={styles.label}>Email Address</label>
            <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={styles.input}
            />
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                required
                className={styles.input}
            />
            <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? "Sending link..." : "Continue with Email"}
            </button>
        </form>
    );
}
