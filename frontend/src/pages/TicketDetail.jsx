import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '@src/api/client.js';
import FormErrorAlert from '@src/components/common/FormErrorAlert.jsx';
import ConfirmDialog from '@src/components/common/ConfirmDialog.jsx';
import { getApiErrorMessage } from '@src/utils/apiError.js';
import { formatSek } from '@src/utils/formatCurrency.js';
import { useAuth } from '@src/context/AuthContext.jsx';
import { canMutateTicket } from '@src/utils/sellerMatch.js';
import { canVerifyWebOrder, pendingWebOrderVerification } from '@src/utils/ticketVerification.js';
import {
  EVENT_ARTIST,
  EVENT_ORGANIZER,
  EVENT_TITLE,
  getEventDateForCity,
  getEventTimeForCity,
  getVenueForCity,
} from '@src/config/eventConfig.js';
import { labelForPaidTo } from '@src/constants/payment.js';
import { labelSubmissionSource } from '@src/constants/submissionSource.js';
import styles from '@src/pages/TicketDetail.module.css';

export default function TicketDetail() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { username, role } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyPhoneInput, setVerifyPhoneInput] = useState('');
  const [verifyDialogError, setVerifyDialogError] = useState('');

  const loadTicket = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/tickets/${encodeURIComponent(code)}`);
      setTicket(data.ticket);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Not found'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [code]);

  const openDeleteDialog = () => {
    if (!ticket || !canMutateTicket(ticket.soldBy, username, role, ticket.checkedIn)) {
      return;
    }
    setDeleteError('');
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleteLoading) return;
    setDeleteDialogOpen(false);
    setDeleteError('');
  };

  const confirmDeleteTicket = async () => {
    if (!ticket) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete(`/tickets/${encodeURIComponent(ticket.ticketCode)}`);
      navigate('/tickets');
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, 'Could not delete ticket'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const openVerifyDialog = () => {
    if (!ticket || !canVerifyWebOrder(ticket, username, role)) return;
    setVerifyDialogError('');
    setVerifyPhoneInput('');
    setVerifyDialogOpen(true);
  };

  const closeVerifyDialog = () => {
    if (verifyLoading) return;
    setVerifyDialogOpen(false);
    setVerifyDialogError('');
    setVerifyPhoneInput('');
  };

  const submitVerifyWebOrder = async () => {
    if (!ticket || !canVerifyWebOrder(ticket, username, role)) return;
    const trimmed = verifyPhoneInput.trim();
    if (!trimmed) {
      setVerifyDialogError('Enter the customer’s phone number.');
      return;
    }
    setVerifyDialogError('');
    setVerifyLoading(true);
    try {
      await api.post(
        `/tickets/${encodeURIComponent(ticket.ticketCode)}/verify`,
        { phone: trimmed }
      );
      setVerifyDialogOpen(false);
      setVerifyPhoneInput('');
      navigate('/tickets');
    } catch (err) {
      setVerifyDialogError(getApiErrorMessage(err, 'Could not verify order'));
    } finally {
      setVerifyLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.ticketDetail__loading}>Loading ticket…</div>;
  }

  if (error || !ticket) {
    return (
      <div className={styles.ticketDetail__errorStack}>
        <FormErrorAlert message={error || 'Ticket not found'} />
        <Link to="/tickets" className={styles.ticketDetail__link}>
          Back to list
        </Link>
      </div>
    );
  }

  const qrSrc = ticket.qrImageBase64;
  const canMutate = canMutateTicket(ticket.soldBy, username, role, ticket.checkedIn);
  const needsWebVerify = pendingWebOrderVerification(ticket);
  const showVerifyBtn = canVerifyWebOrder(ticket, username, role);

  return (
    <div className={styles.ticketDetail__page}>
      <div className={styles.ticketDetail__headerRow}>
        <div>
          <h1 className={needsWebVerify ? styles.ticketDetail__titleWarn : styles.ticketDetail__titleOk}>
            {ticket.ticketCode}
          </h1>
          <p className={styles.ticketDetail__org}>{EVENT_ORGANIZER}</p>
          <p className={styles.ticketDetail__eventLine}>
            {EVENT_TITLE} · {EVENT_ARTIST}
          </p>
          <p className={needsWebVerify ? styles.ticketDetail__nameWarn : styles.ticketDetail__nameOk}>
            {ticket.fullName}
          </p>
          {needsWebVerify && (
            <p className={styles.ticketDetail__verifyBanner}>
              Web order — verification required. Confirm using the same phone number the customer entered on the web form.
            </p>
          )}
        </div>
        <Link to="/tickets" className={styles.ticketDetail__headerLink}>
          All tickets
        </Link>
      </div>

      {(canMutate || showVerifyBtn) && (
        <div className={styles.ticketDetail__actions}>
          {showVerifyBtn && (
            <button
              type="button"
              disabled={verifyLoading}
              onClick={openVerifyDialog}
              className={styles.ticketDetail__btnVerify}
            >
              Verify web order
            </button>
          )}
          {canMutate && (
            <>
              <Link
                to={`/tickets/detail/${encodeURIComponent(ticket.ticketCode)}/edit`}
                className={styles.ticketDetail__btnEdit}
              >
                Edit
              </Link>
              <button type="button" onClick={openDeleteDialog} className={styles.ticketDetail__btnDelete}>
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {verifyDialogOpen && ticket && (
        <div className={styles.ticketDetail__modalRoot} role="presentation">
          <button
            type="button"
            className={styles.ticketDetail__modalBackdrop}
            aria-label="Close dialog"
            onClick={closeVerifyDialog}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="verify-order-title"
            className={styles.ticketDetail__modalPanel}
          >
            <h2 id="verify-order-title" className={styles.ticketDetail__modalTitle}>
              Verify web order
            </h2>
            <p className={styles.ticketDetail__modalBody}>
              Type the same phone number the customer used on the web order. It must match exactly (spaces and formatting
              can differ).
            </p>
            {ticket.phone && (
              <p className={styles.ticketDetail__modalHint}>
                Number on this order:{' '}
                <span className={styles.ticketDetail__modalHintMono}>{ticket.phone}</span>
              </p>
            )}
            <label htmlFor="verify-phone-input" className={styles.ticketDetail__srOnly}>
              Customer phone number
            </label>
            <input
              id="verify-phone-input"
              type="tel"
              autoComplete="tel"
              value={verifyPhoneInput}
              onChange={(e) => setVerifyPhoneInput(e.target.value)}
              placeholder="Same as on web form"
              className={styles.ticketDetail__modalInput}
            />
            {verifyDialogError && (
              <div className={styles.ticketDetail__verifyErrorWrap}>
                <FormErrorAlert message={verifyDialogError} />
              </div>
            )}
            <div className={styles.ticketDetail__modalActions}>
              <button
                type="button"
                className={styles.ticketDetail__modalCancel}
                onClick={closeVerifyDialog}
                disabled={verifyLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.ticketDetail__modalConfirm}
                onClick={submitVerifyWebOrder}
                disabled={verifyLoading}
              >
                {verifyLoading ? 'Verifying…' : 'Confirm verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.ticketDetail__card}>
        {needsWebVerify && (
          <div className={styles.ticketDetail__webBanner}>
            <strong className={styles.ticketDetail__bannerStrong}>Awaiting verification.</strong>{' '}
            Details below are shown in red until this web order is confirmed.
          </div>
        )}
        <dl className={styles.ticketDetail__dl}>
          <div className={styles.ticketDetail__row}>
            <dt className={needsWebVerify ? styles.ticketDetail__dtDanger : styles.ticketDetail__dt}>
              City
            </dt>
            <dd
              className={
                needsWebVerify ? styles.ticketDetail__ddDanger : styles.ticketDetail__dd
              }
            >
              {ticket.city || '—'}
            </dd>
          </div>
          <div className={styles.ticketDetail__row}>
            <dt className={needsWebVerify ? styles.ticketDetail__dtDanger : styles.ticketDetail__dt}>
              Concert date
            </dt>
            <dd
              className={needsWebVerify ? styles.ticketDetail__ddDanger : styles.ticketDetail__dd}
            >
              {getEventDateForCity(ticket.city) || '—'}
            </dd>
          </div>
          <div className={styles.ticketDetail__row}>
            <dt className={needsWebVerify ? styles.ticketDetail__dtDanger : styles.ticketDetail__dt}>
              Time
            </dt>
            <dd
              className={needsWebVerify ? styles.ticketDetail__ddDanger : styles.ticketDetail__dd}
            >
              {getEventTimeForCity(ticket.city) || '—'}
            </dd>
          </div>
          <div className={styles.ticketDetail__row}>
            <dt className={needsWebVerify ? styles.ticketDetail__dtDanger : styles.ticketDetail__dt}>
              Venue
            </dt>
            <dd
              className={needsWebVerify ? styles.ticketDetail__ddDanger : styles.ticketDetail__dd}
            >
              {getVenueForCity(ticket.city) || '—'}
            </dd>
          </div>
          <div className={styles.ticketDetail__row}>
            <dt className={needsWebVerify ? styles.ticketDetail__dtDanger : styles.ticketDetail__dt}>
              Phone
            </dt>
            <dd
              className={needsWebVerify ? styles.ticketDetail__ddDanger : styles.ticketDetail__dd}
            >
              {ticket.phone || '—'}
            </dd>
          </div>
          {ticket.submissionSource === 'public' && (
            <div className={styles.ticketDetail__row}>
              <dt className={needsWebVerify ? styles.ticketDetail__dtDanger : styles.ticketDetail__dt}>
                Phone contact consent
              </dt>
              <dd
                className={needsWebVerify ? styles.ticketDetail__ddDanger : styles.ticketDetail__dd}
              >
                {ticket.phoneContactConsent ? 'Yes' : 'No'}
              </dd>
            </div>
          )}
          <div className={styles.ticketDetail__row}>
            <dt className={needsWebVerify ? styles.ticketDetail__dtDanger : styles.ticketDetail__dt}>
              Order source
            </dt>
            <dd
              className={needsWebVerify ? styles.ticketDetail__ddDanger : styles.ticketDetail__dd}
            >
              {labelSubmissionSource(ticket.submissionSource)}
            </dd>
          </div>
          {ticket.submissionSource === 'public' && ticket.verifiedAt && (
            <div className={styles.ticketDetail__row}>
              <dt className={styles.ticketDetail__dt}>Verified</dt>
              <dd className={styles.ticketDetail__dd}>
                {ticket.verifiedBy ? `${ticket.verifiedBy} · ` : ''}
                {new Date(ticket.verifiedAt).toLocaleString()}
              </dd>
            </div>
          )}
          <div className={styles.ticketDetail__row}>
            <dt className={needsWebVerify ? styles.ticketDetail__dtDanger : styles.ticketDetail__dt}>
              Ticket type
            </dt>
            <dd
              className={needsWebVerify ? styles.ticketDetail__ddDanger : styles.ticketDetail__dd}
            >
              {ticket.ticketType}
            </dd>
          </div>
          <div className={styles.ticketDetail__row}>
            <dt className={needsWebVerify ? styles.ticketDetail__dtDanger : styles.ticketDetail__dt}>
              Attendance
            </dt>
            <dd
              className={needsWebVerify ? styles.ticketDetail__ddBlockDanger : styles.ticketDetail__ddBlock}
            >
              <span className={styles.ticketDetail__attendanceLine}>
                Adults {ticket.countAdults ?? 0}, student {ticket.countStudent ?? 0}, child {ticket.countChild ?? 0}
              </span>
              <span className={styles.ticketDetail__attendanceSub}>
                Total attendance: {ticket.ticketCount ?? 0}
              </span>
            </dd>
          </div>
          <div className={styles.ticketDetail__row}>
            <dt className={needsWebVerify ? styles.ticketDetail__dtDanger : styles.ticketDetail__dt}>
              Price (SEK)
            </dt>
            <dd
              className={needsWebVerify ? styles.ticketDetail__ddBlockDanger : styles.ticketDetail__ddBlock}
            >
              {formatSek(ticket.price)}
            </dd>
          </div>
          <div className={styles.ticketDetail__row}>
            <dt className={needsWebVerify ? styles.ticketDetail__dtDanger : styles.ticketDetail__dt}>
              Sold by
            </dt>
            <dd
              className={needsWebVerify ? styles.ticketDetail__ddBlockDanger : styles.ticketDetail__ddBlock}
            >
              {ticket.soldBy}
            </dd>
          </div>
          <div className={styles.ticketDetail__row}>
            <dt className={needsWebVerify ? styles.ticketDetail__dtDanger : styles.ticketDetail__dt}>
              Paid
            </dt>
            <dd
              className={
                needsWebVerify
                  ? Boolean(ticket.paid)
                    ? styles.ticketDetail__paidYesDanger
                    : styles.ticketDetail__paidNoDanger
                  : Boolean(ticket.paid)
                    ? styles.ticketDetail__paidYesOk
                    : styles.ticketDetail__paidNoOk
              }
            >
              {Boolean(ticket.paid) ? 'Yes' : 'No'}
            </dd>
          </div>
          <div className={styles.ticketDetail__row}>
            <dt className={needsWebVerify ? styles.ticketDetail__dtDanger : styles.ticketDetail__dt}>
              Payment to
            </dt>
            <dd
              className={needsWebVerify ? styles.ticketDetail__ddDanger : styles.ticketDetail__dd}
            >
              {Boolean(ticket.paid) ? labelForPaidTo(ticket.paidTo) : '—'}
            </dd>
          </div>
          <div className={styles.ticketDetail__row}>
            <dt className={needsWebVerify ? styles.ticketDetail__dtDanger : styles.ticketDetail__dt}>
              Checked in
            </dt>
            <dd
              className={
                needsWebVerify
                  ? ticket.checkedIn
                    ? styles.ticketDetail__checkYesDanger
                    : styles.ticketDetail__checkNoDanger
                  : ticket.checkedIn
                    ? styles.ticketDetail__checkYesOk
                    : styles.ticketDetail__checkNoOk
              }
            >
              {ticket.checkedIn ? 'Yes' : 'No'}
            </dd>
          </div>
          <div className={styles.ticketDetail__row}>
            <dt className={needsWebVerify ? styles.ticketDetail__dtDanger : styles.ticketDetail__dt}>
              Created
            </dt>
            <dd
              className={
                needsWebVerify ? styles.ticketDetail__ddDanger : styles.ticketDetail__ddCreated
              }
            >
              {ticket.createdAt
                ? new Date(ticket.createdAt).toLocaleString()
                : '—'}
            </dd>
          </div>
        </dl>

        {qrSrc && (
          <div className={styles.ticketDetail__qrSection}>
            <p className={styles.ticketDetail__qrCaption}>Entry QR code</p>
            <img
              src={qrSrc}
              alt={`QR for ${ticket.ticketCode}`}
              className={styles.ticketDetail__qrImg}
            />
            <p className={styles.ticketDetail__qrCodeNote}>Encodes: {ticket.ticketCode}</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete ticket?"
        message={
          ticket
            ? `Delete ticket ${ticket.ticketCode}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={deleteLoading}
        error={deleteError || undefined}
        onCancel={closeDeleteDialog}
        onConfirm={confirmDeleteTicket}
      />
    </div>
  );
}
