import { Router } from 'express';
import { listTechnicians } from '../controllers/technician.controller';

const router = Router();

router.get('/', listTechnicians);

export default router;
