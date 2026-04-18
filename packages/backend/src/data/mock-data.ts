export type TicketStatus = 'active' | 'used' | 'cancelled';

export interface TicketRecord {
  _id: string;
  userId: string;
  trainId: string;
  departureStation: string;
  arrivalStation: string;
  departureTime: string;
  arrivalTime: string;
  seatNumber: string;
  price: number;
  status: TicketStatus;
  bookingDate: string;
}

export interface DashboardSummary {
  interventions: number;
  techniciansOnline: number;
  shiftsCompleted: number;
  activeTickets: number;
  cancelledTickets: number;
  lastUpdated: string;
}

export interface TechnicianRecord {
  id: string;
  name: string;
  nickname: string;
  matricola: string;
  team: string;
}

export interface TechnicianPayload {
  id?: string;
  name: string;
  nickname?: string;
  matricola: string;
  team: string;
}

export interface CapoturnoRecord {
  id: string;
  name: string;
  nickname: string;
  matricola: string;
}

export interface CapoturnoPayload {
  id?: string;
  name: string;
  nickname?: string;
  matricola: string;
}

let technicianRegistry: Record<string, TechnicianRecord> = {
  'tech-1': {
    id: 'tech-1',
    name: 'Carlo Marin',
    nickname: 'Carlo',
    matricola: 'C-1001',
    team: 'Squadra Nord',
  },
  'tech-2': {
    id: 'tech-2',
    name: 'Luisa Ferri',
    nickname: 'Lu',
    matricola: 'L-1002',
    team: 'Squadra Centrale',
  },
  'tech-3': {
    id: 'tech-3',
    name: 'Marco Rinaldi',
    nickname: 'Marco',
    matricola: 'M-1003',
    team: 'Squadra Sud',
  },
};

let capoturnoRegistry: Record<string, CapoturnoRecord> = {
  'capo-1': {
    id: 'capo-1',
    name: 'Giulia Riva',
    nickname: 'Giulia',
    matricola: 'C-2001',
  },
  'capo-2': {
    id: 'capo-2',
    name: 'Luca Bassi',
    nickname: 'Luca',
    matricola: 'C-2002',
  },
};

const normalizeId = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 12);
};

export const getTechnicianList = (): TechnicianRecord[] => Object.values(technicianRegistry);

export const getCapoturnoList = (): CapoturnoRecord[] => Object.values(capoturnoRegistry);

export const setTechnicianList = (list: TechnicianRecord[]): void => {
  technicianRegistry = {};
  list.forEach((tech) => {
    const record = prepareTechnicianRecord(tech, tech.id);
    if (record) {
      technicianRegistry[record.id] = record;
    }
  });
};

export const setCapoturnoList = (list: CapoturnoRecord[]): void => {
  capoturnoRegistry = {};
  list.forEach((capo) => {
    const record = prepareCapoturnoRecord(capo, capo.id);
    if (record) {
      capoturnoRegistry[record.id] = record;
    }
  });
};

export const prepareTechnicianRecord = (payload: TechnicianPayload, idOverride?: string): TechnicianRecord | null => {
  const trimmedName = payload.name?.trim();
  const trimmedMatricola = payload.matricola?.trim();
  const team = payload.team?.trim() ?? '';
  if (!trimmedName || !trimmedMatricola || !team) {
    return null;
  }
  const normalized = normalizeId(trimmedName);
  const fallbackId = normalized || `tech-${Date.now()}`;
  const id = idOverride ?? payload.id ?? fallbackId;
  return {
    id,
    name: trimmedName,
    nickname: payload.nickname?.trim() || trimmedName,
    matricola: trimmedMatricola,
    team,
  };
};

export const prepareCapoturnoRecord = (payload: CapoturnoPayload, idOverride?: string): CapoturnoRecord | null => {
  const trimmedName = payload.name?.trim();
  const trimmedMatricola = payload.matricola?.trim();
  if (!trimmedName || !trimmedMatricola) {
    return null;
  }
  const normalized = normalizeId(trimmedName);
  const fallbackId = normalized || `capo-${Date.now()}`;
  const id = idOverride ?? payload.id ?? fallbackId;
  return {
    id,
    name: trimmedName,
    nickname: payload.nickname?.trim() || trimmedName,
    matricola: trimmedMatricola,
  };
};

export const createTechnicianRecord = (payload: TechnicianPayload): TechnicianRecord | null => {
const record = prepareTechnicianRecord(payload);
  if (!record) {
    return null;
  }
  technicianRegistry[record.id] = record;
  return record;
};

export const createCapoturnoRecord = (payload: CapoturnoPayload): CapoturnoRecord | null => {
  const record = prepareCapoturnoRecord(payload);
  if (!record) {
    return null;
  }
  capoturnoRegistry[record.id] = record;
  return record;
};

export const updateTechnicianRecord = (id: string, payload: TechnicianPayload): TechnicianRecord | null => {
  if (!technicianRegistry[id]) {
    return null;
  }
  const record = prepareTechnicianRecord(payload, id);
  if (!record) {
    return null;
  }
  technicianRegistry[id] = record;
  return record;
};

export const updateCapoturnoRecord = (id: string, payload: CapoturnoPayload): CapoturnoRecord | null => {
  if (!capoturnoRegistry[id]) {
    return null;
  }
  const record = prepareCapoturnoRecord(payload, id);
  if (!record) {
    return null;
  }
  capoturnoRegistry[id] = record;
  return record;
};

export const deleteTechnicianRecord = (id: string): TechnicianRecord | null => {
  const record = technicianRegistry[id];
  if (!record) {
    return null;
  }
  delete technicianRegistry[id];
  return record;
};

export const deleteCapoturnoRecord = (id: string): CapoturnoRecord | null => {
  const record = capoturnoRegistry[id];
  if (!record) {
    return null;
  }
  delete capoturnoRegistry[id];
  return record;
};

export const buildDashboardSummary = (tickets: Array<{ status: string }>): DashboardSummary => {
  const nowTs = new Date().toISOString();
  const active = tickets.filter((ticket) => ticket.status === 'active').length;
  const cancelled = tickets.filter((ticket) => ticket.status === 'cancelled').length;
  const interventions = tickets.length;
  const completed = tickets.length - active;
  const shiftsCompleted = Math.max(1, completed);
  const techniciansOnline = Math.max(4, Math.round(active / 2) + 2);

  return {
    interventions,
    techniciansOnline,
    shiftsCompleted,
    activeTickets: active,
    cancelledTickets: cancelled,
    lastUpdated: nowTs,
  };
};
