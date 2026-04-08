import { useState, useEffect } from 'react';
import { computeOrderTotalSek } from '@src/constants/orderPricing.js';
import { useNavigate, Link } from 'react-router-dom';
import api from '@src/api/client.js';
import AttendanceFields from '@src/components/AttendanceFields.jsx';
import CitySelect from '@src/components/CitySelect.jsx';
import FormErrorAlert from '@src/components/common/FormErrorAlert.jsx';
import { useAuth } from '@src/context/AuthContext.jsx';
import { getApiErrorMessage } from '@src/utils/apiError.js';
import {
  EVENT_ARTIST,
  EVENT_ORGANIZER,
  getEventDateForCity,
  getEventTimeForCity,
  getVenueForCity,
} from '@src/config/eventConfig.js';
import { PAID_TO_OPTIONS, PAID_TO_SELLER } from '@src/constants/payment.js';
import styles from '@src/styles/ticketForm.module.css';

export default function TicketCreate() {
  const { allowedCities, role, sellerUsernames } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [countAdults, setCountAdults] = useState(1);
  const [countStudent, setCountStudent] = useState(0);
  const [countChild, setCountChild] = useState(0);
  const [ticketType, setTicketType] = useState('');
  const [city, setCity] = useState('Stockholm');

  useEffect(() => {
    if (allowedCities.length === 1) {
      setCity(allowedCities[0]);
    }
  }, [allowedCities]);
  const [price, setPrice] = useState('');
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const a = Number(countAdults) || 0;
    const s = Number(countStudent) || 0;
    const c = Number(countChild) || 0;
    setPrice(String(computeOrderTotalSek(a, s, c)));
  }, [countAdults, countStudent, countChild]);
  const [paidTo, setPaidTo] = useState(PAID_TO_SELLER);
  const [createSoldBy, setCreateSoldBy] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const priceTrimmed = String(price).trim();
    const priceNum = priceTrimmed === '' ? 0 : Number(priceTrimmed);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError('Price must be a number ≥ 0, or leave blank for 0 SEK.');
      return;
    }
    const a = Number(countAdults) || 0;
    const s = Number(countStudent) || 0;
    const c = Number(countChild) || 0;
    if (a + s + c < 1) {
      setError('Attendance must include at least one adult, student, or child.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        countAdults: a,
        countStudent: s,
        countChild: c,
        ticketType: ticketType.trim(),
        price: priceNum,
        city,
        paid,
        paidTo: paid ? paidTo : null,
      };
      if (role === 'admin' && createSoldBy.trim()) {
        payload.soldBy = createSoldBy.trim();
      }
      const { data } = await api.post('/tickets', payload);
      const code = data.ticket?.ticketCode;
      if (code) {
        navigate(`/tickets/detail/${encodeURIComponent(code)}`);
      } else {
        navigate('/tickets');
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create ticket'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.ticketForm__page}>
      <div>
        <h1 className={styles.ticketForm__title}>New ticket</h1>
        <p className={styles.ticketForm__subtitle}>
          {EVENT_ORGANIZER} · {EVENT_ARTIST} ·{' '}
          {role === 'admin'
            ? 'Attribute the sale to a seller account (below), or leave unset to record under your admin username.'
            : 'Sold by is taken from your logged-in seller account.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.ticketForm__card}>
        <FormErrorAlert message={error} />

        <div>
          <label className={styles.ticketForm__label}>Full name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={styles.ticketForm__input}
          />
        </div>

        <AttendanceFields
          idPrefix="create"
          countAdults={countAdults}
          countStudent={countStudent}
          countChild={countChild}
          onChangeAdults={(e) => setCountAdults(e.target.value)}
          onChangeStudent={(e) => setCountStudent(e.target.value)}
          onChangeChild={(e) => setCountChild(e.target.value)}
          showOrderPricing
        />

        <div>
          <label className={styles.ticketForm__label}>Ticket type</label>
          <input
            required
            placeholder='e.g. "2 adults 1 child"'
            value={ticketType}
            onChange={(e) => setTicketType(e.target.value)}
            className={styles.ticketForm__input}
          />
        </div>

        <div>
          <label className={styles.ticketForm__label}>City (program location)</label>
          <CitySelect
            value={city}
            onChange={(e) => setCity(e.target.value)}
            allowedCities={allowedCities}
            required
          />
          <p className={styles.ticketForm__hint}>
            {role === 'admin'
              ? 'You may use any program city. The chosen seller must be allowed for that city.'
              : `Your account can only sell for: ${allowedCities.length ? allowedCities.join(', ') : '—'}.`}
          </p>
          <p className={styles.ticketForm__cityMeta}>
            <span className={styles.ticketForm__cityMetaLine}>
              Date:{' '}
              <strong className={styles.ticketForm__strong}>{getEventDateForCity(city)}</strong>
              {' · '}
              Time:{' '}
              <strong className={styles.ticketForm__strong}>{getEventTimeForCity(city)}</strong>
            </span>
            <span className={styles.ticketForm__venueLine}>Venue: {getVenueForCity(city) || '—'}</span>
          </p>
        </div>

        {role === 'admin' && sellerUsernames.length > 0 && (
          <div>
            <label className={styles.ticketForm__label}>Record sale as (seller account)</label>
            <select
              value={createSoldBy}
              onChange={(e) => setCreateSoldBy(e.target.value)}
              className={styles.ticketForm__input}
            >
              <option value="">— Admin (your username) —</option>
              {sellerUsernames.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={styles.ticketForm__label}>Price (SEK)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            className={styles.ticketForm__input}
          />
          <p className={styles.ticketForm__hint}>
            Swedish kronor (kr). Updates automatically from attendance (200 / 125 / 0); you can edit to override.
          </p>
        </div>

        <div className={styles.ticketForm__paidBox}>
          <label className={styles.ticketForm__checkboxRow}>
            <input
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className={styles.ticketForm__checkbox}
            />
            <span className={styles.ticketForm__checkboxLabel}>Paid</span>
          </label>
          {paid && (
            <div>
              <label className={styles.ticketForm__label}>Payment received by</label>
              <select
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className={styles.ticketForm__input}
              >
                {PAID_TO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className={styles.ticketForm__actions}>
          <button type="submit" disabled={loading} className={styles.ticketForm__submit}>
            {loading ? 'Creating…' : 'Create ticket'}
          </button>
          <Link to="/tickets" className={styles.ticketForm__cancel}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
