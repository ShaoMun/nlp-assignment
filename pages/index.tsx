import ThreeScene from "../components/ThreeScene";
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styles from '@/styles/Landing.module.css';

export default function Home() {
  const router = useRouter();
  const [buttonText, setButtonText] = useState('ezPDF');
  const [isVisible, setIsVisible] = useState(true);

  const actions = ['Ask', 'Upload', 'Go'];

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % actions.length;
        setButtonText(actions[currentIndex]);
        setIsVisible(true);
      }, 500);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push('/home');
  };

  return (
    <main className={styles.container}>

      <div className={styles.heroSection}>
        <div className={styles.heroText}>
          <h1 className={styles.title}>
            All in One PDF Assistant
          </h1>
          <p className={styles.subtitle}>
            ezPDf, your way of handling PDF
          </p>
          <a 
            href="#" 
            onClick={handleClick}
            className={styles.ctaButton}
          >
            <span className={styles.buttonTextWrapper}>
              <span className={`${styles.buttonText} ${isVisible ? styles.buttonTextVisible : styles.buttonTextHidden}`}>
                {buttonText}
              </span>
              <span className={styles.buttonInvisible}>
                {actions.reduce((a, b) => a.length > b.length ? a : b)}
              </span>
            </span>
            <span className={styles.nowText}>Now</span>
            <span className="ml-2" style={{ fontWeight: 'bold' }}>&#8594;</span>
          </a>
        </div>
        <div className={styles.heroImage}>
          <div className={styles.threeSceneContainer}>
            <ThreeScene />
          </div>
        </div>
      </div>
    </main>
  );
}