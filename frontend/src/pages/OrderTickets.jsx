import { useEffect, useRef, useState } from 'react';
import publicApi from '../api/publicClient.js';
import AttendanceFields from '../components/AttendanceFields.jsx';
import CitySelect from '../components/CitySelect.jsx';
import EventBranding from '../components/EventBranding.jsx';
import {
  AuthAlternateLink,
  AuthFormCard,
  AuthShell,
  FormErrorAlert,
  HeroSubtitle,
  MessageDialog,
  PrimaryGradientButton,
} from '../components/common';
import { CITIES } from '../constants/cities.js';
import {
  getEventDateForCity,
  getEventTimeForCity,
  getVenueForCity,
  ORDER_PAGE_HEADLINE,
  ORDER_PAGE_INTRO,
  ORDER_PAGE_NO_LOGIN_BADGE,
} from '../config/eventConfig.js';
import { PAID_TO_OPTIONS, PAID_TO_SELLER } from '../constants/payment.js';
import { getApiErrorMessage } from '../utils/apiError.js';

export default function OrderTickets() {
  const [sellers, setSellers] = useState([]);
  const [sellersRequestDone, setSellersRequestDone] = useState(false);
  const [loadSellersError, setLoadSellersError] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [countAdults, setCountAdults] = useState(1);
  const [countStudent, setCountStudent] = useState(0);
  const [countChild, setCountChild] = useState(0);
  const [city, setCity] = useState('Stockholm');
  const [soldBy, setSoldBy] = useState('');
  /** 'unpaid' | 'paid' — default so payment section is valid without an extra click. */
  const [paymentChoice, setPaymentChoice] = useState('unpaid');
  const [paidTo, setPaidTo] = useState(PAID_TO_SELLER);
  const [phoneContactConsent, setPhoneContactConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  /** Bumps each effect run so Strict Mode / remounts do not leave "loading" stuck. */
  const sellersFetchGen = useRef(0);

  useEffect(() => {
    const gen = ++sellersFetchGen.current;
    const ac = new AbortController();

    setLoadSellersError('');
    setSellersRequestDone(false);

    (async () => {
      try {
        const { data } = await publicApi.get('/public/sellers', { signal: ac.signal });
        if (gen !== sellersFetchGen.current) return;
        const list = data.sellers || [];
        setSellers(list);
        setSoldBy((prev) => prev || (list[0]?.username ?? ''));
      } catch (err) {
        if (ac.signal.aborted || err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
          return;
        }
        if (gen !== sellersFetchGen.current) return;
        setLoadSellersError(getApiErrorMessage(err, 'Could not load sellers'));
      } finally {
        if (gen === sellersFetchGen.current) {
          setSellersRequestDone(true);
        }
      }
    })();

    return () => {
      ac.abort();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    if (!paymentChoice) {
      setError('Please choose whether you have already paid.');
      return;
    }
    if (paymentChoice === 'paid' && !paidTo) {
      setError('Please choose who received payment.');
      return;
    }
    if (!phoneContactConsent) {
      setError(
        'Please confirm that committee members of this program may contact you using the phone number you provided.'
      );
      return;
    }
    const a = Number(countAdults) || 0;
    const s = Number(countStudent) || 0;
    const c = Number(countChild) || 0;
    if (a + s + c < 1) {
      setError('Attendance must include at least one adult, student, or child.');
      return;
    }
    const paid = paymentChoice === 'paid';
    setSubmitting(true);
    try {
      const { data } = await publicApi.post('/public/ticket-requests', {
        fullName: fullName.trim(),
        phone: phone.trim(),
        countAdults: a,
        countStudent: s,
        countChild: c,
        soldBy: soldBy.trim(),
        city,
        paid,
        paidTo: paid ? paidTo : null,
        phoneContactConsent: true,
      });
      setSuccess({ ticketCode: data.ticketCode });
      setFullName('');
      setPhone('');
      setCountAdults(1);
      setCountStudent(0);
      setCountChild(0);
      setPaymentChoice('unpaid');
      setPaidTo(PAID_TO_SELLER);
      setPhoneContactConsent(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit your request'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div className="space-y-5">
        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-white/95 to-teal-50/80 p-5 shadow-lg shadow-emerald-900/10 ring-1 ring-emerald-300/40 dark:border-emerald-700/50 dark:from-emerald-950/40 dark:via-slate-900/90 dark:to-emerald-950/30 dark:shadow-emerald-950/20 dark:ring-emerald-600/20">
          <EventBranding forHero prominentOrganizer />
          <p className="mt-4 text-center text-xl font-extrabold tracking-tight sm:text-2xl">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 bg-clip-text text-transparent dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300">
              {ORDER_PAGE_HEADLINE}
            </span>
            <span className="block text-base font-semibold text-emerald-800/90 dark:text-emerald-200/95 sm:inline sm:ml-2">
              {ORDER_PAGE_NO_LOGIN_BADGE}
            </span>
          </p>
          <HeroSubtitle className="mt-3 max-w-md text-emerald-950/90 dark:text-emerald-50/95">
            {ORDER_PAGE_INTRO}
          </HeroSubtitle>
        </div>
      </div>

      {loadSellersError && (
        <FormErrorAlert message={loadSellersError} variant="hero" />
      )}

      <MessageDialog
        open={Boolean(success)}
        title="Order received"
        variant="success"
        onClose={() => setSuccess(null)}
        closeLabel="OK"
      >
        <p>
          Thank you. Your request was registered. The seller you chose or an admin must verify the order in the portal
          before it is treated as confirmed.
        </p>
        <p className="rounded-lg border border-emerald-200/80 bg-emerald-100/50 px-3 py-2 font-mono text-base text-emerald-950 dark:border-emerald-600/50 dark:bg-emerald-950/50 dark:text-emerald-50">
          Your ticket code: <strong className="text-lg tracking-wide">{success?.ticketCode}</strong>
        </p>
        <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
          Save this code. The seller you picked or an admin must verify the order in the portal; then they can set the
          price and payment.
        </p>
      </MessageDialog>

      <AuthFormCard
        onSubmit={handleSubmit}
        className="border-emerald-200/80 ring-2 ring-emerald-400/20 shadow-emerald-900/15 dark:border-emerald-700/60 dark:ring-emerald-500/15 dark:shadow-emerald-950/30"
      >
        <FormErrorAlert message={error} variant="hero" />

        <div>
          <label
            htmlFor="order-fullName"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Full name
          </label>
          <input
            id="order-fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="order-phone"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Swedish mobile (e.g. 0701234567 or +46701234567)
          </label>
          <input
            id="order-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="+46 70 123 45 67"
            className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="order-phone-consent"
              required
              checked={phoneContactConsent}
              onChange={(e) => setPhoneContactConsent(e.target.checked)}
              className="mt-1 border-slate-300 rounded text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 shrink-0"
            />
            <span className="text-sm text-slate-800 dark:text-slate-200 leading-snug">
              I agree that committee members of this program may contact me using the phone number I provide above.{' '}
              <span className="text-red-600 dark:text-red-400">*</span>
            </span>
          </label>
        </div>

        <AttendanceFields
          idPrefix="order"
          countAdults={countAdults}
          countStudent={countStudent}
          countChild={countChild}
          onChangeAdults={(e) => setCountAdults(e.target.value)}
          onChangeStudent={(e) => setCountStudent(e.target.value)}
          onChangeChild={(e) => setCountChild(e.target.value)}
        />

        <div>
          <label
            htmlFor="order-city"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Program city
          </label>
          <CitySelect
            id="order-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            allowedCities={CITIES}
            required
          />
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
            {getEventDateForCity(city)} · {getEventTimeForCity(city)} · {getVenueForCity(city) || 'Venue TBA'}
          </p>
        </div>

        <div>
          <label
            htmlFor="order-seller"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Seller who will verify your order
          </label>
          <select
            id="order-seller"
            required
            value={soldBy}
            onChange={(e) => setSoldBy(e.target.value)}
            disabled={!sellersRequestDone}
            aria-busy={!sellersRequestDone}
            className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white disabled:opacity-60"
          >
            {!sellersRequestDone ? (
              <option value="">Loading sellers…</option>
            ) : loadSellersError ? (
              <option value="">Could not load sellers — check API is running (port 3001)</option>
            ) : sellers.length === 0 ? (
              <option value="">
                No sellers — set SELLER_USERNAMES and SELLER_PASSWORDS in backend/.env and restart the API
              </option>
            ) : (
              sellers.map((s) => {
                const parts = s.displayParts?.length ? s.displayParts : s.allowedCities || [];
                const label = parts.length ? `${s.username}(${parts.join(', ')})` : s.username;
                return (
                  <option key={s.username} value={s.username}>
                    {label}
                  </option>
                );
              })
            )}
          </select>
        </div>

        <fieldset className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-3 dark:border-slate-700 dark:bg-slate-800/40">
          <legend className="text-sm font-medium text-slate-800 dark:text-slate-200 px-1">
            Payment <span className="text-red-600 dark:text-red-400">*</span>
          </legend>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="paymentChoice"
                value="unpaid"
                checked={paymentChoice === 'unpaid'}
                onChange={() => setPaymentChoice('unpaid')}
                required
                className="border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800"
              />
              <span className="text-sm text-slate-800 dark:text-slate-200">Not paid yet</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="paymentChoice"
                value="paid"
                checked={paymentChoice === 'paid'}
                onChange={() => setPaymentChoice('paid')}
                className="border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800"
              />
              <span className="text-sm text-slate-800 dark:text-slate-200">I have paid</span>
            </label>
          </div>
          {paymentChoice === 'paid' && (
            <div>
              <label
                htmlFor="order-paidTo"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Payment went to <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <select
                id="order-paidTo"
                required
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
        </fieldset>

        <PrimaryGradientButton
          disabled={
            submitting ||
            !sellersRequestDone ||
            sellers.length === 0 ||
            !String(soldBy).trim()
          }
        >
          {submitting ? 'Sending…' : 'Submit order'}
        </PrimaryGradientButton>
      </AuthFormCard>

      <AuthAlternateLink to="/login">Seller / admin sign in</AuthAlternateLink>
    </AuthShell>
  );
}
