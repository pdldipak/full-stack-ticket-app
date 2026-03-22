import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client.js';
import AttendanceFields from '../components/AttendanceFields.jsx';
import CitySelect from '../components/CitySelect.jsx';
import FormErrorAlert from '../components/common/FormErrorAlert.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../utils/apiError.js';
import {
  EVENT_ARTIST,
  EVENT_ORGANIZER,
  getEventDateForCity,
  getEventTimeForCity,
  getVenueForCity,
} from '../config/eventConfig.js';
import { PAID_TO_OPTIONS, PAID_TO_SELLER } from '../constants/payment.js';

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
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New ticket</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          {EVENT_ORGANIZER} · {EVENT_ARTIST} ·{' '}
          {role === 'admin'
            ? 'Attribute the sale to a seller account (below), or leave unset to record under your admin username.'
            : 'Sold by is taken from your logged-in seller account.'}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 dark:bg-slate-900 dark:border-slate-800"
      >
        <FormErrorAlert message={error} />

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

        <AttendanceFields
          idPrefix="create"
          countAdults={countAdults}
          countStudent={countStudent}
          countChild={countChild}
          onChangeAdults={(e) => setCountAdults(e.target.value)}
          onChangeStudent={(e) => setCountStudent(e.target.value)}
          onChangeChild={(e) => setCountChild(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Ticket type
          </label>
          <input
            required
            placeholder='e.g. "2 adults 1 child"'
            value={ticketType}
            onChange={(e) => setTicketType(e.target.value)}
            className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            City (program location)
          </label>
          <CitySelect
            value={city}
            onChange={(e) => setCity(e.target.value)}
            allowedCities={allowedCities}
            required
          />
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
            {role === 'admin'
              ? 'You may use any program city. The chosen seller must be allowed for that city.'
              : `Your account can only sell for: ${allowedCities.length ? allowedCities.join(', ') : '—'}.`}
          </p>
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

        {role === 'admin' && sellerUsernames.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Record sale as (seller account)
            </label>
            <select
              value={createSoldBy}
              onChange={(e) => setCreateSoldBy(e.target.value)}
              className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Price (SEK)
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 200 or leave blank for 0"
            className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
            Swedish kronor (kr). Blank saves as 0 SEK.
          </p>
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
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50 transition"
          >
            {loading ? 'Creating…' : 'Create ticket'}
          </button>
          <Link
            to="/tickets"
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
