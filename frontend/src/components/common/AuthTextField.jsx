import { IconLock, IconUser } from '@src/components/common/icons.jsx';
import styles from './AuthTextField.module.css';

export default function AuthTextField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  icon = 'user',
}) {
  const Icon = icon === 'lock' ? IconLock : IconUser;

  return (
    <div className={styles.authTextField}>
      <label htmlFor={id} className={styles.authTextField__label}>
        {label}
      </label>
      <div className={styles.authTextField__wrap}>
        <span className={styles.authTextField__iconSlot}>
          <Icon />
        </span>
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className={styles.authTextField__input}
          placeholder={placeholder}
          required
        />
      </div>
    </div>
  );
}
