import { Router } from 'express';
import {
  createCapoturno,
  createTechnician,
  deleteCapoturno,
  deleteTechnician,
  getCapoturni,
  getTechnicians,
  updateCapoturno,
  updateCapoturni,
  updateTechnician,
  updateTechnicians,
} from '../controllers/admin.controller';

const router = Router();

router.get('/technicians', getTechnicians);
router.post('/technicians', createTechnician);
router.put('/technicians', updateTechnicians);
router.put('/technicians/:id', updateTechnician);
router.delete('/technicians/:id', deleteTechnician);

router.get('/capoturni', getCapoturni);
router.post('/capoturni', createCapoturno);
router.put('/capoturni', updateCapoturni);
router.put('/capoturni/:id', updateCapoturno);
router.delete('/capoturni/:id', deleteCapoturno);

export default router;
