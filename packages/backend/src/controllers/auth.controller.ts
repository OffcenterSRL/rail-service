import { Request, Response } from 'express';
import { getTechnicianList } from '../data/mock-data';

export const loginTechnician = (req: Request, res: Response) => {
  const { nickname, matricola } = req.body as {
    nickname?: string;
    matricola?: string;
  };

  if (!nickname || !matricola) {
    return res.status(400).json({ error: 'Nickname e matricola sono obbligatori.' });
  }

  const normalizedMatricola = matricola.toUpperCase();
  const metadata = getTechnicianList().find(
    (tech) =>
      tech.matricola.toUpperCase() === normalizedMatricola &&
      tech.nickname.toLowerCase() === nickname.toLowerCase(),
  );

  if (!metadata) {
    return res.status(401).json({ error: 'Tecnico non trovato o non autorizzato.' });
  }

  return res.json({
    data: {
      name: metadata.name,
      nickname: metadata.nickname,
      matricola: metadata.matricola,
      team: metadata.team,
      message: `Tecnico ${metadata.nickname ?? metadata.name} autenticato.`,
    },
  });
};
