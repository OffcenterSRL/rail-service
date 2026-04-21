import { Router } from 'express';
import {
  listTickets,
  getTicket,
  createTicket,
  cancelTicket,
  completeTicket,
  addTask,
  updateTask,
  deleteTask,
} from '../controllers/ticket.controller';

const router = Router();

router.get('/', listTickets);
router.post('/', createTicket);
router.get('/:id', getTicket);
router.patch('/:id/cancel', cancelTicket);
router.patch('/:id/complete', completeTicket);
router.post('/:id/tasks', addTask);
router.put('/:id/tasks/:taskId', updateTask);
router.delete('/:id/tasks/:taskId', deleteTask);

export default router;
