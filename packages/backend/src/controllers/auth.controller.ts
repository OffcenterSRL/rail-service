import { Request, Response } from 'express';
import { fallbackTechnicians } from '../data/mock-data';

export const loginTechnician = (req: Request, res: Response) => {
  const { code, name, matricola } = req.body as {
    code?: string;
    name?: string;
    matricola?: string;
  };

  if (!code || !name || !matricola) {
    return res.status(400).json({ error: 'Compila tutti i campi richiesti.' });
  }

  const normalizedCode = code.toUpperCase();
  const metadata = fallbackTechnicians[normalizedCode];

  if (!metadata) {
    return res.status(401).json({ error: 'Codice tecnico non trovato o non autorizzato.' });
  }

  return res.json({
    data: {
      code: normalizedCode,
      name,
      matricola,
      shift: metadata.shift,
      team: metadata.team,
      message: `Tecnico ${name} autenticato per il turno ${metadata.shift}.`,
    },
  });
};
