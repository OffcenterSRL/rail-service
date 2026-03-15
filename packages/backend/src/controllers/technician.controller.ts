import { Request, Response } from 'express';
import { getTechnicianList } from '../data/mock-data';

export const listTechnicians = (_: Request, res: Response) => {
  const technicians = getTechnicianList();
  return res.json({ data: technicians });
};
