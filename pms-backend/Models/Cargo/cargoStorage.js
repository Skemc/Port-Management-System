import { Schema, model } from 'mongoose';

const cargoStorageSchema = new Schema({
  clientName: { type: String, required: true },
  storageRecords: [
    {
      arrivalNoticeId: { type: Number, required: true },
      offloadDate: { type: Date, required: true },
      totalBags: { type: Number, required: true },
      weightPerBag: { type: Number, required: true },
      bagsUsed: { type: Number, default: 0 },
      remainingBags: { type: Number, required: true },
      invoiceHistory: [
        {
          bagsTaken: Number,
          dateIssued: Date,
          amountCharged: Number,
          invoiceId: String,
        },
      ],
    },
  ],
}, { timestamps: true });

export default model('CargoStorage', cargoStorageSchema);

