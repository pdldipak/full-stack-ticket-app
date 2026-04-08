import styles from './AuthFormCard.module.css';

export const authFormCardClass = styles.authFormCard;

export default function AuthFormCard({ children, onSubmit, className = '' }) {
  return (
    <form onSubmit={onSubmit} className={`${styles.authFormCard} ${className}`.trim()}>
      {children}
    </form>
  );
}
