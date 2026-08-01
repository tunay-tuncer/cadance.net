'use client';

import { useRouter } from "next/navigation";
import styles from "../login.module.css";
import { FcGoogle } from "react-icons/fc";
import { signInWithGoogle } from "../../../../lib/fireabase/auth"

export default function GoogleAuthButton() {
    const router = useRouter();

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            // Redirect to dashboard on success
            router.push("/dashboard");
        } catch (error) {
            console.error("Failed to sign in:", error);
        }
    };

    return (
        <button
            type="button"
            onClick={handleGoogleSignIn}
            className={styles.googleBtn}
        >
            <FcGoogle /><span>Sign in with Google</span>
        </button>
    );
}