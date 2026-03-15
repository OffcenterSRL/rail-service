import { Request, Response } from 'express';
import { Ticket } from '../models/ticket.model';
import { buildDashboardSummary, fallbackTickets } from '../data/mock-data';

export const getDashboardSummary = async (_: Request, res: Response) => {
  try {
    const tickets = await Ticket.find().lean();
    const summary = buildDashboardSummary(tickets);
    return res.json({ data: summary });
  } catch (error) {
    console.warn('⚠️ Unable to build dashboard from MongoDB, falling back to static stats');
    const summary = buildDashboardSummary(fallbackTickets);
    return res.json({ data: summary });
  }
};
