import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createPublicTicketRequest,
  getPublicSellers,
  publicTicketRequestValidators,
} from '../controllers/publicController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const ticketRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many ticket requests from this address. Try again later.' },
});

router.get('/sellers', asyncHandler(getPublicSellers));
router.post(
  '/ticket-requests',
  ticketRequestLimiter,
  publicTicketRequestValidators,
  asyncHandler(createPublicTicketRequest)
);

export default router;
