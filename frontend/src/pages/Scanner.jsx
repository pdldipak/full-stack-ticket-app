import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/client.js';
import { formatSek } from '../utils/formatCurrency.js';

const SCANNER_ID = 'scanner-viewport';

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
          text: data.message || 'Ticket is not marked as paid — entry not allowed.',
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
            placeholder="TKT-0001"
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

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-100'
              : message.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-100'
                : 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/50 dark:border-red-800 dark:text-red-100'
          }`}
        >
          <p className="font-medium">{message.text}</p>
          {message.detail && (
            <div className="mt-3 space-y-2 text-left border-t border-current/20 pt-3 text-sm">
              <p className="font-mono text-xs opacity-80">{message.detail.ticketCode}</p>
              <dl className="space-y-1.5">
                <div className="flex justify-between gap-4">
                  <dt className="opacity-80">Name</dt>
                  <dd className="font-medium text-right">{message.detail.fullName || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="opacity-80">Adults</dt>
                  <dd className="font-medium text-right tabular-nums">{message.detail.countAdults ?? 0}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="opacity-80">Student</dt>
                  <dd className="font-medium text-right tabular-nums">{message.detail.countStudent ?? 0}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="opacity-80">Child</dt>
                  <dd className="font-medium text-right tabular-nums">{message.detail.countChild ?? 0}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="opacity-80">Total attendance</dt>
                  <dd className="font-medium text-right tabular-nums">
                    {message.detail.ticketCount != null ? message.detail.ticketCount : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="opacity-80">Amount (paid)</dt>
                  <dd className="font-medium text-right tabular-nums">{formatSek(message.detail.price)}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
