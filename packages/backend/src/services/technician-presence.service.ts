import { WebSocket, WebSocketServer } from 'ws';
import { fallbackTechnicians } from '../data/mock-data';

export interface TechnicianPresencePayload {
  techniciansOnline: number;
  active: Array<{ codiceODL: string; shift: string; team: string }>;
  updatedAt: string;
}

const buildPresenceSnapshot = (): TechnicianPresencePayload => {
  const entries = Object.entries(fallbackTechnicians);
  const active = entries
    .filter(() => Math.random() > 0.25)
    .map(([codiceODL, info]) => ({
      codiceODL,
      shift: info.shift,
      team: info.team,
    }));

  if (active.length < 4) {
    const missing = 4 - active.length;
    for (let i = 0; i < missing; i += 1) {
      const [codiceODL, info] = entries[i % entries.length];
      if (!active.find((tech) => tech.codiceODL === codiceODL)) {
        active.push({
          codiceODL,
          shift: info.shift,
          team: info.team,
        });
      }
    }
  }

  return {
    techniciansOnline: Math.max(4, active.length),
    active,
    updatedAt: new Date().toISOString(),
  };
};

export const attachTechnicianPresenceStream = (wss: WebSocketServer) => {
  const sendSnapshot = () => {
    const snapshot = buildPresenceSnapshot();
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(snapshot));
      }
    });
  };

  const interval = setInterval(sendSnapshot, 3500);

  wss.on('connection', (socket) => {
    socket.send(JSON.stringify(buildPresenceSnapshot()));
    socket.on('close', () => {
      // no-op, snapshots continue to broadcast
    });
  });

  wss.on('close', () => {
    clearInterval(interval);
  });
};
