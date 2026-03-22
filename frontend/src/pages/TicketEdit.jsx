import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/client.js';
import AttendanceFields from '../components/AttendanceFields.jsx';
import CitySelect from '../components/CitySelect.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import FormErrorAlert from '../components/common/FormErrorAlert.jsx';
import { isSameSeller } from '../utils/sellerMatch.js';
import { getApiErrorMessage } from '../utils/apiError.js';
import { getEventDateForCity, getEventTimeForCity, getVenueForCity } from '../config/eventConfig.js';
import { PAID_TO_OPTIONS, PAID_TO_SELLER } from '../constants/payment.js';

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
    return (
      <div className="text-center text-slate-500 dark:text-slate-400 py-12">Loading…</div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit ticket</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-mono">{code}</p>
      </div>

      {loadError && (
        <>
          <FormErrorAlert message={loadError} />
          <Link
            to="/tickets"
            className="inline-block text-sm text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Back to list
          </Link>
        </>
      )}

      <FormErrorAlert message={saveError} />

      {canEdit && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 dark:bg-slate-900 dark:border-slate-800"
        >
          {role === 'admin' && ticketCheckedIn && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              This ticket is checked in. As admin you can still edit or reassign the seller; use care.
            </p>
          )}
          {role === 'admin' && attributionChoices.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Sold by (credited account)
              </label>
              <select
                value={soldByAttribution}
                onChange={(e) => setSoldByAttribution(e.target.value)}
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              >
                {attributionChoices.map((s) => (
                  <option key={s} value={s}>
                    {s}
                    {s === username ? ' (admin)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
                Seller accounts must be allowed for the program city below. You may credit the ticket to your admin
                username.
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full name
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Phone (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Ticket type
            </label>
            <input
              required
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value)}
              className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              City
            </label>
            <CitySelect
              value={city}
              onChange={(e) => setCity(e.target.value)}
              allowedCities={allowedCities}
              required
            />
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 space-y-0.5">
              <span className="block">
                Date:{' '}
                <strong className="text-slate-800 dark:text-slate-300">{getEventDateForCity(city)}</strong>
                {' · '}
                Time:{' '}
                <strong className="text-slate-800 dark:text-slate-300">{getEventTimeForCity(city)}</strong>
              </span>
              <span className="block text-slate-500 dark:text-slate-500">
                Venue: {getVenueForCity(city) || '—'}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Price (SEK)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
            <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">Leave blank to save as 0 SEK (e.g. web orders).</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-3 dark:border-slate-700 dark:bg-slate-800/40">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800"
              />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Paid</span>
            </label>
            {paid && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Payment received by
                </label>
                <select
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50 transition"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <Link
              to={`/tickets/detail/${encodeURIComponent(code)}`}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
