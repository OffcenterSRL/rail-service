import { Router } from 'express';
import {
  createTechnician,
  deleteTechnician,
  getTechnicians,
  updateTechnician,
  updateTechnicians,
} from '../controllers/admin.controller';

const router = Router();

router.get('/technicians', getTechnicians);
router.post('/technicians', createTechnician);
router.put('/technicians', updateTechnicians);
router.put('/technicians/:id', updateTechnician);
router.delete('/technicians/:id', deleteTechnician);

export default router;
