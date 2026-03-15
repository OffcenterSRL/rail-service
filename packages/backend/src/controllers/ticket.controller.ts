import { Request, Response } from 'express';
import { Ticket } from '../models/ticket.model';
import { TicketRecord } from '../data/mock-data';

const buildPayload = (body: Partial<TicketRecord>): Partial<TicketRecord> => ({
  userId: body.userId ?? `user-${Math.floor(Math.random() * 9000)}`,
  trainId: body.trainId ?? 'ETR700-12',
  departureStation: body.departureStation ?? 'Roma Tiburtina',
  arrivalStation: body.arrivalStation ?? 'Milano Centrale',
  departureTime:
    body.departureTime ??
    new Date(new Date().getTime() + 1 * 60 * 60 * 1000).toISOString(),
  arrivalTime:
    body.arrivalTime ??
    new Date(new Date().getTime() + 3 * 60 * 60 * 1000).toISOString(),
  seatNumber: body.seatNumber ?? '00A',
  price: body.price ?? 0,
});

export const listTickets = async (_: Request, res: Response) => {
  try {
    const tickets = await Ticket.find().sort({ departureTime: -1 }).lean();
    return res.json({ data: tickets });
  } catch (error) {
    console.warn('⚠️ Unable to fetch tickets from MongoDB:', (error as Error).message);
    return res.status(500).json({ error: 'Impossibile recuperare gli ordini' });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  const payload = buildPayload(req.body);

  try {
    const ticket = await Ticket.create({ ...payload, status: 'active' });
    return res.status(201).json({ data: ticket });
  } catch (error) {
    console.warn('⚠️ Impossibile creare un ordine:', (error as Error).message);
    return res.status(500).json({ error: 'Creazione ordine fallita' });
  }
};

export const cancelTicket = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const ticket = await Ticket.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true }).lean();
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket non trovato' });
    }
    return res.json({ data: ticket });
  } catch (error) {
    console.warn('⚠️ Impossibile annullare il ticket:', (error as Error).message);
    return res.status(500).json({ error: 'Cancellazione ordine fallita' });
  }
};
