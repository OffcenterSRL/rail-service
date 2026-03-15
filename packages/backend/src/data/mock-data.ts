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

export const fallbackTechnicians: Record<string, { shift: string; team: string }> = {
  'ODL-ETR700-12': { shift: 'Mattina (06-14)', team: 'Squadra Nord' },
  'ODL-ETR700-13': { shift: 'Pomeriggio (14-22)', team: 'Squadra Centrale' },
  'ODL-ETR1000-01': { shift: 'Notte (22-06)', team: 'Squadra Sud' },
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
