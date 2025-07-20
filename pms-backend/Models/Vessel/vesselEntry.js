import { Schema, model } from 'mongoose';

const vesselSchema = new Schema({
  name: { type: String, required: true },
  plateNumber: { type: String, required: true },
  owner: { type: String, required: true },
  certificate: { type: String, required: true },
  capacity: { type: Number, required: true }, // meters
  ownerNumber: { type: Number, required: true }, // meters
  length: { type: Number, required: true }, // meters
  width: { type: Number, required: true }, // meters
  height: { type: Number, required: true }, // meters
  arrivalDate: { type: Date, required: true },
  arrivalTime: { type: String, required: true }, 
  departureDate: { type: Date, required: true },
  departureTime: { type: String, required: true },
  status: {
    type: String,
    enum: ['Scheduled', 'Docked', 'Departed'],
    default: 'Docked'
  }
}, { timestamps: true });

export default model('Vessel', vesselSchema);