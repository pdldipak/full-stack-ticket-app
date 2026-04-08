import { CITIES } from '@src/constants/cities.js';
import styles from './CitySelect.module.css';

export default function CitySelect({ id, value, onChange, required, allowedCities, className }) {
  const options =
    Array.isArray(allowedCities) && allowedCities.length > 0
      ? CITIES.filter((c) => allowedCities.includes(c))
      : CITIES;

  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      className={className || styles.citySelect}
    >
      {options.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
