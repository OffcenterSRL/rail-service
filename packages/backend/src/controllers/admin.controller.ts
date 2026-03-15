import { Request, Response } from 'express';
import {
  TechnicianPayload,
  TechnicianRecord,
  createTechnicianRecord,
  deleteTechnicianRecord,
  getTechnicianList,
  prepareTechnicianRecord,
  setTechnicianList,
  updateTechnicianRecord,
} from '../data/mock-data';

const ADMIN_PASSWORD = process.env.ADMIN_ACCESS_PASSWORD || 'rail-admin';

const verifyPassword = (req: Request): boolean => {
  const provided = req.headers['x-admin-password'];
  if (!provided || Array.isArray(provided)) {
    return false;
  }
  return provided === ADMIN_PASSWORD;
};

export const getTechnicians = (req: Request, res: Response) => {
  if (!verifyPassword(req)) {
    return res.status(401).json({ error: 'Password amministratore mancante o errata' });
  }
  return res.json({ data: getTechnicianList() });
};

export const updateTechnicians = (req: Request, res: Response) => {
  if (!verifyPassword(req)) {
    return res.status(401).json({ error: 'Password amministratore mancante o errata' });
  }

  const payload = req.body?.technicians;
  if (!Array.isArray(payload)) {
    return res.status(400).json({ error: 'Payload non valido' });
  }

  const sanitized: TechnicianRecord[] = payload
    .map((item): TechnicianPayload | null => {
      if (!item || typeof item !== 'object') return null;
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      const nickname = typeof item.nickname === 'string' ? item.nickname.trim() : '';
      const matricola = typeof item.matricola === 'string' ? item.matricola.trim() : '';
      const team = typeof item.team === 'string' ? item.team.trim() : '';
      const id = typeof item.id === 'string' ? item.id.trim() : undefined;
      if (!name || !matricola || !team) {
        return null;
      }
      return { id, name, nickname: nickname || undefined, matricola, team };
    })
    .map((item): TechnicianRecord | null => {
      if (!item) return null;
      return prepareTechnicianRecord(item, item.id);
    })
    .filter((item): item is TechnicianRecord => !!item);

  setTechnicianList(sanitized);
  return res.json({ data: getTechnicianList() });
};

const sanitizePayload = (body: unknown): TechnicianPayload | null => {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const data = body as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const nickname = typeof data.nickname === 'string' ? data.nickname.trim() : '';
  const matricola = typeof data.matricola === 'string' ? data.matricola.trim() : '';
  const team = typeof data.team === 'string' ? data.team.trim() : '';
  const id = typeof data.id === 'string' ? data.id.trim() : undefined;
  if (!name || !matricola || !team) {
    return null;
  }
  return { id, name, nickname: nickname || undefined, matricola, team };
};

export const createTechnician = (req: Request, res: Response) => {
  if (!verifyPassword(req)) {
    return res.status(401).json({ error: 'Password amministratore mancante o errata' });
  }
  const payload = sanitizePayload(req.body);
  if (!payload) {
    return res.status(400).json({ error: 'Payload non valido' });
  }

  const created = createTechnicianRecord(payload);
  if (!created) {
    return res.status(400).json({ error: 'Dati tecnico incompleti' });
  }

  return res.status(201).json({ data: created });
};

export const updateTechnician = (req: Request, res: Response) => {
  if (!verifyPassword(req)) {
    return res.status(401).json({ error: 'Password amministratore mancante o errata' });
  }
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'ID tecnico mancante' });
  }

  const payload = sanitizePayload(req.body);
  if (!payload) {
    return res.status(400).json({ error: 'Payload non valido' });
  }

  const updated = updateTechnicianRecord(id, payload);
  if (!updated) {
    return res.status(404).json({ error: 'Tecnico non trovato' });
  }

  return res.json({ data: updated });
};

export const deleteTechnician = (req: Request, res: Response) => {
  if (!verifyPassword(req)) {
    return res.status(401).json({ error: 'Password amministratore mancante o errata' });
  }
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'ID tecnico mancante' });
  }

  const deleted = deleteTechnicianRecord(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Tecnico non trovato' });
  }

  return res.json({ data: getTechnicianList() });
};
