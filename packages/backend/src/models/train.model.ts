import mongoose, { Schema, Document } from 'mongoose';

export interface ITrain extends Document {
  trainNumber: string;
  company: string;
  departureStation: string;
  arrivalStation: string;
  departureTime: Date;
  arrivalTime: Date;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
}

const trainSchema = new Schema<ITrain>(
  {
    trainNumber: { type: String, required: true, unique: true },
    company: { type: String, required: true },
    departureStation: { type: String, required: true },
    arrivalStation: { type: String, required: true },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    pricePerSeat: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Train = mongoose.model<ITrain>('Train', trainSchema);
