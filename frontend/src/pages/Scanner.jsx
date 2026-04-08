import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import api from '@src/api/client.js';
import { formatSek } from '@src/utils/formatCurrency.js';
import { getTicketCodeExample } from '@src/config/eventConfig.js';
import styles from '@src/pages/Scanner.module.css';

const SCANNER_ID = 'scanner-viewport';

/**
 * Full-width result card for scan outcomes (matches door-check dark “modal” style).
 */
function ScannerResultPanel({ message, onDismiss, closeButtonRef }) {
  const { type, text, detail } = message;

  const shellClass =
    type === 'success'
      ? styles.scannerResult__shellSuccess
      : type === 'warning'
        ? styles.scannerResult__shellWarn
        : detail
          ? styles.scannerResult__shellErrorDetail
          : styles.scannerResult__shellErrorSimple;

  if (!detail) {
    return (
      <div className={`${styles.scannerResult__simpleInner} ${shellClass}`}>
        <p className={styles.scannerResult__simpleText}>{text}</p>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onDismiss}
          className={styles.scannerResult__dismissBtn}
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.scannerResult__detailWrap} ${shellClass}`}>
      <p id="scanner-result-title" className={styles.scannerResult__detailTitle}>
        {text}
      </p>
      <div className={styles.scannerResult__divider} />
      <p className={styles.scannerResult__codeLine}>{detail.ticketCode}</p>
      <dl className={styles.scannerResult__dl}>
        <div className={styles.scannerResult__row}>
          <dt className={styles.scannerResult__dt}>Name</dt>
          <dd className={styles.scannerResult__ddNarrow}>{detail.fullName || '—'}</dd>
        </div>
        <div className={styles.scannerResult__row}>
          <dt className={styles.scannerResult__dt}>Adults</dt>
          <dd className={styles.scannerResult__dd}>{detail.countAdults ?? 0}</dd>
        </div>
        <div className={styles.scannerResult__row}>
          <dt className={styles.scannerResult__dt}>Student</dt>
          <dd className={styles.scannerResult__dd}>{detail.countStudent ?? 0}</dd>
        </div>
        <div className={styles.scannerResult__row}>
          <dt className={styles.scannerResult__dt}>Child</dt>
          <dd className={styles.scannerResult__dd}>{detail.countChild ?? 0}</dd>
        </div>
        <div className={styles.scannerResult__row}>
          <dt className={styles.scannerResult__dt}>Total attendance</dt>
          <dd className={styles.scannerResult__dd}>{detail.ticketCount != null ? detail.ticketCount : '—'}</dd>
        </div>
        <div className={styles.scannerResult__row}>
          <dt className={styles.scannerResult__dt}>Marked paid</dt>
          <dd
            className={detail.paid ? styles.scannerResult__paidYes : styles.scannerResult__paidNo}
          >
            {detail.paid ? 'Yes' : 'No'}
          </dd>
        </div>
        <div className={styles.scannerResult__row}>
          <dt className={styles.scannerResult__dt}>Amount (SEK)</dt>
          <dd className={styles.scannerResult__dd}>{formatSek(detail.price)}</dd>
        </div>
      </dl>
      <div className={styles.scannerResult__okRow}>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onDismiss}
          className={
            type === 'success'
              ? styles.scannerResult__okBtnSuccess
              : type === 'warning'
                ? styles.scannerResult__okBtnWarn
                : styles.scannerResult__okBtnError
          }
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
    <div className={styles.scannerModal__root} role="presentation">
      <button
        type="button"
        className={styles.scannerModal__backdrop}
        aria-label="Close dialog"
        onClick={onDismiss}
      />
      <div
        className={styles.scannerModal__panel}
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
    <div className={styles.scanner__page}>
      <div>
        <h1 className={styles.scanner__title}>Entry scanner</h1>
        <p className={styles.scanner__intro}>
          Scan a ticket QR code or enter the ticket code manually. Only tickets marked{' '}
          <strong className={styles.scanner__introStrong}>paid</strong> in the portal can be checked in; unpaid
          tickets are rejected.
        </p>
      </div>

      <div className={styles.scanner__viewportWrap}>
        <div id={SCANNER_ID} className={styles.scanner__viewport}>
          {!running && 'Camera preview appears here when started.'}
        </div>
      </div>

      <div className={styles.scanner__btnRow}>
        {!running ? (
          <button
            type="button"
            onClick={startScanner}
            disabled={checking}
            className={styles.scanner__btnStart}
          >
            Open camera &amp; scan
          </button>
        ) : (
          <button type="button" onClick={stopScanner} className={styles.scanner__btnStop}>
            Stop camera
          </button>
        )}
      </div>

      <form onSubmit={handleManual} className={styles.scanner__manualForm}>
        <label className={styles.scanner__manualLabel}>Manual ticket code</label>
        <div className={styles.scanner__manualRow}>
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder={getTicketCodeExample()}
            className={styles.scanner__manualInput}
          />
          <button
            type="submit"
            disabled={checking || !manualCode.trim()}
            className={styles.scanner__manualSubmit}
          >
            Verify
          </button>
        </div>
      </form>

      {checking && <p className={styles.scanner__verifying}>Verifying…</p>}

      {message && <ScannerResultModal message={message} onDismiss={dismissMessage} />}
    </div>
  );
}
