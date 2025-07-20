import { Schema, model } from 'mongoose';

const vesselReceiptSchema = new Schema({
  invoiceId: { type: Schema.Types.ObjectId, ref: 'VesselInvoice', required: true },
  paymentDate: { type: Date, default: Date.now },
  amountPaid: { type: Number, required: true },
  receivedBy: { type: String, required: true }
});

export default model('VesselReceipt', vesselReceiptSchema);
