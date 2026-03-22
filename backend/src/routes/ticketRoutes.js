import { Router } from 'express';
import {
  checkIn,
  checkInValidators,
  createTicket,
  createTicketValidators,
  deleteTicket,
  getTicketByCode,
  getTicketByCodeValidators,
  listTickets,
  updateTicket,
  updateTicketValidators,
  verifyWebOrder,
  verifyWebOrderBodyValidators,
} from '../controllers/ticketController.js';
import {
  requireAuth,
  requireSellerOrAdmin,
  requireScanner,
} from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post(
  '/checkin',
  requireAuth,
  requireScanner,
  checkInValidators,
  asyncHandler(checkIn)
);

router.use(requireAuth);
router.use(requireSellerOrAdmin);

router.get('/', asyncHandler(listTickets));
router.post('/', createTicketValidators, asyncHandler(createTicket));
router.post(
  '/:code/verify',
  getTicketByCodeValidators,
  verifyWebOrderBodyValidators,
  asyncHandler(verifyWebOrder)
);
router.put('/:code', updateTicketValidators, asyncHandler(updateTicket));
router.delete('/:code', getTicketByCodeValidators, asyncHandler(deleteTicket));
router.get('/:code', getTicketByCodeValidators, asyncHandler(getTicketByCode));

export default router;
