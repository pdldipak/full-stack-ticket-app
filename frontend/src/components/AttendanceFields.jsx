/**
 * Adults / student / child counts; total attendance is the sum (shown read-only).
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
}) {
  const a = Number(countAdults) || 0;
  const s = Number(countStudent) || 0;
  const c = Number(countChild) || 0;
  const total = a + s + c;

  const inputClass =
    'w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white disabled:opacity-60';

  return (
    <fieldset className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-3 dark:border-slate-700 dark:bg-slate-800/40">
      <legend className="text-sm font-medium text-slate-800 dark:text-slate-200 px-1">
        Attendance <span className="text-red-600 dark:text-red-400">*</span>
      </legend>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        Adults, student, and children. At least one person total. Total attendance is the sum of the three.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label
            htmlFor={`${idPrefix}-adults`}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
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
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-student`}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
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
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-child`}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
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
            className={inputClass}
          />
        </div>
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-300">
        Total attendance:{' '}
        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{total}</span>
      </p>
    </fieldset>
  );
}
