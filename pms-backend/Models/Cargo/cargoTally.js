import { Schema, model } from 'mongoose';

const cargoTallySchema = new Schema({
  noticeNumber: { type: Number, required: true },
  cargoDescription: { type: String, required: true },
  quantity: { type: Number, required: true },
  cargoType: { type: String, required: true },
  weightPerItem: { type: Number, required: true },
  observation: { type: String },
  totalWeight: { type: Number } // (quantity * weightPerItem), can be computed later
}, { timestamps: true });

export default model('CargoTally', cargoTallySchema);