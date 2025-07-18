import { Schema, model } from 'mongoose';

const boatSchema = new Schema({
  boatId: { type: Number, unique: true },
  boatName: { type: String, required: true, unique: true },
  cargoOwner: { type: String, required: true },
  cargoType: { type: String, required: true },
  captainNames: { type: String, required: true },
  captainContacts: { type: String, required: true },
  fullOrEmpty: { type: String, enum: ['Full', 'Empty'], required: true },
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

export default model('Boat', boatSchema);