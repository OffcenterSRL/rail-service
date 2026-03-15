import { WebSocket, WebSocketServer } from 'ws';
import { getTechnicianList } from '../data/mock-data';

export interface TechnicianPresencePayload {
  techniciansOnline: number;
  active: Array<{ id: string; name: string; team: string }>;
  updatedAt: string;
}

const buildPresenceSnapshot = (): TechnicianPresencePayload => {
  const entries = getTechnicianList();
  if (!entries.length) {
    return {
      techniciansOnline: 0,
      active: [],
      updatedAt: new Date().toISOString(),
    };
  }
  const active = entries
    .filter(() => Math.random() > 0.25)
    .map((info) => ({
      id: info.id,
      name: info.name,
      team: info.team,
    }));

  if (active.length < 4) {
    const missing = 4 - active.length;
    for (let i = 0; i < missing; i += 1) {
      const info = entries.length ? entries[i % entries.length] : undefined;
      if (!info || active.find((tech) => tech.id === info.id)) {
        continue;
      }
      active.push({
        id: info.id,
        name: info.name,
        team: info.team,
      });
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
