import styles from './HeroSubtitle.module.css';

export default function HeroSubtitle({ children, className = '' }) {
  return (
    <p className={`${styles.heroSubtitle} ${className}`.trim()}>{children}</p>
  );
}
