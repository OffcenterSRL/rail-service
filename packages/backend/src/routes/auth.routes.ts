import { Router } from 'express';
import { loginCapoturno, loginTechnician } from '../controllers/auth.controller';

const router = Router();

router.post('/technician-login', loginTechnician);
router.post('/capoturno-login', loginCapoturno);

export default router;
