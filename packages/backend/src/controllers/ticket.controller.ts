import { Request, Response } from 'express';
import { Ticket } from '../models/ticket.model';

export const listTickets = async (_: Request, res: Response) => {
  try {
    const tickets = await Ticket.find({ status: { $ne: 'cancelled' } })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ data: tickets });
  } catch (error) {
    console.warn('⚠️ Unable to fetch tickets from MongoDB:', (error as Error).message);
    return res.status(500).json({ error: 'Impossibile recuperare gli ordini' });
  }
};

export const getTicket = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const ticket = await Ticket.findById(id).lean();
    if (!ticket) return res.status(404).json({ error: 'Ordine non trovato' });
    return res.json({ data: ticket });
  } catch (error) {
    console.warn('⚠️ Unable to fetch ticket:', (error as Error).message);
    return res.status(500).json({ error: "Impossibile recuperare l'ordine" });
  }
};

export const createTicket = async (req: Request, res: Response) => {
  const { trainNumber, shift, codiceODL, openedAt, assignedTechnician } = req.body;
  try {
    const ticket = await Ticket.create({
      trainNumber: trainNumber ?? 'N/D',
      shift: shift ?? 'Turno in corso',
      codiceODL: codiceODL ? `ODL-${codiceODL}` : 'ODL-N/D',
      status: 'active',
      tasks: [],
      openedAt: openedAt ? new Date(openedAt) : undefined,
      assignedTechnician,
    });
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
    if (!ticket) return res.status(404).json({ error: 'Ordine non trovato' });
    return res.json({ data: ticket });
  } catch (error) {
    console.warn('⚠️ Impossibile annullare il ticket:', (error as Error).message);
    return res.status(500).json({ error: 'Cancellazione ordine fallita' });
  }
};

export const addTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    description,
    priority,
    preventiveType,
    assignedTechnicianId,
    assignedTechnicianName,
    assignedTechnicianNickname,
    deferredKey,
    deferredSince,
    deferredCount,
  } = req.body;
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      id,
      {
        $push: {
          tasks: {
            description,
            priority,
            preventiveType,
            assignedTechnicianId,
            assignedTechnicianName: assignedTechnicianName ?? '',
            assignedTechnicianNickname: assignedTechnicianNickname ?? '',
            status: 'aperta',
            deferredKey,
            deferredSince,
            deferredCount,
          },
        },
      },
      { new: true },
    ).lean();
    if (!ticket) return res.status(404).json({ error: 'Ordine non trovato' });
    return res.status(201).json({ data: ticket });
  } catch (error) {
    console.warn('⚠️ Aggiunta task fallita:', (error as Error).message);
    return res.status(500).json({ error: 'Aggiunta task fallita' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  const { id, taskId } = req.params;
  const updates = req.body as Record<string, unknown>;
  try {
    const allowedFields = [
      'description', 'priority', 'preventiveType', 'assignedTechnicianId',
      'assignedTechnicianName', 'assignedTechnicianNickname', 'status',
      'timeSpentMinutes', 'performedBy', 'deferredKey', 'deferredSince', 'deferredCount',
    ];
    const setFields: Record<string, unknown> = {};
    allowedFields.forEach((field) => {
      if (field in updates) {
        setFields[`tasks.$.${field}`] = updates[field];
      }
    });
    const ticket = await Ticket.findOneAndUpdate(
      { _id: id, 'tasks._id': taskId },
      { $set: setFields },
      { new: true },
    ).lean();
    if (!ticket) return res.status(404).json({ error: 'Task non trovata' });
    return res.json({ data: ticket });
  } catch (error) {
    console.warn('⚠️ Aggiornamento task fallito:', (error as Error).message);
    return res.status(500).json({ error: 'Aggiornamento task fallito' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  const { id, taskId } = req.params;
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { $pull: { tasks: { _id: taskId } } },
      { new: true },
    ).lean();
    if (!ticket) return res.status(404).json({ error: 'Ordine non trovato' });
    return res.json({ data: ticket });
  } catch (error) {
    console.warn('⚠️ Eliminazione task fallita:', (error as Error).message);
    return res.status(500).json({ error: 'Eliminazione task fallita' });
  }
};
