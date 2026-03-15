import { Request, Response } from 'express';
import { Ticket } from '../models/ticket.model';
import { buildDashboardSummary } from '../data/mock-data';

export const getDashboardSummary = async (_: Request, res: Response) => {
  try {
    const tickets = await Ticket.find().lean();
    const summary = buildDashboardSummary(tickets);
    return res.json({ data: summary });
  } catch (error) {
    console.warn('⚠️ Unable to build dashboard from MongoDB:', (error as Error).message);
    return res.status(500).json({ error: 'Impossibile costruire la dashboard' });
  }
};
