import { body, validationResult } from 'express-validator';
import { ALLOWED_CITIES } from '../config/cities.js';
import { sellerMayUseCity } from '../config/sellerCities.js';
import {
  findSellerByUsername,
  listSellerUsernames,
} from '../config/sellers.js';
import {
  getAllowedCitiesForSeller,
  getSellerDisplayParts,
} from '../config/sellerCities.js';
import * as ticketModel from '../models/ticketModel.js';
import { generateQrDataUrl } from '../services/qrService.js';
import { parseAttendanceFromBody } from '../utils/attendance.js';

const PAID_TO_VALUES = ['seller', 'nrna_ncc'];
const PUBLIC_TICKET_TYPE = 'Web order';

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

export const publicTicketRequestValidators = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('fullName is required')
    .isLength({ max: 255 })
    .withMessage('fullName is too long'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('phone is required')
    .isLength({ min: 8, max: 32 })
    .withMessage('phone must be 8–32 characters')
    .matches(/^[\d+()\-\s]+$/)
    .withMessage('phone may only contain digits, +, spaces, parentheses, and hyphens'),
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
  body('soldBy')
    .trim()
    .notEmpty()
    .withMessage('soldBy (seller to verify) is required'),
  body('city')
    .trim()
    .isIn(ALLOWED_CITIES)
    .withMessage(`city must be one of: ${ALLOWED_CITIES.join(', ')}`),
  body('paid')
    .isBoolean()
    .withMessage('paid is required (true if you have paid, false if not yet)'),
  body('phoneContactConsent')
    .custom((v) => v === true)
    .withMessage(
      'You must agree that committee members of this program may contact you using the phone number you provided.'
    ),
];

export async function getPublicSellers(req, res) {
  const usernames = listSellerUsernames();
  const sellers = usernames.map((username) => ({
    username,
    allowedCities: getAllowedCitiesForSeller(username),
    displayParts: getSellerDisplayParts(username),
  }));
  return res.json({ sellers });
}

export async function createPublicTicketRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const soldBy = String(req.body.soldBy).trim();
  if (!findSellerByUsername(soldBy)) {
    return res.status(400).json({ error: 'Unknown seller account' });
  }

  const cityTrimmed = String(req.body.city).trim();
  if (!sellerMayUseCity(soldBy, cityTrimmed)) {
    return res.status(400).json({
      error: 'That seller is not assigned to the selected city. Choose another seller or city.',
    });
  }

  const payment = parsePaymentFields(req.body);
  if ('error' in payment) {
    return res.status(400).json({ error: payment.error });
  }

  const fullName = String(req.body.fullName).trim();
  const phone = String(req.body.phone).trim();
  const att = parseAttendanceFromBody(req.body);

  const { id, ticketCode } = await ticketModel.createTicketRow({
    fullName,
    phone,
    phoneContactConsent: true,
    countAdults: att.countAdults,
    countStudent: att.countStudent,
    countChild: att.countChild,
    ticketType: PUBLIC_TICKET_TYPE,
    price: 0,
    soldBy,
    city: cityTrimmed,
    paid: payment.paid,
    paidTo: payment.paidTo,
    submissionSource: 'public',
  });

  const qrImageBase64 = await generateQrDataUrl(ticketCode);
  await ticketModel.updateTicketQr(id, qrImageBase64);

  const ticket = await ticketModel.findTicketByCode(ticketCode);
  return res.status(201).json({
    message:
      'Thank you. Your request was registered. The seller you chose or an admin must verify the order in the portal before it is treated as confirmed.',
    ticketCode,
    ticket,
  });
}
