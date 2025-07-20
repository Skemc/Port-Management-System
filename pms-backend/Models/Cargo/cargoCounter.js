import { Schema, model } from 'mongoose';

const cargoCounterSchema = new Schema({
  name: { type: String, required: true },
  seq: { type: Number, default: 1000 }
});

export default model('CargoCounter', cargoCounterSchema);
