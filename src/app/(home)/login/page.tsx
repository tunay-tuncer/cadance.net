import Link from "next/link";
//COMPONENTS
import LoginForm from "./_components/LoginForm";
import GoogleAuthButton from "./_components/GoogleButton";
//STYLES
import styles from "./login.module.css";
//ICONS
import { FaChevronLeft } from "react-icons/fa";

const Page = () => {
    return (
        <section className={styles.mainContainer}>
            <div className={styles.loginCard}>
                <h1 className={styles.title}>Welcome Back</h1>
                <p className={styles.subtitle}>Sign in to continue to your dashboard</p>

                <LoginForm />

                <div className={styles.divider}><span>or</span></div>

                <GoogleAuthButton />

                <Link href={"/"} className={styles.backButton}>
                    <FaChevronLeft />
                </Link>
            </div>
        </section>
    )
}

export default Page