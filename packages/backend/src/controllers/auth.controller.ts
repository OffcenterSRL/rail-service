import { Request, Response } from 'express';
import { Technician, Capoturno } from '../models/technician.model';

export const loginTechnician = async (req: Request, res: Response) => {
  const { nickname, matricola } = req.body as { nickname?: string; matricola?: string };
  if (!nickname || !matricola) {
    return res.status(400).json({ error: 'Nickname e matricola sono obbligatori.' });
  }
  try {
    const tech = await Technician.findOne({
      matricola: { $regex: new RegExp(`^${matricola.trim()}$`, 'i') },
      nickname: { $regex: new RegExp(`^${nickname.trim()}$`, 'i') },
    }).lean();
    if (!tech) {
      return res.status(401).json({ error: 'Tecnico non trovato o non autorizzato.' });
    }
    return res.json({
      data: {
        name: tech.name,
        nickname: tech.nickname,
        matricola: tech.matricola,
        team: tech.team,
        message: `Tecnico ${tech.nickname} autenticato.`,
      },
    });
  } catch (error) {
    console.warn('⚠️ Login tecnico fallito:', (error as Error).message);
    return res.status(500).json({ error: 'Errore durante il login.' });
  }
};

export const loginCapoturno = async (req: Request, res: Response) => {
  const { nickname, matricola } = req.body as { nickname?: string; matricola?: string };
  if (!nickname || !matricola) {
    return res.status(400).json({ error: 'Nickname e matricola sono obbligatori.' });
  }
  try {
    const capo = await Capoturno.findOne({
      matricola: { $regex: new RegExp(`^${matricola.trim()}$`, 'i') },
      nickname: { $regex: new RegExp(`^${nickname.trim()}$`, 'i') },
    }).lean();
    if (!capo) {
      return res.status(401).json({ error: 'Capoturno non trovato o non autorizzato.' });
    }
    return res.json({
      data: {
        name: capo.name,
        nickname: capo.nickname,
        matricola: capo.matricola,
        message: `Capoturno ${capo.nickname} autenticato.`,
      },
    });
  } catch (error) {
    console.warn('⚠️ Login capoturno fallito:', (error as Error).message);
    return res.status(500).json({ error: 'Errore durante il login.' });
  }
};
