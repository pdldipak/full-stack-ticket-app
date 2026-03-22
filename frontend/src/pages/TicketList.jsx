import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { formatSek } from '../utils/formatCurrency.js';
import { PAYMENT_FILTER_LABEL_PAID_TO_ORG } from '../config/eventConfig.js';
import { CITIES } from '../constants/cities.js';
import { labelForPaidTo } from '../constants/payment.js';
import { labelSubmissionSource } from '../constants/submissionSource.js';
import FormErrorAlert from '../components/common/FormErrorAlert.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage } from '../utils/apiError.js';
import { canMutateTicket } from '../utils/sellerMatch.js';
import { pendingWebOrderVerification } from '../utils/ticketVerification.js';

export default function TicketList() {
  const { username, allowedCities, role, sellerUsernames } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [checkedInFilter, setCheckedInFilter] = useState('all');
  const [paidFilter, setPaidFilter] = useState('all');
  const [paidToFilter, setPaidToFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [submissionSourceFilter, setSubmissionSourceFilter] = useState('all');
  /**
   * Admin only: filter by verifying seller. Use "" for "all sellers" (not the string "all", which could match a username).
   */
  const [sellerFilter, setSellerFilter] = useState('');
  /** Seller: default own sales only; "all" loads every ticket (same rows as admin list). */
  const [sellerListScope, setSellerListScope] = useState('mine');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (checkedInFilter === 'true') params.checkedIn = 'true';
      if (checkedInFilter === 'false') params.checkedIn = 'false';
      if (paidFilter === 'true') params.paid = 'true';
      if (paidFilter === 'false') params.paid = 'false';
      if (paidToFilter !== 'all') params.paidTo = paidToFilter;
      if (cityFilter !== 'all') params.city = cityFilter;
      if (submissionSourceFilter === 'public' || submissionSourceFilter === 'seller') {
        params.submissionSource = submissionSourceFilter;
      }
      if (role === 'admin' && sellerFilter.trim()) {
        params.soldBy = sellerFilter.trim();
      }
      if (role === 'seller' && sellerListScope === 'all') {
        params.scope = 'all';
      }
      const { data } = await api.get('/tickets', { params });
      setTickets(data.tickets || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load tickets'));
    } finally {
      setLoading(false);
    }
  }, [
    search,
    checkedInFilter,
    paidFilter,
    paidToFilter,
    cityFilter,
    submissionSourceFilter,
    role,
    sellerFilter,
    sellerListScope,
  ]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchTickets();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchTickets]);

  useEffect(() => {
    if (role !== 'seller') return;
    if (allowedCities.length === 1) {
      setCityFilter(allowedCities[0]);
    }
  }, [allowedCities, role]);

  const paidCollectionSummary = useMemo(() => {
    const paidTickets = tickets.filter((t) => Boolean(t.paid));
    const byCity = new Map();
    const bySeller = new Map();
    let total = 0;
    for (const t of paidTickets) {
      const price = Number(t.price);
      const amount = Number.isNaN(price) ? 0 : price;
      total += amount;
      const cityKey = t.city || '—';
      const sellerKey = t.soldBy || '—';
      byCity.set(cityKey, (byCity.get(cityKey) || 0) + amount);
      bySeller.set(sellerKey, (bySeller.get(sellerKey) || 0) + amount);
    }
    const sortEntries = (entries) =>
      [...entries].sort(([a], [b]) => String(a).localeCompare(String(b), 'sv'));
    return {
      total,
      byCity: sortEntries(byCity),
      bySeller: sortEntries(bySeller),
      paidCount: paidTickets.length,
    };
  }, [tickets]);

  const openDeleteDialog = (ticketCode, soldBy, checkedIn) => {
    if (!canMutateTicket(soldBy, username, role, checkedIn)) return;
    setDeleteError('');
    setDeleteTarget({ ticketCode, soldBy });
  };

  const closeDeleteDialog = () => {
    if (deleteLoading) return;
    setDeleteTarget(null);
    setDeleteError('');
  };

  const confirmDeleteTicket = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete(`/tickets/${encodeURIComponent(deleteTarget.ticketCode)}`);
      setDeleteTarget(null);
      fetchTickets();
    } catch (err) {
      setDeleteError(
        err.response?.data?.error || err.message || 'Could not delete ticket'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tickets</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            {role === 'admin' ? (
              <>
                Signed in as <span className="font-medium text-slate-800 dark:text-slate-200">{username}</span> (admin).
                All sellers&apos; tickets are listed unless you filter by seller below. Your cities:{' '}
                {allowedCities.length ? allowedCities.join(', ') : 'loading…'}.
              </>
            ) : (
              <>
                Signed in as <span className="font-medium text-slate-800 dark:text-slate-200">{username}</span>. By default
                you see only tickets where you are the verifying seller. Choose &quot;All tickets (everyone)&quot; in the
                list filter below to see every seller and admin. Your cities:{' '}
                {allowedCities.length ? allowedCities.join(', ') : 'loading…'}.
              </>
            )}
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="inline-flex justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition"
        >
          Create ticket
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 flex-wrap">
        <input
          type="search"
          placeholder="Search name, phone, or ticket code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
        />
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
        >
          <option value="all">All cities</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {role === 'seller' && (
          <select
            value={sellerListScope}
            onChange={(e) => setSellerListScope(e.target.value)}
            className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white min-w-[11rem]"
            aria-label="Whose tickets to show"
          >
            <option value="mine">My tickets only</option>
            <option value="all">All tickets (everyone)</option>
          </select>
        )}
        {role === 'admin' && sellerUsernames.length > 0 && (
          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white min-w-[10rem]"
          >
            <option value="">All sellers</option>
            {sellerUsernames.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
        <select
          value={checkedInFilter}
          onChange={(e) => setCheckedInFilter(e.target.value)}
          className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
        >
          <option value="all">Check-in (all)</option>
          <option value="false">Not checked in</option>
          <option value="true">Checked in</option>
        </select>
        <select
          value={paidFilter}
          onChange={(e) => setPaidFilter(e.target.value)}
          className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
        >
          <option value="all">Paid (all)</option>
          <option value="false">Not paid</option>
          <option value="true">Paid</option>
        </select>
        <select
          value={paidToFilter}
          onChange={(e) => setPaidToFilter(e.target.value)}
          className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
        >
          <option value="all">Payment to (all)</option>
          <option value="seller">To seller</option>
          <option value="nrna_ncc">{PAYMENT_FILTER_LABEL_PAID_TO_ORG}</option>
        </select>
        <select
          value={submissionSourceFilter}
          onChange={(e) => setSubmissionSourceFilter(e.target.value)}
          className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
        >
          <option value="all">Source (all)</option>
          <option value="public">Web order</option>
          <option value="seller">Seller portal</option>
        </select>
      </div>

      <FormErrorAlert message={error} />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600 dark:border-slate-800 dark:text-slate-400">
              <th className="px-4 py-3 font-medium">Ticket code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Attendance</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Price (SEK)</th>
              <th className="px-4 py-3 font-medium">Sold by</th>
              <th className="px-4 py-3 font-medium">Paid</th>
              <th className="px-4 py-3 font-medium">Payment to</th>
              <th className="px-4 py-3 font-medium">Checked in</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-slate-500 dark:text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-slate-500 dark:text-slate-500">
                  No tickets match your filters.
                </td>
              </tr>
            ) : (
              tickets.map((t) => {
                const canMutate = canMutateTicket(t.soldBy, username, role, t.checkedIn);
                const needsVerify = pendingWebOrderVerification(t);
                const rowMuted =
                  'border-b border-slate-200/80 hover:bg-slate-100/80 dark:border-slate-800/80 dark:hover:bg-slate-800/30';
                const rowPending =
                  'border-b border-red-200/80 bg-red-50/40 hover:bg-red-50/70 dark:border-red-900/50 dark:bg-red-950/25 dark:hover:bg-red-950/40';
                const cellDefault = 'text-slate-900 dark:text-white';
                const cellMuted = 'text-slate-700 dark:text-slate-300';
                const cellPending = 'text-red-700 dark:text-red-300';
                return (
                  <tr
                    key={t.id ?? t.ticketCode}
                    className={needsVerify ? rowPending : rowMuted}
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/tickets/detail/${encodeURIComponent(t.ticketCode)}`}
                        className={
                          needsVerify
                            ? 'text-red-700 hover:underline font-mono font-medium dark:text-red-300'
                            : 'text-emerald-600 hover:underline font-mono dark:text-emerald-400'
                        }
                      >
                        {t.ticketCode}
                      </Link>
                    </td>
                    <td className={`px-4 py-3 ${needsVerify ? cellPending : cellDefault}`}>
                      {t.fullName}
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap ${needsVerify ? cellPending : cellMuted}`}
                    >
                      {t.phone || '—'}
                    </td>
                    <td className={`px-4 py-3 ${needsVerify ? cellPending : cellMuted}`}>
                      {t.city || '—'}
                    </td>
                    <td className={`px-4 py-3 ${needsVerify ? cellPending : 'text-slate-800 dark:text-slate-200'}`}>
                      <span className="font-medium tabular-nums">{t.ticketCount}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        A{t.countAdults ?? 0} · St{t.countStudent ?? 0} · C{t.countChild ?? 0}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${needsVerify ? cellPending : cellMuted}`}>
                      {t.ticketType}
                    </td>
                    <td className={`px-4 py-3 ${needsVerify ? cellPending : 'text-slate-800 dark:text-slate-200'}`}>
                      {formatSek(t.price)}
                    </td>
                    <td className={`px-4 py-3 ${needsVerify ? cellPending : cellMuted}`}>{t.soldBy}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          needsVerify
                            ? Boolean(t.paid)
                              ? 'text-red-800 dark:text-red-200'
                              : 'text-red-700 dark:text-red-300'
                            : Boolean(t.paid)
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {Boolean(t.paid) ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 ${needsVerify ? `${cellPending} text-xs` : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      {Boolean(t.paid) ? labelForPaidTo(t.paidTo) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          needsVerify
                            ? t.checkedIn
                              ? 'text-red-800 dark:text-red-200'
                              : 'text-red-700 dark:text-red-300'
                            : t.checkedIn
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {t.checkedIn ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${needsVerify ? cellPending : 'text-slate-700 dark:text-slate-300'}`}>
                      <span className="block">{labelSubmissionSource(t.submissionSource)}</span>
                      {needsVerify && (
                        <span className="block font-medium mt-0.5">Needs verification</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {canMutate ? (
                        <span className="inline-flex gap-2">
                          <Link
                            to={`/tickets/detail/${encodeURIComponent(t.ticketCode)}/edit`}
                            className="text-emerald-600 hover:underline text-xs dark:text-emerald-400"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="text-red-600 hover:underline text-xs dark:text-red-400"
                            onClick={() =>
                              openDeleteDialog(t.ticketCode, t.soldBy, t.checkedIn)
                            }
                          >
                            Delete
                          </button>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs dark:text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && (
          <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/80">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Collected amounts (paid tickets only)
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Based on the tickets currently shown ({paidCollectionSummary.paidCount} paid
              {tickets.length !== paidCollectionSummary.paidCount
                ? ` of ${tickets.length} listed`
                : ''}
              ).
            </p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
                  By city
                </h3>
                {paidCollectionSummary.byCity.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">—</p>
                ) : (
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {paidCollectionSummary.byCity.map(([city, amount]) => (
                      <li
                        key={city}
                        className="flex justify-between gap-4 text-slate-700 dark:text-slate-300"
                      >
                        <span>{city}</span>
                        <span className="font-medium tabular-nums text-slate-900 dark:text-white">
                          {formatSek(amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
                  By seller
                </h3>
                {paidCollectionSummary.bySeller.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">—</p>
                ) : (
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {paidCollectionSummary.bySeller.map(([seller, amount]) => (
                      <li
                        key={seller}
                        className="flex justify-between gap-4 text-slate-700 dark:text-slate-300"
                      >
                        <span className="break-all">{seller}</span>
                        <span className="shrink-0 font-medium tabular-nums text-slate-900 dark:text-white">
                          {formatSek(amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <p className="mt-4 border-t border-slate-200 pt-3 text-sm font-semibold text-slate-900 dark:text-white dark:border-slate-800">
              <span className="font-normal text-slate-600 dark:text-slate-400">Total collected </span>
              {formatSek(paidCollectionSummary.total)}
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete ticket?"
        message={
          deleteTarget
            ? `Delete ticket ${deleteTarget.ticketCode}? This cannot be undone.`
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
