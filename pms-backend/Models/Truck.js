import { Schema, model } from 'mongoose';

const truckSchema = new Schema({
  plateNumber: { type: String, required: true },
  cargoOwner: { type: String, required: true },
  cargoType: { type: String, required: true },
  driverNames: { type: String, required: true },
  driverNumber: { type: String, required: true },
  seal: { type: String, required: true },
  // length: { type: Number, required: true }, // meters
  arrivalDate: { type: Date },
  arrivalTime: { type: Date },
  status: {
    type: String,
    enum: ['Parked', 'Pending', 'Exited'],
    default: 'Parked'
  }
}, { timestamps: true });

export default model('Truck', truckSchema);