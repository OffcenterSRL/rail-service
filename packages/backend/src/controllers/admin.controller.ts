import { Request, Response } from 'express';
import { Technician, Capoturno } from '../models/technician.model';

const ADMIN_PASSWORD = process.env.ADMIN_ACCESS_PASSWORD || 'rail-admin';

const verifyPassword = (req: Request): boolean => {
  const provided = req.headers['x-admin-password'];
  return !!provided && !Array.isArray(provided) && provided === ADMIN_PASSWORD;
};

// ── Technicians ────────────────────────────────────────────────────────────────

export const getTechnicians = async (req: Request, res: Response) => {
  if (!verifyPassword(req)) return res.status(401).json({ error: 'Password amministratore mancante o errata' });
  try {
    const list = await Technician.find().lean();
    return res.json({ data: list });
  } catch (error) {
    return res.status(500).json({ error: 'Impossibile recuperare i tecnici' });
  }
};

export const createTechnician = async (req: Request, res: Response) => {
  if (!verifyPassword(req)) return res.status(401).json({ error: 'Password amministratore mancante o errata' });
  const { name, nickname, matricola, team } = req.body as Record<string, string>;
  if (!name?.trim() || !matricola?.trim() || !team?.trim()) {
    return res.status(400).json({ error: 'Payload non valido' });
  }
  try {
    const created = await Technician.create({
      name: name.trim(),
      nickname: nickname?.trim() || name.trim(),
      matricola: matricola.trim(),
      team: team.trim(),
    });
    return res.status(201).json({ data: created });
  } catch (error) {
    return res.status(500).json({ error: 'Creazione tecnico fallita' });
  }
};

export const updateTechnicians = async (req: Request, res: Response) => {
  if (!verifyPassword(req)) return res.status(401).json({ error: 'Password amministratore mancante o errata' });
  const payload = req.body?.technicians;
  if (!Array.isArray(payload)) return res.status(400).json({ error: 'Payload non valido' });
  try {
    await Technician.deleteMany({});
    const docs = payload
      .filter((item) => item?.name?.trim() && item?.matricola?.trim() && item?.team?.trim())
      .map((item) => ({
        name: item.name.trim(),
        nickname: item.nickname?.trim() || item.name.trim(),
        matricola: item.matricola.trim(),
        team: item.team.trim(),
      }));
    await Technician.insertMany(docs);
    const list = await Technician.find().lean();
    return res.json({ data: list });
  } catch (error) {
    return res.status(500).json({ error: 'Aggiornamento tecnici fallito' });
  }
};

export const updateTechnician = async (req: Request, res: Response) => {
  if (!verifyPassword(req)) return res.status(401).json({ error: 'Password amministratore mancante o errata' });
  const { id } = req.params;
  const { name, nickname, matricola, team } = req.body as Record<string, string>;
  if (!name?.trim() || !matricola?.trim() || !team?.trim()) {
    return res.status(400).json({ error: 'Payload non valido' });
  }
  try {
    const updated = await Technician.findByIdAndUpdate(
      id,
      { name: name.trim(), nickname: nickname?.trim() || name.trim(), matricola: matricola.trim(), team: team.trim() },
      { new: true },
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Tecnico non trovato' });
    return res.json({ data: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Aggiornamento tecnico fallito' });
  }
};

export const deleteTechnician = async (req: Request, res: Response) => {
  if (!verifyPassword(req)) return res.status(401).json({ error: 'Password amministratore mancante o errata' });
  const { id } = req.params;
  try {
    const deleted = await Technician.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ error: 'Tecnico non trovato' });
    const list = await Technician.find().lean();
    return res.json({ data: list });
  } catch (error) {
    return res.status(500).json({ error: 'Eliminazione tecnico fallita' });
  }
};

// ── Capoturni ─────────────────────────────────────────────────────────────────

export const getCapoturni = async (req: Request, res: Response) => {
  if (!verifyPassword(req)) return res.status(401).json({ error: 'Password amministratore mancante o errata' });
  try {
    const list = await Capoturno.find().lean();
    return res.json({ data: list });
  } catch (error) {
    return res.status(500).json({ error: 'Impossibile recuperare i capoturni' });
  }
};

export const createCapoturno = async (req: Request, res: Response) => {
  if (!verifyPassword(req)) return res.status(401).json({ error: 'Password amministratore mancante o errata' });
  const { name, nickname, matricola, role } = req.body as Record<string, string>;
  if (!name?.trim() || !matricola?.trim()) {
    return res.status(400).json({ error: 'Payload non valido' });
  }
  try {
    const created = await Capoturno.create({
      name: name.trim(),
      nickname: nickname?.trim() || name.trim(),
      matricola: matricola.trim(),
      role: role === 'admin' ? 'admin' : 'capoturno',
    });
    return res.status(201).json({ data: created });
  } catch (error) {
    return res.status(500).json({ error: 'Creazione capoturno fallita' });
  }
};

export const updateCapoturni = async (req: Request, res: Response) => {
  if (!verifyPassword(req)) return res.status(401).json({ error: 'Password amministratore mancante o errata' });
  const payload = req.body?.capoturni;
  if (!Array.isArray(payload)) return res.status(400).json({ error: 'Payload non valido' });
  try {
    await Capoturno.deleteMany({});
    const docs = payload
      .filter((item) => item?.name?.trim() && item?.matricola?.trim())
      .map((item) => ({
        name: item.name.trim(),
        nickname: item.nickname?.trim() || item.name.trim(),
        matricola: item.matricola.trim(),
      }));
    await Capoturno.insertMany(docs);
    const list = await Capoturno.find().lean();
    return res.json({ data: list });
  } catch (error) {
    return res.status(500).json({ error: 'Aggiornamento capoturni fallito' });
  }
};

export const updateCapoturno = async (req: Request, res: Response) => {
  if (!verifyPassword(req)) return res.status(401).json({ error: 'Password amministratore mancante o errata' });
  const { id } = req.params;
  const { name, nickname, matricola, role } = req.body as Record<string, string>;
  if (!name?.trim() || !matricola?.trim()) {
    return res.status(400).json({ error: 'Payload non valido' });
  }
  try {
    const updated = await Capoturno.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        nickname: nickname?.trim() || name.trim(),
        matricola: matricola.trim(),
        role: role === 'admin' ? 'admin' : 'capoturno',
      },
      { new: true },
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Capoturno non trovato' });
    return res.json({ data: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Aggiornamento capoturno fallito' });
  }
};

export const deleteCapoturno = async (req: Request, res: Response) => {
  if (!verifyPassword(req)) return res.status(401).json({ error: 'Password amministratore mancante o errata' });
  const { id } = req.params;
  try {
    const deleted = await Capoturno.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ error: 'Capoturno non trovato' });
    const list = await Capoturno.find().lean();
    return res.json({ data: list });
  } catch (error) {
    return res.status(500).json({ error: 'Eliminazione capoturno fallita' });
  }
};
