import { Schema, model } from 'mongoose';

const cargoReceiptSchema = new Schema({
  invoiceId: { type: Schema.Types.ObjectId, ref: 'CargoInvoice', required: true },
  noticeNumber: { type: Number, required: true },
  amountPaid: { type: Number, required: true },
  receiptDate: { type: Date, default: Date.now }
}, { timestamps: true });

export default model('CargoReceipt', cargoReceiptSchema);
