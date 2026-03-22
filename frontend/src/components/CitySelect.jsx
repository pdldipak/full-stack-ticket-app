import { CITIES } from '../constants/cities.js';

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
      className={
        className ||
        'w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white'
      }
    >
      {options.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
