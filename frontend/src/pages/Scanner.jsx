import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/client.js';
import { formatSek } from '../utils/formatCurrency.js';
import { getTicketCodeExample } from '../config/eventConfig.js';

const SCANNER_ID = 'scanner-viewport';

/**
 * Full-width result card for scan outcomes (matches door-check dark “modal” style).
 */
function ScannerResultPanel({ message, onDismiss, closeButtonRef }) {
  const { type, text, detail } = message;

  const shell =
    type === 'success'
      ? 'border-2 border-emerald-500/90 bg-gradient-to-b from-emerald-950/90 to-neutral-950 shadow-xl shadow-emerald-950/40'
      : type === 'warning'
        ? 'border-2 border-amber-500/90 bg-gradient-to-b from-amber-950/80 to-neutral-950 shadow-xl shadow-amber-950/30'
        : detail
          ? 'border-2 border-red-500/90 bg-gradient-to-b from-red-950/85 to-[#120809] shadow-xl shadow-red-950/50'
          : 'border border-red-300/80 bg-red-50 text-red-950 dark:border-red-700 dark:bg-red-950/40 dark:text-red-100';

  if (!detail) {
    return (
      <div className={`rounded-xl px-4 py-3 text-sm ${shell}`}>
        <p className="font-medium">{text}</p>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onDismiss}
          className="mt-3 rounded-lg border border-red-800/30 bg-red-900/10 px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-900/20 dark:border-white/20 dark:bg-white/10 dark:text-red-100 dark:hover:bg-white/15"
        >
          Dismiss
        </button>
      </div>
    );
  }

  const dtClass = 'text-slate-400 text-sm';
  const ddClass = 'text-sm font-medium text-white text-right tabular-nums';

  return (
    <div className={`rounded-xl p-5 text-sm text-white ${shell}`}>
      <p id="scanner-result-title" className="text-[15px] font-semibold leading-snug text-white">
        {text}
      </p>
      <div className="my-4 border-t border-slate-500/40" />
      <p className="mb-4 font-mono text-xs tracking-wide text-slate-400">{detail.ticketCode}</p>
      <dl className="space-y-2.5">
        <div className="flex justify-between gap-6">
          <dt className={dtClass}>Name</dt>
          <dd className={`${ddClass} max-w-[60%]`}>{detail.fullName || '—'}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className={dtClass}>Adults</dt>
          <dd className={ddClass}>{detail.countAdults ?? 0}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className={dtClass}>Student</dt>
          <dd className={ddClass}>{detail.countStudent ?? 0}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className={dtClass}>Child</dt>
          <dd className={ddClass}>{detail.countChild ?? 0}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className={dtClass}>Total attendance</dt>
          <dd className={ddClass}>{detail.ticketCount != null ? detail.ticketCount : '—'}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className={dtClass}>Marked paid</dt>
          <dd
            className={`text-right text-sm font-semibold tabular-nums ${
              detail.paid ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {detail.paid ? 'Yes' : 'No'}
          </dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className={dtClass}>Amount (SEK)</dt>
          <dd className={ddClass}>{formatSek(detail.price)}</dd>
        </div>
      </dl>
      <div className="mt-5 flex justify-end">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onDismiss}
          className={`rounded-lg px-8 py-2.5 text-sm font-semibold transition ${
            type === 'success'
              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
              : type === 'warning'
                ? 'bg-amber-600 text-white hover:bg-amber-500'
                : 'bg-red-700 text-white hover:bg-red-600'
          }`}
        >
          OK
        </button>
      </div>
    </div>
  );
}

/**
 * Centered modal over a dimmed backdrop (portal → document.body so it always stacks above the layout).
 */
function ScannerResultModal({ message, onDismiss }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', onKey);

    const t = window.setTimeout(() => closeRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [onDismiss]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px] dark:bg-black/70"
        aria-label="Close dialog"
        onClick={onDismiss}
      />
      <div
        className="relative z-[201] w-full max-w-lg max-h-[min(90vh,640px)] overflow-y-auto shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scanner-result-title"
        onClick={(e) => e.stopPropagation()}
      >
        <ScannerResultPanel message={message} onDismiss={onDismiss} closeButtonRef={closeRef} />
      </div>
    </div>,
    document.body
  );
}

function normalizeScannedText(text) {
  const trimmed = String(text || '').trim();
  const upper = trimmed.toUpperCase();
  const match = upper.match(/TKT-\d+/);
  return match ? match[0] : upper;
}

export default function Scanner() {
  const scannerRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [checking, setChecking] = useState(false);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setRunning(false);
  };

  const startScanner = async () => {
    await stopScanner();
    setMessage(null);
    const html5 = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = html5;
    setRunning(true);
    try {
      await html5.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          const code = normalizeScannedText(decodedText);
          if (code) {
            await stopScanner();
            await verifyCode(code);
          }
        },
        () => {}
      );
    } catch (err) {
      setRunning(false);
      setMessage({
        type: 'error',
        text:
          err.message ||
          'Could not start camera. Allow permission or use manual entry.',
      });
    }
  };

  const verifyCode = async (ticketCode) => {
    setChecking(true);
    setMessage(null);
    try {
      const { data } = await api.post('/tickets/checkin', { ticketCode });
      if (data.status === 'invalid') {
        setMessage({ type: 'error', text: data.message || 'Invalid ticket' });
      } else if (data.status === 'already_checked_in') {
        setMessage({
          type: 'warning',
          text: data.message || 'Already checked in',
          detail: data.ticket,
        });
      } else if (data.status === 'not_paid') {
        setMessage({
          type: 'error',
          text:
            data.message ||
            'Payment is not complete — entry not allowed until the ticket is marked paid with a valid amount.',
          detail: data.ticket,
        });
      } else if (data.status === 'success') {
        setMessage({
          type: 'success',
          text: data.message || 'Entry granted',
          detail: data.ticket,
        });
      } else {
        setMessage({ type: 'error', text: 'Unexpected response' });
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setMessage({
          type: 'error',
          text: err.response?.data?.message || 'Ticket does not exist',
        });
      } else {
        setMessage({
          type: 'error',
          text: err.response?.data?.error || err.message || 'Check-in failed',
        });
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleManual = (e) => {
    e.preventDefault();
    const code = normalizeScannedText(manualCode);
    if (code) verifyCode(code);
  };

  const dismissMessage = () => setMessage(null);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Entry scanner</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Scan a ticket QR code or enter the ticket code manually. Only tickets marked{' '}
          <strong className="text-slate-800 dark:text-slate-200">paid</strong> in the portal can be checked in; unpaid
          tickets are rejected.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-100 overflow-hidden dark:border-slate-800 dark:bg-slate-900/50">
        <div
          id={SCANNER_ID}
          className="min-h-[280px] w-full bg-black flex items-center justify-center text-slate-400 text-sm dark:text-slate-500"
        >
          {!running && 'Camera preview appears here when started.'}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {!running ? (
          <button
            type="button"
            onClick={startScanner}
            disabled={checking}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-white font-medium disabled:opacity-50"
          >
            Open camera &amp; scan
          </button>
        ) : (
          <button
            type="button"
            onClick={stopScanner}
            className="rounded-lg bg-slate-600 hover:bg-slate-500 px-4 py-2 text-white font-medium dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Stop camera
          </button>
        )}
      </div>

      <form onSubmit={handleManual} className="space-y-2">
        <label className="block text-sm text-slate-600 dark:text-slate-400">Manual ticket code</label>
        <div className="flex gap-2">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder={getTicketCodeExample()}
            className="flex-1 rounded-lg bg-white border border-slate-300 px-3 py-2 text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
          />
          <button
            type="submit"
            disabled={checking || !manualCode.trim()}
            className="rounded-lg bg-slate-600 hover:bg-slate-500 px-4 py-2 text-white disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Verify
          </button>
        </div>
      </form>

      {checking && (
        <p className="text-slate-600 dark:text-slate-400 text-sm">Verifying…</p>
      )}

      {message && <ScannerResultModal message={message} onDismiss={dismissMessage} />}
    </div>
  );
}
