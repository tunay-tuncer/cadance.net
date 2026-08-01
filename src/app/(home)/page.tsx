import styles from "./page.module.css";
import Link from "next/link";


export default function Home() {
  return (
    <section className={styles.mainContainer}>
      <h1><span>Welcome to </span>Cadance Dashboard</h1>
      <p className={styles.redirectText}>If you are a client and somehow end up here let us redirect you to our <a href="https://cadancestudio.com">main website</a></p>

      <Link className={styles.signInDiv} href={"/login"} >Sign In</Link>
    </section>
  );
}
