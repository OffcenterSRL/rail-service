import { Router } from 'express';
import { listTickets, createTicket, cancelTicket } from '../controllers/ticket.controller';

const router = Router();

router.get('/', listTickets);
router.post('/', createTicket);
router.patch('/:id/cancel', cancelTicket);

export default router;
