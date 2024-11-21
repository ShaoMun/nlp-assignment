import Link from 'next/link';
import styles from '@/styles/Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <Link href="/" className={styles.navLink}>
        Home
      </Link>
      <Link href="/evaluation" className={styles.navLink}>
        Evaluation
      </Link>
    </nav>
  );
} 