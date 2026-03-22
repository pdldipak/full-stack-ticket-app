import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import FormErrorAlert from '../components/common/FormErrorAlert.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { getApiErrorMessage } from '../utils/apiError.js';
import { formatSek } from '../utils/formatCurrency.js';
import { useAuth } from '../context/AuthContext.jsx';
import { canMutateTicket } from '../utils/sellerMatch.js';
import { canVerifyWebOrder, pendingWebOrderVerification } from '../utils/ticketVerification.js';
import {
  EVENT_ARTIST,
  EVENT_ORGANIZER,
  EVENT_TITLE,
  getEventDateForCity,
  getEventTimeForCity,
  getVenueForCity,
} from '../config/eventConfig.js';
import { labelForPaidTo } from '../constants/payment.js';
import { labelSubmissionSource } from '../constants/submissionSource.js';

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
    return (
      <div className="text-center text-slate-500 dark:text-slate-400 py-12">Loading ticket…</div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-4">
        <FormErrorAlert message={error || 'Ticket not found'} />
        <Link to="/tickets" className="text-emerald-600 hover:underline dark:text-emerald-400">
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
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1
            className={
              needsWebVerify
                ? 'text-2xl font-bold text-red-700 font-mono dark:text-red-300'
                : 'text-2xl font-bold text-slate-900 dark:text-white font-mono'
            }
          >
            {ticket.ticketCode}
          </h1>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
            {EVENT_ORGANIZER}
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
            {EVENT_TITLE} · {EVENT_ARTIST}
          </p>
          <p
            className={
              needsWebVerify
                ? 'text-red-700 dark:text-red-300 text-sm mt-1 font-medium'
                : 'text-slate-600 dark:text-slate-400 text-sm mt-1'
            }
          >
            {ticket.fullName}
          </p>
          {needsWebVerify && (
            <p className="text-red-700 dark:text-red-300 text-xs mt-1.5 leading-snug">
              Web order — verification required. Confirm using the same phone number the customer entered on the web form.
            </p>
          )}
        </div>
        <Link
          to="/tickets"
          className="text-sm text-emerald-600 hover:underline shrink-0 dark:text-emerald-400"
        >
          All tickets
        </Link>
      </div>

      {(canMutate || showVerifyBtn) && (
        <div className="flex flex-wrap gap-2">
          {showVerifyBtn && (
            <button
              type="button"
              disabled={verifyLoading}
              onClick={openVerifyDialog}
              className="rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
            >
              Verify web order
            </button>
          )}
          {canMutate && (
            <>
              <Link
                to={`/tickets/detail/${encodeURIComponent(ticket.ticketCode)}/edit`}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={openDeleteDialog}
                className="rounded-lg border border-red-300 text-red-700 hover:bg-red-50 px-4 py-2 text-sm font-medium transition dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/50"
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {verifyDialogOpen && ticket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/60 dark:bg-black/70"
            aria-label="Close dialog"
            onClick={closeVerifyDialog}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="verify-order-title"
            className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <h2
              id="verify-order-title"
              className="text-lg font-semibold text-slate-900 dark:text-white"
            >
              Verify web order
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Type the same phone number the customer used on the web order. It must match exactly (spaces and formatting
              can differ).
            </p>
            {ticket.phone && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Number on this order:{' '}
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{ticket.phone}</span>
              </p>
            )}
            <label htmlFor="verify-phone-input" className="sr-only">
              Customer phone number
            </label>
            <input
              id="verify-phone-input"
              type="tel"
              autoComplete="tel"
              value={verifyPhoneInput}
              onChange={(e) => setVerifyPhoneInput(e.target.value)}
              placeholder="Same as on web form"
              className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            {verifyDialogError && (
              <div className="mt-3">
                <FormErrorAlert message={verifyDialogError} />
              </div>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={closeVerifyDialog}
                disabled={verifyLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
                onClick={submitVerifyWebOrder}
                disabled={verifyLoading}
              >
                {verifyLoading ? 'Verifying…' : 'Confirm verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800">
        {needsWebVerify && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100">
            <strong className="font-semibold">Awaiting verification.</strong>{' '}
            Details below are shown in red until this web order is confirmed.
          </div>
        )}
        <dl className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className={needsWebVerify ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500'}>
              City
            </dt>
            <dd
              className={
                needsWebVerify
                  ? 'text-red-800 text-right font-medium dark:text-red-200'
                  : 'text-slate-900 text-right dark:text-white'
              }
            >
              {ticket.city || '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className={needsWebVerify ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500'}>
              Concert date
            </dt>
            <dd
              className={
                needsWebVerify
                  ? 'text-red-800 text-right font-medium dark:text-red-200'
                  : 'text-slate-900 text-right dark:text-white'
              }
            >
              {getEventDateForCity(ticket.city) || '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className={needsWebVerify ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500'}>
              Time
            </dt>
            <dd
              className={
                needsWebVerify
                  ? 'text-red-800 text-right font-medium dark:text-red-200'
                  : 'text-slate-900 text-right dark:text-white'
              }
            >
              {getEventTimeForCity(ticket.city) || '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className={needsWebVerify ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500'}>
              Venue
            </dt>
            <dd
              className={
                needsWebVerify
                  ? 'text-red-800 text-right font-medium dark:text-red-200'
                  : 'text-slate-900 text-right dark:text-white'
              }
            >
              {getVenueForCity(ticket.city) || '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className={needsWebVerify ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500'}>
              Phone
            </dt>
            <dd
              className={
                needsWebVerify
                  ? 'text-red-800 text-right font-medium dark:text-red-200'
                  : 'text-slate-900 text-right dark:text-white'
              }
            >
              {ticket.phone || '—'}
            </dd>
          </div>
          {ticket.submissionSource === 'public' && (
            <div className="flex justify-between gap-4">
              <dt className={needsWebVerify ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500'}>
                Phone contact consent
              </dt>
              <dd
                className={
                  needsWebVerify
                    ? 'text-red-800 text-right font-medium dark:text-red-200'
                    : 'text-slate-900 text-right dark:text-white'
                }
              >
                {ticket.phoneContactConsent ? 'Yes' : 'No'}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className={needsWebVerify ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500'}>
              Order source
            </dt>
            <dd
              className={
                needsWebVerify
                  ? 'text-red-800 text-right font-medium dark:text-red-200'
                  : 'text-slate-900 text-right dark:text-white'
              }
            >
              {labelSubmissionSource(ticket.submissionSource)}
            </dd>
          </div>
          {ticket.submissionSource === 'public' && ticket.verifiedAt && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-500">Verified</dt>
              <dd className="text-slate-900 text-right dark:text-white">
                {ticket.verifiedBy ? `${ticket.verifiedBy} · ` : ''}
                {new Date(ticket.verifiedAt).toLocaleString()}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className={needsWebVerify ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500'}>
              Ticket type
            </dt>
            <dd
              className={
                needsWebVerify
                  ? 'text-red-800 text-right font-medium dark:text-red-200'
                  : 'text-slate-900 text-right dark:text-white'
              }
            >
              {ticket.ticketType}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className={needsWebVerify ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500'}>
              Attendance
            </dt>
            <dd
              className={
                needsWebVerify
                  ? 'text-red-800 text-right font-medium dark:text-red-200'
                  : 'text-slate-900 dark:text-white'
              }
            >
              <span className="block">
                Adults {ticket.countAdults ?? 0}, student {ticket.countStudent ?? 0}, child {ticket.countChild ?? 0}
              </span>
              <span className="block text-xs font-normal text-slate-600 dark:text-slate-400 mt-0.5">
                Total attendance: {ticket.ticketCount ?? 0}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className={needsWebVerify ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500'}>
              Price (SEK)
            </dt>
            <dd
              className={
                needsWebVerify
                  ? 'text-red-800 text-right font-medium dark:text-red-200'
                  : 'text-slate-900 dark:text-white'
              }
            >
              {formatSek(ticket.price)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className={needsWebVerify ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500'}>
              Sold by
            </dt>
            <dd
              className={
                needsWebVerify
                  ? 'text-red-800 text-right font-medium dark:text-red-200'
                  : 'text-slate-900 dark:text-white'
              }
            >
              {ticket.soldBy}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className={needsWebVerify ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500'}>
              Paid
            </dt>
            <dd
              className={
                needsWebVerify
                  ? Boolean(ticket.paid)
                    ? 'text-red-800 font-medium dark:text-red-200'
                    : 'text-red-700 dark:text-red-300'
                  : Boolean(ticket.paid)
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
              }
            >
              {Boolean(ticket.paid) ? 'Yes' : 'No'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className={needsWebVerify ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500'}>
              Payment to
            </dt>
            <dd
              className={
                needsWebVerify
                  ? 'text-red-800 text-right font-medium dark:text-red-200'
                  : 'text-slate-900 text-right dark:text-white'
              }
            >
              {Boolean(ticket.paid) ? labelForPaidTo(ticket.paidTo) : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className={needsWebVerify ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500'}>
              Checked in
            </dt>
            <dd
              className={
                needsWebVerify
                  ? ticket.checkedIn
                    ? 'text-red-800 font-medium dark:text-red-200'
                    : 'text-red-700 dark:text-red-300'
                  : ticket.checkedIn
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
              }
            >
              {ticket.checkedIn ? 'Yes' : 'No'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className={needsWebVerify ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-500'}>
              Created
            </dt>
            <dd
              className={
                needsWebVerify
                  ? 'text-red-800 text-right font-medium dark:text-red-200'
                  : 'text-slate-700 text-right dark:text-slate-300'
              }
            >
              {ticket.createdAt
                ? new Date(ticket.createdAt).toLocaleString()
                : '—'}
            </dd>
          </div>
        </dl>

        {qrSrc && (
          <div className="pt-4 border-t border-slate-200 flex flex-col items-center dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">Entry QR code</p>
            <img
              src={qrSrc}
              alt={`QR for ${ticket.ticketCode}`}
              className="w-56 h-56 bg-white rounded-lg p-2"
            />
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 font-mono">
              Encodes: {ticket.ticketCode}
            </p>
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
