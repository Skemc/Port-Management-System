import { Schema, model } from 'mongoose';

const rentSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  rentType: { type: String, enum: ['office', 'restaurant', 'parking', 'storage'], required: true },
  description: String,
  amount: { type: Number, required: true }, // Rent amount for the period
  unitPrice: Number, // For storage or parking: price per square meter or per space
  quantity: Number,  // For storage/parking: square meters or number of spaces rented
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  invoiced: { type: Boolean, default: false },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
  createdAt: { type: Date, default: Date.now }
});

rentSchema.methods.getDurationDays = function() {
  const msInDay = 24 * 60 * 60 * 1000;
  return Math.ceil((this.endDate - this.startDate) / msInDay);
};

rentSchema.methods.calculateAmount = function() {
  const duration = this.getDurationDays();
  if (this.rentType === 'storage' || this.rentType === 'parking') {
    return this.unitPrice * this.quantity * duration;
  } else {
    return this.unitPrice * this.quantity;
  }
};

export default model('Rent', rentSchema);

