import mongoose, { Schema, Document } from 'mongoose';

export interface ITask {
  _id: mongoose.Types.ObjectId;
  description: string;
  priority: 'preventiva' | 'correttiva' | 'urgente';
  preventiveType?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName: string;
  assignedTechnicianNickname: string;
  status: 'aperta' | 'in_progress' | 'risolte' | 'rimandato';
  timeSpentMinutes?: number;
  performedBy?: Array<{ id: string; name: string; matricola: string }>;
  deferredKey?: string;
  deferredSince?: string;
  deferredCount?: number;
}

export interface ITicket extends Document {
  trainNumber: string;
  shift: string;
  codiceODL: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  tasks: ITask[];
  openedAt?: Date;
  assignedTechnician?: string;
}

const taskSchema = new Schema<ITask>({
  description: { type: String, required: true },
  priority: { type: String, enum: ['preventiva', 'correttiva', 'urgente'], required: true },
  preventiveType: { type: String },
  assignedTechnicianId: { type: String },
  assignedTechnicianName: { type: String, default: '' },
  assignedTechnicianNickname: { type: String, default: '' },
  status: { type: String, enum: ['aperta', 'in_progress', 'risolte', 'rimandato'], default: 'aperta' },
  timeSpentMinutes: { type: Number },
  performedBy: [{ id: String, name: String, matricola: String }],
  deferredKey: { type: String },
  deferredSince: { type: String },
  deferredCount: { type: Number },
});

const ticketSchema = new Schema<ITicket>(
  {
    trainNumber: { type: String, required: true },
    shift: { type: String, required: true },
    codiceODL: { type: String, required: true },
    status: { type: String, enum: ['pending', 'active', 'completed', 'cancelled'], default: 'active' },
    tasks: [taskSchema],
    openedAt: { type: Date },
    assignedTechnician: { type: String },
  },
  { timestamps: true },
);

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);
