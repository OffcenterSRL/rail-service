import mongoose from 'mongoose';
import { Technician, Capoturno } from '../models/technician.model';

const seedTechnicians = async () => {
  const count = await Technician.countDocuments();
  if (count > 0) return;
  await Technician.insertMany([
    { name: 'Carlo Marin', nickname: 'Carlo', matricola: 'C-1001', team: 'Squadra Nord' },
    { name: 'Luisa Ferri', nickname: 'Lu', matricola: 'L-1002', team: 'Squadra Centrale' },
    { name: 'Marco Rinaldi', nickname: 'Marco', matricola: 'M-1003', team: 'Squadra Sud' },
  ]);
  console.log('🌱 Tecnici iniziali inseriti');
};

const seedCapoturni = async () => {
  const count = await Capoturno.countDocuments();
  if (count > 0) return;
  await Capoturno.insertMany([
    { name: 'Giulia Riva', nickname: 'Giulia', matricola: 'C-2001' },
    { name: 'Luca Bassi', nickname: 'Luca', matricola: 'C-2002' },
  ]);
  console.log('🌱 Capoturni iniziali inseriti');
};

export const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rail-service';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
    await seedTechnicians();
    await seedCapoturni();
  } catch (error) {
    console.warn('⚠️ MongoDB connection warning:', (error as Error).message);
    console.warn('Database will be unavailable - running in demo mode');
  }
};
