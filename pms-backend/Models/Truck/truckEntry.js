import { Schema, model } from 'mongoose';

const truckSchema = new Schema({
  truckId: { type: Number, unique: true },
  plateNumber: { type: String, required: true, unique: true },
  cargoOwner: { type: String, required: true },
  cargoType: { type: String, required: true },
  driverNames: { type: String, required: true },
  driverContacts: { type: String, required: true },
  fullOrEmpty: { type: String, enum: ['Full', 'Empty'], required: true },
  sealNumber: { type: String },
  arrivalDate: { type: Date, required: true },
  arrivalTime: { type: String, required: true }, 
  exited: { type: Boolean, default: false },
  exitTime: { type: Date },
  status: {
    type: String,
    enum: ['Parked', 'Pending', 'Exited'],
    default: 'Parked'
  }
}, { timestamps: true });

export default model('Truck', truckSchema);