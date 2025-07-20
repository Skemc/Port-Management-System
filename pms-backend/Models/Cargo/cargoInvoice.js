import { Schema, model } from 'mongoose';

const cargoInvoiceSchema = new Schema({
  noticeNumber: { type: Number, required: true },
  totalWeight: { type: Number, required: true },
  chargeRate: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  invoiceDate: { type: Date, default: Date.now }
}, { timestamps: true });

export default model('CargoInvoice', cargoInvoiceSchema);