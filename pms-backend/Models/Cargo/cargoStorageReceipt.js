import { Schema, model } from 'mongoose';

const cargoStorageReceiptSchema = new Schema({
  receiptNumber: { type: String, required: true, unique: true },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'CargoStorageInvoice', required: true },
  clientName: { type: String, required: true },
  clientTIN: { type: String },
  totalWeight: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  paidAt: { type: Date, default: Date.now }
});

export default model('CargoStorageReceipt', cargoStorageReceiptSchema);
