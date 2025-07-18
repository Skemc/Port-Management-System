import { Schema, model } from 'mongoose';

const counterSchema = new Schema({
  _id: { type: String, required: true }, // e.g., 'truckId', 'woodenBoatId'
  seq: { type: Number, default: 1000 }
});

export default model('Counter', counterSchema);