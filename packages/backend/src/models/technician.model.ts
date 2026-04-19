import mongoose, { Schema, Document } from 'mongoose';

export interface ITechnician extends Document {
  name: string;
  nickname: string;
  matricola: string;
  team: string;
}

export interface ICapoturno extends Document {
  name: string;
  nickname: string;
  matricola: string;
}

const technicianSchema = new Schema<ITechnician>(
  {
    name: { type: String, required: true },
    nickname: { type: String, required: true },
    matricola: { type: String, required: true, unique: true },
    team: { type: String, required: true },
  },
  { timestamps: true },
);

const capoturnoSchema = new Schema<ICapoturno>(
  {
    name: { type: String, required: true },
    nickname: { type: String, required: true },
    matricola: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

export const Technician = mongoose.model<ITechnician>('Technician', technicianSchema);
export const Capoturno = mongoose.model<ICapoturno>('Capoturno', capoturnoSchema);
