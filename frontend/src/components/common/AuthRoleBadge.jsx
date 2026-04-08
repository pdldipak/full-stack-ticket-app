import { IconQrGridSmall, IconTicketsSmall } from '@src/components/common/icons.jsx';
import styles from './AuthRoleBadge.module.css';

const variants = {
  seller: {
    badgeClass: styles.authRoleBadge__badgeSeller,
    Icon: IconTicketsSmall,
  },
  scanner: {
    badgeClass: styles.authRoleBadge__badgeScanner,
    Icon: IconQrGridSmall,
  },
};

export default function AuthRoleBadge({ variant, children }) {
  const cfg = variants[variant];
  if (!cfg) return null;
  const { Icon } = cfg;

  return (
    <div className={styles.authRoleBadge}>
      <span className={cfg.badgeClass}>
        <Icon className={styles.authRoleBadge__icon} />
        {children}
      </span>
    </div>
  );
}
