import { body, param, validationResult } from 'express-validator';
import { ALLOWED_CITIES } from '../config/cities.js';
import { sellerMayUseCity } from '../config/sellerCities.js';
import { findSellerByUsername } from '../config/sellers.js';
import * as ticketModel from '../models/ticketModel.js';
import { generateQrDataUrl } from '../services/qrService.js';
import { isSameSeller } from '../utils/sellerMatch.js';
import { normalizePublicPhoneKey } from '../utils/phoneKey.js';
import { parseAttendanceFromBody } from '../utils/attendance.js';

const PAID_TO_VALUES = ['seller', 'nrna_ncc'];

/**
 * @param {Record<string, unknown>} body
 * @returns {{ paid: boolean, paidTo: string | null } | { error: string }}
 */
function parsePaymentFields(body) {
  const paid = body.paid === true || body.paid === 'true';
  let paidTo = body.paidTo;
  if (paidTo === '' || paidTo === undefined || paidTo === null) paidTo = null;
  if (!paid) {
    paidTo = null;
  } else if (!PAID_TO_VALUES.includes(String(paidTo))) {
    return {
      error: 'When paid is true, paidTo must be "seller" or "nrna_ncc"',
    };
  }
  return { paid, paidTo };
}

const cityValidator = body('city')
  .trim()
  .isIn(ALLOWED_CITIES)
  .withMessage(`city must be one of: ${ALLOWED_CITIES.join(', ')}`);

const attendanceValidators = [
  body('countAdults').optional({ nullable: true }).isInt({ min: 0, max: 99 }),
  body('countStudent').optional({ nullable: true }).isInt({ min: 0, max: 99 }),
  body('countChild').optional({ nullable: true }).isInt({ min: 0, max: 99 }),
  body('ticketCount').optional().isInt({ min: 1, max: 99 }),
  body().custom((_, { req }) => {
    const p = parseAttendanceFromBody(req.body);
    if (p.ticketCount < 1 || p.ticketCount > 99) {
      throw new Error('Total attendance must be 1–99 (adults + student + child).');
    }
    return true;
  }),
];

export const createTicketValidators = [
  body('fullName').trim().notEmpty().withMessage('fullName is required'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 32 })
    .matches(/^[\d+()\-\s]*$/)
    .withMessage('phone has invalid characters'),
  ...attendanceValidators,
  body('ticketType').trim().notEmpty().withMessage('ticketType is required'),
  body('price').isFloat({ min: 0 }).withMessage('price must be a number >= 0'),
  cityValidator,
];

export const updateTicketValidators = [
  param('code').trim().notEmpty().withMessage('code is required'),
  body('fullName').trim().notEmpty().withMessage('fullName is required'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 32 })
    .matches(/^[\d+()\-\s]*$/)
    .withMessage('phone has invalid characters'),
  ...attendanceValidators,
  body('ticketType').trim().notEmpty().withMessage('ticketType is required'),
  body('price').isFloat({ min: 0 }).withMessage('price must be a number >= 0'),
  cityValidator,
];

export async function createTicket(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullName, ticketType, city } = req.body;
  const att = parseAttendanceFromBody(req.body);
  const price = Number.parseFloat(String(req.body.price));
  const cityTrimmed = String(city).trim();
  const isAdmin = req.user.role === 'admin';

  let soldBy = req.user.username;
  if (isAdmin) {
    const rawSoldBy = req.body.soldBy;
    if (rawSoldBy !== undefined && rawSoldBy !== null && String(rawSoldBy).trim() !== '') {
      const attributed = String(rawSoldBy).trim();
      if (!findSellerByUsername(attributed)) {
        return res.status(400).json({
          error: 'soldBy must be a configured seller username (e.g. seller1)',
        });
      }
      if (!sellerMayUseCity(attributed, cityTrimmed)) {
        return res.status(403).json({
          error: 'That seller is not allowed for the selected city',
        });
      }
      soldBy = attributed;
    }
  }

  if (!isAdmin && !sellerMayUseCity(req.user.username, cityTrimmed)) {
    return res.status(403).json({
      error:
        'You are not allowed to assign this city. Use your assigned city only.',
    });
  }

  const payment = parsePaymentFields(req.body);
  if ('error' in payment) {
    return res.status(400).json({ error: payment.error });
  }

  const phoneRaw = req.body.phone;
  const phoneVal =
    phoneRaw !== undefined && phoneRaw !== null && String(phoneRaw).trim() !== ''
      ? String(phoneRaw).trim()
      : null;

  const { id, ticketCode } = await ticketModel.createTicketRow({
    fullName,
    phone: phoneVal,
    countAdults: att.countAdults,
    countStudent: att.countStudent,
    countChild: att.countChild,
    ticketType,
    price,
    soldBy,
    city: cityTrimmed,
    paid: payment.paid,
    paidTo: payment.paidTo,
    submissionSource: 'seller',
  });

  const qrImageBase64 = await generateQrDataUrl(ticketCode);
  await ticketModel.updateTicketQr(id, qrImageBase64);

  const ticket = await ticketModel.findTicketByCode(ticketCode);
  return res.status(201).json({ ticket });
}

export async function listTickets(req, res) {
  const {
    search,
    checkedIn,
    city,
    paid,
    paidTo,
    submissionSource,
    soldBy: soldByQuery,
    scope,
  } = req.query;
  let checkedInFilter;
  if (checkedIn === 'true') checkedInFilter = true;
  else if (checkedIn === 'false') checkedInFilter = false;
  else checkedInFilter = undefined;

  let paidFilter;
  if (paid === 'true') paidFilter = true;
  else if (paid === 'false') paidFilter = false;
  else paidFilter = undefined;

  const paidToTrimmed =
    paidTo && String(paidTo).trim() && PAID_TO_VALUES.includes(String(paidTo).trim())
      ? String(paidTo).trim()
      : undefined;

  let submissionSourceFilter;
  if (submissionSource === 'public' || submissionSource === 'seller') {
    submissionSourceFilter = submissionSource;
  } else {
    submissionSourceFilter = undefined;
  }

  const isAdmin = req.user.role === 'admin';
  let soldByFilter;
  if (isAdmin) {
    if (soldByQuery != null && String(soldByQuery).trim()) {
      soldByFilter = String(soldByQuery).trim();
    }
  } else {
    const scopeStr = scope != null ? String(scope).trim().toLowerCase() : '';
    const listAll =
      scopeStr === 'all' || scopeStr === 'everyone' || scopeStr === 'all_sellers';
    if (!listAll) {
      soldByFilter = String(req.user.username || '').trim() || undefined;
    }
  }

  const tickets = await ticketModel.findAllTickets({
    search,
    checkedIn: checkedInFilter,
    city: city || undefined,
    paid: paidFilter,
    paidTo: paidToTrimmed,
    submissionSource: submissionSourceFilter,
    soldBy: soldByFilter,
  });
  return res.json({ tickets });
}

export const getTicketByCodeValidators = [
  param('code').trim().notEmpty().withMessage('code is required'),
];

export const verifyWebOrderBodyValidators = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('phone is required — enter the same number the customer used on the web order')
    .isLength({ min: 8, max: 32 })
    .withMessage('phone must be 8–32 characters')
    .matches(/^[\d+()\-\s]+$/)
    .withMessage('phone may only contain digits, +, spaces, parentheses, and hyphens'),
];

export async function getTicketByCode(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const code = req.params.code;
  const ticket = await ticketModel.findTicketByCode(code);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  return res.json({ ticket });
}

export async function verifyWebOrder(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const code = req.params.code;
  const ticket = await ticketModel.findTicketByCode(code);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  if (ticket.submissionSource !== 'public') {
    return res.status(400).json({ error: 'Only web orders use this verification step' });
  }
  if (ticket.verifiedAt) {
    return res.status(409).json({ error: 'This order is already verified' });
  }

  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && !isSameSeller(ticket.soldBy, req.user.username)) {
    return res.status(403).json({
      error: 'Only the assigned seller or an admin can verify this web order',
    });
  }

  const orderPhone = ticket.phone != null ? String(ticket.phone).trim() : '';
  if (!orderPhone) {
    return res.status(400).json({
      error: 'This order has no phone number on file; it cannot be verified this way.',
    });
  }

  const submittedKey = normalizePublicPhoneKey(String(req.body.phone).trim());
  const orderKey = normalizePublicPhoneKey(orderPhone);
  if (!submittedKey || !orderKey || submittedKey !== orderKey) {
    return res.status(400).json({
      error:
        'Phone number does not match this order. Enter exactly the same number the customer used on the web form.',
    });
  }

  const verifier = String(req.user.username || '').trim();
  const updated = await ticketModel.verifyWebOrderById(ticket.id, verifier);
  if (!updated) {
    return res.status(409).json({ error: 'Could not verify (order may have been verified already)' });
  }

  const fresh = await ticketModel.findTicketByCode(code);
  return res.json({ ticket: fresh });
}

export async function updateTicket(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const code = req.params.code;
  const ticket = await ticketModel.findTicketByCode(code);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && !isSameSeller(ticket.soldBy, req.user.username)) {
    return res.status(403).json({ error: 'You can only edit tickets you created' });
  }
  if (!isAdmin && ticket.checkedIn) {
    return res.status(409).json({
      error: 'Cannot edit a ticket that has already been checked in',
    });
  }

  const { fullName, ticketType, city } = req.body;
  const att = parseAttendanceFromBody(req.body);
  const price = Number.parseFloat(String(req.body.price));
  const cityTrimmed = String(city).trim();

  if (!isAdmin && !sellerMayUseCity(req.user.username, cityTrimmed)) {
    return res.status(403).json({
      error:
        'You are not allowed to assign this city. Use your assigned city only.',
    });
  }

  const payment = parsePaymentFields(req.body);
  if ('error' in payment) {
    return res.status(400).json({ error: payment.error });
  }

  let soldByUpdate;
  if (isAdmin && req.body.soldBy !== undefined && req.body.soldBy !== null) {
    const attributed = String(req.body.soldBy).trim();
    if (attributed === req.user.username) {
      soldByUpdate = attributed;
    } else if (!findSellerByUsername(attributed)) {
      return res.status(400).json({
        error: 'soldBy must be your admin username or a configured seller (e.g. seller1)',
      });
    } else if (!sellerMayUseCity(attributed, cityTrimmed)) {
      return res.status(403).json({
        error: 'That seller is not allowed for the selected city',
      });
    } else {
      soldByUpdate = attributed;
    }
  }

  const phoneField =
    req.body.phone !== undefined
      ? String(req.body.phone).trim() || null
      : undefined;

  await ticketModel.updateTicketById(ticket.id, {
    fullName,
    ticketCount: att.ticketCount,
    countAdults: att.countAdults,
    countStudent: att.countStudent,
    countChild: att.countChild,
    ticketType,
    price,
    city: String(city).trim(),
    paid: payment.paid,
    paidTo: payment.paidTo,
    soldBy: soldByUpdate,
    phone: phoneField,
  });

  const updated = await ticketModel.findTicketByCode(code);
  return res.json({ ticket: updated });
}

export async function deleteTicket(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const code = req.params.code;
  const ticket = await ticketModel.findTicketByCode(code);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && !isSameSeller(ticket.soldBy, req.user.username)) {
    return res.status(403).json({ error: 'You can only delete tickets you created' });
  }
  if (!isAdmin && ticket.checkedIn) {
    return res.status(409).json({
      error: 'Cannot delete a ticket that has already been checked in',
    });
  }

  await ticketModel.deleteTicketById(ticket.id);
  return res.status(204).send();
}

export const checkInValidators = [
  body('ticketCode').trim().notEmpty().withMessage('ticketCode is required'),
];

/** Snapshot for door scanner UI: name, headcount, amount (SEK in DB). */
function ticketCheckInSnapshot(t) {
  const price = t.price != null ? Number(t.price) : 0;
  return {
    ticketCode: t.ticketCode,
    fullName: t.fullName,
    ticketCount: t.ticketCount,
    countAdults: t.countAdults ?? 0,
    countStudent: t.countStudent ?? 0,
    countChild: t.countChild ?? 0,
    price: Number.isNaN(price) ? 0 : price,
    paid: Boolean(t.paid),
    checkedIn: Boolean(t.checkedIn),
  };
}

export async function checkIn(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const ticketCode = String(req.body.ticketCode).trim();

  const ticket = await ticketModel.findTicketByCode(ticketCode);
  if (!ticket) {
    return res.status(404).json({
      status: 'invalid',
      message: 'Ticket does not exist',
    });
  }

  if (ticket.checkedIn) {
    return res.status(200).json({
      status: 'already_checked_in',
      message: 'This ticket was already used for entry',
      ticket: ticketCheckInSnapshot(ticket),
    });
  }

  if (!ticket.paid) {
    return res.status(200).json({
      status: 'not_paid',
      message:
        'This ticket is not marked as paid. Entry is not allowed until a seller or admin confirms payment in the portal.',
      ticket: ticketCheckInSnapshot(ticket),
    });
  }

  const priceNum = ticket.price != null ? Number(ticket.price) : NaN;
  if (Number.isNaN(priceNum) || priceNum <= 0) {
    return res.status(200).json({
      status: 'not_paid',
      message:
        'This ticket has no valid amount (0 kr or missing). Set the correct price and payment in the portal before entry.',
      ticket: ticketCheckInSnapshot(ticket),
    });
  }

  const updated = await ticketModel.setCheckedInByCode(ticketCode);
  if (!updated) {
    const again = await ticketModel.findTicketByCode(ticketCode);
    return res.status(200).json({
      status: 'already_checked_in',
      message: 'This ticket was already used for entry',
      ticket: ticketCheckInSnapshot(again || ticket),
    });
  }

  const fresh = await ticketModel.findTicketByCode(ticketCode);
  return res.status(200).json({
    status: 'success',
    message: 'Entry granted',
    ticket: ticketCheckInSnapshot(fresh),
  });
}
