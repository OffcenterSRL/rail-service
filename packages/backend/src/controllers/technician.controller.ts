import { Request, Response } from 'express';
import { Technician } from '../models/technician.model';

export const listTechnicians = async (_: Request, res: Response) => {
  try {
    const technicians = await Technician.find().lean();
    return res.json({ data: technicians });
  } catch (error) {
    console.warn('⚠️ Unable to fetch technicians:', (error as Error).message);
    return res.status(500).json({ error: 'Impossibile recuperare i tecnici' });
  }
};
