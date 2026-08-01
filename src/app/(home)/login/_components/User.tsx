'use client';

import { useRouter } from "next/navigation";
import { useState } from 'react';
import { FaUser, FaChevronDown } from 'react-icons/fa';
import { useAuth } from "../../../../context/AuthContext";
import { logout } from '../../../../lib/fireabase/auth';
import styles from "../../../../components/layout/Navbar/Navbar.module.css";
import Link from "next/link";

const User = () => {
    const { user } = useAuth();
    const [userExpanded, setUserExpanded] = useState(false);
    const router = useRouter();

    const toggleDropdown = () => {
        setUserExpanded((prev) => !prev);
    };

    const handleLogout = async () => {
        try {
            await logout();
            setUserExpanded(false);

        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <div className={styles.userContainer}>

            {user ? (
                <div className={styles.userDisplay} style={{ position: 'relative' }}>
                    <FaUser />
                    {/* Clickable button trigger */}
                    <button
                        type="button"
                        className={styles.userButton}
                        onClick={toggleDropdown}
                        aria-expanded={userExpanded}
                    >
                        <span>{user.displayName ?? user.email ?? 'User'}</span>
                        <FaChevronDown
                            className={`${styles.chevron} ${userExpanded ? styles.expanded : ''}`}
                        />
                    </button>

                    {/* Absolute positioned dropdown menu */}
                    {userExpanded && (
                        <div className={styles.dropdownMenu}>
                            <p style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: '#6b7280' }}>
                                {user.email}
                            </p>
                            <button
                                type="button"
                                onClick={handleLogout}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    padding: 0,
                                }}
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <Link className={styles.signInButton} href={"/login"}>SIGN IN</Link>
            )}
        </div>
    );
};

export default User;