import { Schema, model } from 'mongoose';

const truckReceiptSchema = new Schema({
  invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
  paymentDate: { type: Date, default: Date.now },
  amountPaid: { type: Number, required: true },
});

export default model('TruckReceipt', truckReceiptSchema);