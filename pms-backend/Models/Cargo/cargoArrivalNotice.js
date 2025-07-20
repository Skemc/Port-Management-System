import { Schema, model } from 'mongoose';

const cargoArrivalNoticeSchema = new Schema({
  noticeNumber: { type: Number, unique: true },
  importExport: { type: String, enum: ['import', 'export'], required: true },
  collectionType: { type: String, enum: ['assorted', 'not_assorted'], required: true },
  DDCOM: { type: String },
  clearingAgent: { type: String },
  clientName: { type: String, required: true },
  clientTIN: { type: String },
  clientNumber: { type: String, required: true },
  exporterName: { type: String },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  isInvoiced: { type: Boolean, default: false },
  isPaid: { type: Boolean, default: false },
  isExited: { type: Boolean, default: false },
}, { timestamps: true });

export default model('CargoArrivalNotice', cargoArrivalNoticeSchema);
