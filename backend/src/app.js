import './loadEnv.js';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import { getCorsOptions } from './config/corsOptions.js';
import { getPool, closePool } from './config/database.js';
import { validateEnv } from './config/validateEnv.js';
import { getTicketCodeFormatLogLine } from './config/ticketCode.js';

console.log(`[config] ticket codes: ${getTicketCodeFormatLogLine()}`);

validateEnv();

const app = express();
const port = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === 'production';

if (isProd || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cors(getCorsOptions()));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'event-tickets-api', health: '/health' });
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/health/ready', async (req, res) => {
  try {
    await getPool().query('SELECT 1');
    res.json({ ok: true, database: true });
  } catch {
    res.status(503).json({ ok: false, database: false });
  }
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 400 : 2000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});
app.use(globalLimiter);

app.use('/public', publicRoutes);
app.use('/auth', authRoutes);
app.use('/tickets', ticketRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  const payload = { error: 'Internal server error' };
  if (!isProd) {
    payload.details = err.message;
  }
  res.status(500).json(payload);
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on port ${port} (${isProd ? 'production' : 'development'})`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    try {
      await closePool();
    } catch (e) {
      console.error('Error closing database pool', e);
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
