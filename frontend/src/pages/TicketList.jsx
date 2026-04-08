import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '@src/api/client.js';
import { formatSek } from '@src/utils/formatCurrency.js';
import { PAYMENT_FILTER_LABEL_PAID_TO_ORG } from '@src/config/eventConfig.js';
import { CITIES } from '@src/constants/cities.js';
import { labelForPaidTo } from '@src/constants/payment.js';
import { labelSubmissionSource } from '@src/constants/submissionSource.js';
import FormErrorAlert from '@src/components/common/FormErrorAlert.jsx';
import ConfirmDialog from '@src/components/common/ConfirmDialog.jsx';
import { useAuth } from '@src/context/AuthContext.jsx';
import { getApiErrorMessage } from '@src/utils/apiError.js';
import { canMutateTicket } from '@src/utils/sellerMatch.js';
import { pendingWebOrderVerification } from '@src/utils/ticketVerification.js';
import styles from '@src/pages/TicketList.module.css';

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
    <div className={styles.ticketList__page}>
      <div className={styles.ticketList__headerRow}>
        <div>
          <h1 className={styles.ticketList__title}>Tickets</h1>
          <p className={styles.ticketList__intro}>
            {role === 'admin' ? (
              <>
                Signed in as <span className={styles.ticketList__username}>{username}</span> (admin).
                All sellers&apos; tickets are listed unless you filter by seller below. Your cities:{' '}
                {allowedCities.length ? allowedCities.join(', ') : 'loading…'}.
              </>
            ) : (
              <>
                Signed in as <span className={styles.ticketList__username}>{username}</span>. By default
                you see only tickets where you are the verifying seller. Choose &quot;All tickets (everyone)&quot; in the
                list filter below to see every seller and admin. Your cities:{' '}
                {allowedCities.length ? allowedCities.join(', ') : 'loading…'}.
              </>
            )}
          </p>
        </div>
        <Link to="/tickets/new" className={styles.ticketList__newBtn}>
          Create ticket
        </Link>
      </div>

      <div className={styles.ticketList__filters}>
        <input
          type="search"
          placeholder="Search name, phone, or ticket code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.ticketList__searchInput}
        />
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className={styles.ticketList__select}
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
            className={styles.ticketList__selectScope}
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
            className={styles.ticketList__selectSeller}
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
          className={styles.ticketList__select}
        >
          <option value="all">Check-in (all)</option>
          <option value="false">Not checked in</option>
          <option value="true">Checked in</option>
        </select>
        <select
          value={paidFilter}
          onChange={(e) => setPaidFilter(e.target.value)}
          className={styles.ticketList__select}
        >
          <option value="all">Paid (all)</option>
          <option value="false">Not paid</option>
          <option value="true">Paid</option>
        </select>
        <select
          value={paidToFilter}
          onChange={(e) => setPaidToFilter(e.target.value)}
          className={styles.ticketList__select}
        >
          <option value="all">Payment to (all)</option>
          <option value="seller">To seller</option>
          <option value="nrna_ncc">{PAYMENT_FILTER_LABEL_PAID_TO_ORG}</option>
        </select>
        <select
          value={submissionSourceFilter}
          onChange={(e) => setSubmissionSourceFilter(e.target.value)}
          className={styles.ticketList__select}
        >
          <option value="all">Source (all)</option>
          <option value="public">Web order</option>
          <option value="seller">Seller portal</option>
        </select>
      </div>

      <FormErrorAlert message={error} />

      <div className={styles.ticketList__tableWrap}>
        <table className={styles.ticketList__table}>
          <thead>
            <tr className={styles.ticketList__theadRow}>
              <th className={styles.ticketList__th}>Ticket code</th>
              <th className={styles.ticketList__th}>Name</th>
              <th className={styles.ticketList__th}>Phone</th>
              <th className={styles.ticketList__th}>City</th>
              <th className={styles.ticketList__th}>Attendance</th>
              <th className={styles.ticketList__th}>Type</th>
              <th className={styles.ticketList__th}>Price (SEK)</th>
              <th className={styles.ticketList__th}>Sold by</th>
              <th className={styles.ticketList__th}>Paid</th>
              <th className={styles.ticketList__th}>Payment to</th>
              <th className={styles.ticketList__th}>Checked in</th>
              <th className={styles.ticketList__th}>Source</th>
              <th className={styles.ticketList__thActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} className={styles.ticketList__emptyCell}>
                  Loading…
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={13} className={styles.ticketList__emptyCell}>
                  No tickets match your filters.
                </td>
              </tr>
            ) : (
              tickets.map((t) => {
                const canMutate = canMutateTicket(t.soldBy, username, role, t.checkedIn);
                const needsVerify = pendingWebOrderVerification(t);
                return (
                  <tr
                    key={t.id ?? t.ticketCode}
                    className={needsVerify ? styles.ticketList__rowPending : styles.ticketList__rowMuted}
                  >
                    <td className={styles.ticketList__cell}>
                      <Link
                        to={`/tickets/detail/${encodeURIComponent(t.ticketCode)}`}
                        className={needsVerify ? styles.ticketList__linkCodePending : styles.ticketList__linkCodeOk}
                      >
                        {t.ticketCode}
                      </Link>
                    </td>
                    <td
                      className={`${styles.ticketList__cell} ${
                        needsVerify ? styles.ticketList__cellPending : styles.ticketList__cellDefault
                      }`}
                    >
                      {t.fullName}
                    </td>
                    <td
                      className={`${styles.ticketList__cellNowrap} ${
                        needsVerify ? styles.ticketList__cellPending : styles.ticketList__cellMuted
                      }`}
                    >
                      {t.phone || '—'}
                    </td>
                    <td
                      className={`${styles.ticketList__cell} ${
                        needsVerify ? styles.ticketList__cellPending : styles.ticketList__cellMuted
                      }`}
                    >
                      {t.city || '—'}
                    </td>
                    <td
                      className={`${styles.ticketList__cell} ${
                        needsVerify ? styles.ticketList__cellPending : styles.ticketList__priceCell
                      }`}
                    >
                      <span className={styles.ticketList__countMain}>{t.ticketCount}</span>
                      <span className={styles.ticketList__attendanceSub}>
                        A{t.countAdults ?? 0} · St{t.countStudent ?? 0} · C{t.countChild ?? 0}
                      </span>
                    </td>
                    <td
                      className={`${styles.ticketList__cell} ${
                        needsVerify ? styles.ticketList__cellPending : styles.ticketList__cellMuted
                      }`}
                    >
                      {t.ticketType}
                    </td>
                    <td
                      className={`${styles.ticketList__cell} ${
                        needsVerify ? styles.ticketList__cellPending : styles.ticketList__priceCell
                      }`}
                    >
                      {formatSek(t.price)}
                    </td>
                    <td
                      className={`${styles.ticketList__cell} ${
                        needsVerify ? styles.ticketList__cellPending : styles.ticketList__cellMuted
                      }`}
                    >
                      {t.soldBy}
                    </td>
                    <td className={styles.ticketList__cell}>
                      <span
                        className={
                          needsVerify
                            ? Boolean(t.paid)
                              ? styles.ticketList__paidYesPending
                              : styles.ticketList__paidNoPending
                            : Boolean(t.paid)
                              ? styles.ticketList__paidYesOk
                              : styles.ticketList__paidNoOk
                        }
                      >
                        {Boolean(t.paid) ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td
                      className={`${styles.ticketList__cell} ${
                        needsVerify ? styles.ticketList__paidToCellPending : styles.ticketList__paidToCell
                      }`}
                    >
                      {Boolean(t.paid) ? labelForPaidTo(t.paidTo) : '—'}
                    </td>
                    <td className={styles.ticketList__cell}>
                      <span
                        className={
                          needsVerify
                            ? t.checkedIn
                              ? styles.ticketList__checkYesPending
                              : styles.ticketList__checkNoPending
                            : t.checkedIn
                              ? styles.ticketList__checkYesOk
                              : styles.ticketList__checkNoOk
                        }
                      >
                        {t.checkedIn ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td
                      className={
                        needsVerify ? styles.ticketList__sourceCellPending : styles.ticketList__sourceCell
                      }
                    >
                      <span className={styles.ticketList__sourceLabel}>{labelSubmissionSource(t.submissionSource)}</span>
                      {needsVerify && (
                        <span className={styles.ticketList__needsVerify}>Needs verification</span>
                      )}
                    </td>
                    <td className={styles.ticketList__actionsCell}>
                      {canMutate ? (
                        <span className={styles.ticketList__actionRow}>
                          <Link
                            to={`/tickets/detail/${encodeURIComponent(t.ticketCode)}/edit`}
                            className={styles.ticketList__actionEdit}
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            className={styles.ticketList__actionDelete}
                            onClick={() =>
                              openDeleteDialog(t.ticketCode, t.soldBy, t.checkedIn)
                            }
                          >
                            Delete
                          </button>
                        </span>
                      ) : (
                        <span className={styles.ticketList__actionDash}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading && (
          <div className={styles.ticketList__summary}>
            <h2 className={styles.ticketList__summaryTitle}>Collected amounts (paid tickets only)</h2>
            <p className={styles.ticketList__summaryIntro}>
              Based on the tickets currently shown ({paidCollectionSummary.paidCount} paid
              {tickets.length !== paidCollectionSummary.paidCount
                ? ` of ${tickets.length} listed`
                : ''}
              ).
            </p>
            <div className={styles.ticketList__summaryGrid}>
              <div>
                <h3 className={styles.ticketList__summaryColTitle}>By city</h3>
                {paidCollectionSummary.byCity.length === 0 ? (
                  <p className={styles.ticketList__summaryEmpty}>—</p>
                ) : (
                  <ul className={styles.ticketList__summaryList}>
                    {paidCollectionSummary.byCity.map(([city, amount]) => (
                      <li key={city} className={styles.ticketList__summaryRow}>
                        <span>{city}</span>
                        <span className={styles.ticketList__summaryAmount}>{formatSek(amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className={styles.ticketList__summaryColTitle}>By seller</h3>
                {paidCollectionSummary.bySeller.length === 0 ? (
                  <p className={styles.ticketList__summaryEmpty}>—</p>
                ) : (
                  <ul className={styles.ticketList__summaryList}>
                    {paidCollectionSummary.bySeller.map(([seller, amount]) => (
                      <li key={seller} className={styles.ticketList__summaryRow}>
                        <span className={styles.ticketList__summarySeller}>{seller}</span>
                        <span className={styles.ticketList__summarySellerAmt}>{formatSek(amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <p className={styles.ticketList__summaryTotal}>
              <span className={styles.ticketList__summaryTotalLabel}>Total collected </span>
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
