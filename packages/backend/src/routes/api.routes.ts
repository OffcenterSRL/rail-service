import { Router } from 'express';
import ticketsRoutes from './tickets.routes';
import dashboardRoutes from './dashboard.routes';
import authRoutes from './auth.routes';

const router = Router();

router.use('/tickets', ticketsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/auth', authRoutes);

export default router;
