import { Router } from 'express';
import { loginTechnician } from '../controllers/auth.controller';

const router = Router();

router.post('/technician-login', loginTechnician);

export default router;
