import { Router } from 'express';
import ticketsRoutes from './tickets.routes';
import dashboardRoutes from './dashboard.routes';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import technicianRoutes from './technician.routes';

const router = Router();

router.use('/tickets', ticketsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/technicians', technicianRoutes);

export default router;
