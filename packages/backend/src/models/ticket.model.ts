import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  userId: string;
  trainId: string;
  departureStation: string;
  arrivalStation: string;
  departureTime: Date;
  arrivalTime: Date;
  seatNumber: string;
  price: number;
  status: 'active' | 'used' | 'cancelled';
  bookingDate: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    userId: { type: String, required: true },
    trainId: { type: String, required: true },
    departureStation: { type: String, required: true },
    arrivalStation: { type: String, required: true },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    seatNumber: { type: String, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['active', 'used', 'cancelled'], default: 'active' },
    bookingDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);
