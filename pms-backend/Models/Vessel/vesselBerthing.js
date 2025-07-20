import { Schema, model } from 'mongoose';

const vesselBerthingSchema = new Schema({
  vesselName: { type: String, required: true },
  ATA: { type: Date, required: true },
  ETD: { type: Date, required: true },
  berthingSide: { type: String, required: true },
  arrivalDraft: { type: Number, required: true }, // in meters
  cargo: { type: String },
  observation: { type: String }
}, { timestamps: true });

export default model('VesselBerthing', vesselBerthingSchema);