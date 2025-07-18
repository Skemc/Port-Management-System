import { Schema, model } from 'mongoose';

const truckInvoiceSchema = new Schema({
  truckId: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  hoursParked: {
    type: Number,
    required: true
  },
  blocks: {
    type: Number,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  }
});

export default model('TruckInvoice', truckInvoiceSchema);