import { useEffect, useRef, useState } from 'react';
import publicApi from '@src/api/publicClient.js';
import AttendanceFields from '@src/components/AttendanceFields.jsx';
import CitySelect from '@src/components/CitySelect.jsx';
import EventBranding from '@src/components/EventBranding.jsx';
import {
  AuthAlternateLink,
  AuthFormCard,
  AuthShell,
  FormErrorAlert,
  HeroSubtitle,
  MessageDialog,
  PrimaryGradientButton,
} from '@src/components/common';
import { CITIES } from '@src/constants/cities.js';
import {
  getEventDateForCity,
  getEventTimeForCity,
  getVenueForCity,
  ORDER_PAGE_HEADLINE,
  ORDER_PAGE_INTRO,
  ORDER_PAGE_NO_LOGIN_BADGE,
} from '@src/config/eventConfig.js';
import { PAID_TO_OPTIONS, PAID_TO_SELLER } from '@src/constants/payment.js';
import { getApiErrorMessage } from '@src/utils/apiError.js';
import tf from '@src/styles/ticketForm.module.css';
import styles from '@src/pages/OrderTickets.module.css';

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
      setSuccess({
        ticketCode: data.ticketCode,
        qrImageBase64: data.ticket?.qrImageBase64 ?? null,
      });
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
      <div className={styles.orderTickets__stack}>
        <div className={styles.orderTickets__heroCard}>
          <EventBranding forHero prominentOrganizer />
          <p className={styles.orderTickets__headlineRow}>
            <span className={styles.orderTickets__headlineGradient}>{ORDER_PAGE_HEADLINE}</span>
            <span className={styles.orderTickets__headlineBadge}>{ORDER_PAGE_NO_LOGIN_BADGE}</span>
          </p>
          <HeroSubtitle className={styles.orderTickets__heroSubtitle}>
            {ORDER_PAGE_INTRO}
          </HeroSubtitle>
        </div>
      </div>

      {loadSellersError && <FormErrorAlert message={loadSellersError} variant="hero" />}

      <MessageDialog
        open={Boolean(success)}
        title="Order received"
        variant="success"
        onClose={() => setSuccess(null)}
        closeLabel="OK"
      >
        <p>
          Thank you. Your request was registered. The seller you chose or an admin must verify the
          order in the portal before it is treated as confirmed.
        </p>
        <p className={styles.orderTickets__successCode}>
          Your ticket code:{' '}
          <strong className={styles.orderTickets__successCodeStrong}>{success?.ticketCode}</strong>
        </p>
        {success?.qrImageBase64 && (
          <div className={styles.orderTickets__qrBlock}>
            <p className={styles.orderTickets__qrCaption}>Entry QR code</p>
            <img
              src={success.qrImageBase64}
              alt={success.ticketCode ? `QR for ${success.ticketCode}` : 'Ticket QR code'}
              className={styles.orderTickets__qrImage}
            />
            <p className={styles.orderTickets__qrMeta}>Encodes: {success.ticketCode}</p>
          </div>
        )}
        <p className={styles.orderTickets__successFootnote}>
          Save this code. The seller you picked or an admin must verify the order in the portal. The
          total amount above is stored with your request; payment and verification are completed in
          the portal.
        </p>
      </MessageDialog>

      <AuthFormCard onSubmit={handleSubmit} className={styles.orderTickets__formCardAccent}>
        <FormErrorAlert message={error} variant="hero" />

        <div>
          <label htmlFor="order-fullName" className={tf.ticketForm__label}>
            Full name
          </label>
          <input
            id="order-fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            className={tf.ticketForm__input}
          />
        </div>

        <div>
          <label htmlFor="order-phone" className={tf.ticketForm__label}>
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
            className={tf.ticketForm__input}
          />
        </div>

        <div className={styles.orderTickets__consentBox}>
          <label className={styles.orderTickets__consentRow}>
            <input
              type="checkbox"
              id="order-phone-consent"
              required
              checked={phoneContactConsent}
              onChange={(e) => setPhoneContactConsent(e.target.checked)}
              className={styles.orderTickets__consentCheckbox}
            />
            <span className={styles.orderTickets__consentText}>
              I agree that committee members of this program may contact me using the phone number I
              provide above. <span className={styles.orderTickets__required}>*</span>
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
          showOrderPricing
        />

        <div>
          <label htmlFor="order-city" className={tf.ticketForm__label}>
            Program city
          </label>
          <CitySelect
            id="order-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            allowedCities={CITIES}
            required
          />
          <p className={tf.ticketForm__hint}>
            {getEventDateForCity(city)} · {getEventTimeForCity(city)} ·{' '}
            {getVenueForCity(city) || 'Venue TBA'}
          </p>
        </div>

        <div>
          <label htmlFor="order-seller" className={tf.ticketForm__label}>
            Seller who will verify your order
          </label>
          <select
            id="order-seller"
            required
            value={soldBy}
            onChange={(e) => setSoldBy(e.target.value)}
            disabled={!sellersRequestDone}
            aria-busy={!sellersRequestDone}
            className={tf.ticketForm__inputLoading}
          >
            {!sellersRequestDone ? (
              <option value="">Loading sellers…</option>
            ) : loadSellersError ? (
              <option value="">Could not load sellers — check API is running (port 3001)</option>
            ) : sellers.length === 0 ? (
              <option value="">
                No sellers — set SELLER_USERNAMES and SELLER_PASSWORDS in backend/.env and restart
                the API
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

        <fieldset className={styles.orderTickets__fieldset}>
          <legend className={styles.orderTickets__legend}>
            Payment <span className={styles.orderTickets__required}>*</span>
          </legend>
          <div className={styles.orderTickets__radioStack}>
            <label className={styles.orderTickets__radioRow}>
              <input
                type="radio"
                name="paymentChoice"
                value="unpaid"
                checked={paymentChoice === 'unpaid'}
                onChange={() => setPaymentChoice('unpaid')}
                required
                className={styles.orderTickets__radio}
              />
              <span className={styles.orderTickets__radioLabel}>Not paid yet</span>
            </label>
            <label className={styles.orderTickets__radioRow}>
              <input
                type="radio"
                name="paymentChoice"
                value="paid"
                checked={paymentChoice === 'paid'}
                onChange={() => setPaymentChoice('paid')}
                className={styles.orderTickets__radio}
              />
              <span className={styles.orderTickets__radioLabel}>I have paid</span>
            </label>
          </div>
          {paymentChoice === 'paid' && (
            <div>
              <label htmlFor="order-paidTo" className={tf.ticketForm__label}>
                Payment went to <span className={styles.orderTickets__required}>*</span>
              </label>
              <select
                id="order-paidTo"
                required
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className={tf.ticketForm__input}
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
            submitting || !sellersRequestDone || sellers.length === 0 || !String(soldBy).trim()
          }
        >
          {submitting ? 'Sending…' : 'Submit order'}
        </PrimaryGradientButton>
      </AuthFormCard>

      <AuthAlternateLink to="/login">Seller / admin sign in</AuthAlternateLink>
    </AuthShell>
  );
}
