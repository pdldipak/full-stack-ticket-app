import {
  ORDER_ADULT_PRICE_SEK,
  ORDER_CHILD_PRICE_SEK,
  ORDER_STUDENT_PRICE_SEK,
  computeOrderTotalSek,
} from '@src/constants/orderPricing.js';
import styles from './AttendanceFields.module.css';

/**
 * Adults / student / child counts; total attendance is the sum (shown read-only).
 * Styles: BEM in AttendanceFields.module.css (block: attendance-fields).
 */
export default function AttendanceFields({
  countAdults,
  countStudent,
  countChild,
  onChangeAdults,
  onChangeStudent,
  onChangeChild,
  idPrefix = 'att',
  disabled = false,
  /** When true, show public order pricing (matches backend `orderPricing.js`). */
  showOrderPricing = false,
}) {
  const a = Number(countAdults) || 0;
  const s = Number(countStudent) || 0;
  const c = Number(countChild) || 0;
  const total = a + s + c;
  const totalCostSek = showOrderPricing ? computeOrderTotalSek(a, s, c) : null;

  return (
    <fieldset className={styles.attendanceFields}>
      <legend className={styles.attendanceFields__legend}>
        Attendance <span className={styles.attendanceFields__legendRequired}>*</span>
      </legend>
      <p className={styles.attendanceFields__hint}>
        Adults, student, and children. At least one person total. Total attendance is the sum of the
        three.
      </p>
      <div className={styles.attendanceFields__grid}>
        <div>
          <label htmlFor={`${idPrefix}-adults`} className={styles.attendanceFields__label}>
            Adults
          </label>
          <input
            id={`${idPrefix}-adults`}
            type="number"
            min={0}
            max={99}
            required
            disabled={disabled}
            value={countAdults}
            onChange={onChangeAdults}
            className={styles.attendanceFields__input}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-student`} className={styles.attendanceFields__label}>
            Student
          </label>
          <input
            id={`${idPrefix}-student`}
            type="number"
            min={0}
            max={99}
            required
            disabled={disabled}
            value={countStudent}
            onChange={onChangeStudent}
            className={styles.attendanceFields__input}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-child`} className={styles.attendanceFields__label}>
            Child
          </label>
          <input
            id={`${idPrefix}-child`}
            type="number"
            min={0}
            max={99}
            required
            disabled={disabled}
            value={countChild}
            onChange={onChangeChild}
            className={styles.attendanceFields__input}
          />
        </div>
      </div>
      <p className={styles.attendanceFields__summary}>
        Total attendance: <span className={styles.attendanceFields__summaryStrong}>{total}</span>
      </p>
      {showOrderPricing && totalCostSek != null && (
        <>
          <p className={styles.attendanceFields__pricingLine}>
            Total cost:{' '}
            <span className={styles.attendanceFields__summaryStrong}>{totalCostSek} kr</span>
          </p>
          <p className={styles.attendanceFields__pricingHint}>
            {ORDER_ADULT_PRICE_SEK} kr per adult · {ORDER_STUDENT_PRICE_SEK} kr per student ·{' '}
            {ORDER_CHILD_PRICE_SEK === 0
              ? 'children free'
              : `${ORDER_CHILD_PRICE_SEK} kr per child`}
          </p>
          <p className={styles.attendanceFields__summary}>
          NRNA sweden Swish: <b>123-012 84 05</b> <br />
          Don’t forget to take a screenshot.
      </p>
        </>
      )}
    </fieldset>
  );
}
