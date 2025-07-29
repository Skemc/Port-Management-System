import { Schema, model } from 'mongoose';

const invoiceSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  rentId: { type: Schema.Types.ObjectId, ref: 'Rent', required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default model('RentInvoice', invoiceSchema);