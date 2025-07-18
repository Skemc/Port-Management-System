import { Schema, model } from 'mongoose';

const exitSchema = new Schema({
    truckId: { type: Number, required: true },
    exited: { type: Boolean, default: false },
    exitTime: { type: Date },
    status: {
        type: String,
        required: true,
    },
    issuedAt: {
    type: Date,
    default: Date.now
  }
    /*invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    paymentDate: { type: Date, default: Date.now },
    amountPaid: { type: Number, required: true },*/
});

export default model('TruckExit', exitSchema);