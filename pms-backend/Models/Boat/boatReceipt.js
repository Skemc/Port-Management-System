import { Schema, model } from 'mongoose';

const boatReceiptSchema = new Schema({
  invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
  paymentDate: { type: Date, default: Date.now },
  amountPaid: { type: Number, required: true },
});

export default model('BoatReceipt', boatReceiptSchema);