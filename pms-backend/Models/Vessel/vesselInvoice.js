import { Schema, model } from 'mongoose';

const vesselInvoiceSchema = new Schema({
  vessel: { type: Schema.Types.ObjectId, ref: 'Vessel', required: true },
  wharfageFee: { type: Number, required: true },
  berthingFee: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  issueDate: { type: Date, default: Date.now }
});

export default model('VesselInvoice', vesselInvoiceSchema);
