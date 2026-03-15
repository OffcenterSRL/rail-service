import { randomUUID } from 'node:crypto';

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

const now = new Date();

const baseTickets: TicketRecord[] = [
  {
    _id: 'ticket-1',
    userId: 'user-1',
    trainId: 'ETR700-12',
    departureStation: 'Roma Tiburtina',
    arrivalStation: 'Milano Centrale',
    departureTime: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString(),
    arrivalTime: new Date(now.getTime() + 1.5 * 60 * 60 * 1000).toISOString(),
    seatNumber: '12A',
    price: 139.5,
    status: 'active',
    bookingDate: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'ticket-2',
    userId: 'user-2',
    trainId: 'ETR700-13',
    departureStation: 'Firenze Santa Maria Novella',
    arrivalStation: 'Bologna Centrale',
    departureTime: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(),
    arrivalTime: new Date(now.getTime() + 2.8 * 60 * 60 * 1000).toISOString(),
    seatNumber: '22B',
    price: 59.9,
    status: 'active',
    bookingDate: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'ticket-3',
    userId: 'user-3',
    trainId: 'ETR500-04',
    departureStation: 'Torino Porta Susa',
    arrivalStation: 'Genova Piazza Principe',
    departureTime: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
    arrivalTime: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
    seatNumber: '03C',
    price: 45.0,
    status: 'used',
    bookingDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'ticket-4',
    userId: 'user-4',
    trainId: 'ETR1000-01',
    departureStation: 'Napoli Centrale',
    arrivalStation: 'Roma Termini',
    departureTime: new Date(now.getTime() - 15 * 60 * 60 * 1000).toISOString(),
    arrivalTime: new Date(now.getTime() - 13 * 60 * 60 * 1000).toISOString(),
    seatNumber: '14D',
    price: 49.0,
    status: 'cancelled',
    bookingDate: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
  },
];

export const fallbackTickets = [...baseTickets];

export const fallbackTechnicians: Record<string, { shift: string; team: string }> = {
  'ODL-ETR700-12': { shift: 'Mattina (06-14)', team: 'Squadra Nord' },
  'ODL-ETR700-13': { shift: 'Pomeriggio (14-22)', team: 'Squadra Centrale' },
  'ODL-ETR1000-01': { shift: 'Notte (22-06)', team: 'Squadra Sud' },
};

export const addFallbackTicket = (payload: Partial<TicketRecord>): TicketRecord => {
  const ticket: TicketRecord = {
    _id: randomUUID(),
    userId: payload.userId ?? `user-${Math.floor(Math.random() * 1000)}`,
    trainId: payload.trainId ?? 'ETR700-12',
    departureStation: payload.departureStation ?? 'Roma Tiburtina',
    arrivalStation: payload.arrivalStation ?? 'Milano Centrale',
    departureTime:
      payload.departureTime ?? new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    arrivalTime:
      payload.arrivalTime ?? new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    seatNumber: payload.seatNumber ?? '00A',
    price: payload.price ?? 0,
    status: 'active',
    bookingDate: new Date().toISOString(),
  };
  fallbackTickets.unshift(ticket);
  return ticket;
};

export const cancelFallbackTicket = (id: string): TicketRecord | null => {
  const target = fallbackTickets.find((ticket) => ticket._id === id);
  if (!target || target.status === 'cancelled') {
    return null;
  }
  target.status = 'cancelled';
  return target;
};

export const buildDashboardSummary = (tickets: TicketRecord[]): DashboardSummary => {
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
