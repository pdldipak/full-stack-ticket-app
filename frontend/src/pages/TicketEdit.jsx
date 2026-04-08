import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '@src/api/client.js';
import AttendanceFields from '@src/components/AttendanceFields.jsx';
import CitySelect from '@src/components/CitySelect.jsx';
import { useAuth } from '@src/context/AuthContext.jsx';
import FormErrorAlert from '@src/components/common/FormErrorAlert.jsx';
import { isSameSeller } from '@src/utils/sellerMatch.js';
import { getApiErrorMessage } from '@src/utils/apiError.js';
import { getEventDateForCity, getEventTimeForCity, getVenueForCity } from '@src/config/eventConfig.js';
import { PAID_TO_OPTIONS, PAID_TO_SELLER } from '@src/constants/payment.js';
import { computeOrderTotalSek } from '@src/constants/orderPricing.js';
import styles from '@src/styles/ticketForm.module.css';

export default function TicketEdit() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { username, allowedCities, role, sellerUsernames } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [countAdults, setCountAdults] = useState(1);
  const [countStudent, setCountStudent] = useState(0);
  const [countChild, setCountChild] = useState(0);
  const [ticketType, setTicketType] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('Stockholm');
  const [paid, setPaid] = useState(false);
  const [paidTo, setPaidTo] = useState(PAID_TO_SELLER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [soldByAttribution, setSoldByAttribution] = useState('');
  const [ticketCheckedIn, setTicketCheckedIn] = useState(false);

  const attributionChoices = useMemo(
    () => [...new Set([...sellerUsernames, username].filter(Boolean))],
    [sellerUsernames, username]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      setCanEdit(false);
      try {
        const { data } = await api.get(`/tickets/${encodeURIComponent(code)}`);
        const t = data.ticket;
        if (cancelled || !t) return;
        if (t.checkedIn && role !== 'admin') {
          setLoadError('This ticket was already checked in and cannot be edited.');
          return;
        }
        if (role !== 'admin' && !isSameSeller(t.soldBy, username)) {
          setLoadError('You can only edit tickets you created.');
          return;
        }
        setTicketCheckedIn(Boolean(t.checkedIn));
        if (role === 'admin') {
          const choices = [
            ...new Set([...sellerUsernames, username].filter(Boolean)),
          ];
          let attr = t.soldBy || '';
          if (choices.length && !choices.includes(attr)) {
            attr = choices[0];
          }
          setSoldByAttribution(attr);
        } else {
          setSoldByAttribution('');
        }
        setFullName(t.fullName);
        setPhone(t.phone != null ? String(t.phone) : '');
        if (
          t.countAdults !== undefined ||
          t.countStudent !== undefined ||
          t.countChild !== undefined
        ) {
          setCountAdults(t.countAdults ?? 0);
          setCountStudent(t.countStudent ?? 0);
          setCountChild(t.countChild ?? 0);
        } else {
          setCountAdults(t.ticketCount ?? 1);
          setCountStudent(0);
          setCountChild(0);
        }
        setTicketType(t.ticketType);
        setPrice(String(t.price));
        setCity(t.city || 'Stockholm');
        setPaid(Boolean(t.paid));
        setPaidTo(t.paidTo && PAID_TO_OPTIONS.some((o) => o.value === t.paidTo) ? t.paidTo : PAID_TO_SELLER);
        setCanEdit(true);
      } catch (err) {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(err, 'Failed to load ticket'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, username, role, sellerUsernames]);

  useEffect(() => {
    if (!canEdit) return;
    const a = Number(countAdults) || 0;
    const s = Number(countStudent) || 0;
    const c = Number(countChild) || 0;
    setPrice(String(computeOrderTotalSek(a, s, c)));
  }, [canEdit, countAdults, countStudent, countChild]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    const priceTrimmed = String(price).trim();
    const priceNum = priceTrimmed === '' ? 0 : Number(priceTrimmed);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setSaveError('Price must be a number ≥ 0, or leave blank for 0 SEK.');
      return;
    }
    const a = Number(countAdults) || 0;
    const s = Number(countStudent) || 0;
    const c = Number(countChild) || 0;
    if (a + s + c < 1) {
      setSaveError('Attendance must include at least one adult, student, or child.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        countAdults: a,
        countStudent: s,
        countChild: c,
        ticketType: ticketType.trim(),
        price: priceNum,
        city,
        paid,
        paidTo: paid ? paidTo : null,
      };
      if (role === 'admin') {
        body.soldBy = soldByAttribution.trim();
      }
      await api.put(`/tickets/${encodeURIComponent(code)}`, body);
      navigate(`/tickets/detail/${encodeURIComponent(code)}`);
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.ticketForm__loading}>Loading…</div>;
  }

  return (
    <div className={styles.ticketForm__page}>
      <div>
        <h1 className={styles.ticketForm__title}>Edit ticket</h1>
        <p className={styles.ticketForm__monoSubtitle}>{code}</p>
      </div>

      {loadError && (
        <>
          <FormErrorAlert message={loadError} />
          <Link to="/tickets" className={styles.ticketForm__linkEmerald}>
            Back to list
          </Link>
        </>
      )}

      <FormErrorAlert message={saveError} />

      {canEdit && (
        <form onSubmit={handleSubmit} className={styles.ticketForm__card}>
          {role === 'admin' && ticketCheckedIn && (
            <p className={styles.ticketForm__amberBanner}>
              This ticket is checked in. As admin you can still edit or reassign the seller; use care.
            </p>
          )}
          {role === 'admin' && attributionChoices.length > 0 && (
            <div>
              <label className={styles.ticketForm__label}>Sold by (credited account)</label>
              <select
                value={soldByAttribution}
                onChange={(e) => setSoldByAttribution(e.target.value)}
                className={styles.ticketForm__input}
              >
                {attributionChoices.map((s) => (
                  <option key={s} value={s}>
                    {s}
                    {s === username ? ' (admin)' : ''}
                  </option>
                ))}
              </select>
              <p className={styles.ticketForm__hint}>
                Seller accounts must be allowed for the program city below. You may credit the ticket to your admin
                username.
              </p>
            </div>
          )}
          <div>
            <label className={styles.ticketForm__label}>Full name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={styles.ticketForm__input}
            />
          </div>

          <div>
            <label className={styles.ticketForm__label}>Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className={styles.ticketForm__input}
            />
          </div>

          <AttendanceFields
            idPrefix="edit"
            countAdults={countAdults}
            countStudent={countStudent}
            countChild={countChild}
            onChangeAdults={(e) => setCountAdults(e.target.value)}
            onChangeStudent={(e) => setCountStudent(e.target.value)}
            onChangeChild={(e) => setCountChild(e.target.value)}
            disabled={!canEdit}
            showOrderPricing
          />

          <div>
            <label className={styles.ticketForm__labelMuted}>Ticket type</label>
            <input
              required
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value)}
              className={styles.ticketForm__input}
            />
          </div>

          <div>
            <label className={styles.ticketForm__labelMuted}>City</label>
            <CitySelect
              value={city}
              onChange={(e) => setCity(e.target.value)}
              allowedCities={allowedCities}
              required
            />
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

          <div>
            <label className={styles.ticketForm__labelMuted}>Price (SEK)</label>
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
            <button type="submit" disabled={saving} className={styles.ticketForm__submit}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <Link to={`/tickets/detail/${encodeURIComponent(code)}`} className={styles.ticketForm__cancel}>
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
