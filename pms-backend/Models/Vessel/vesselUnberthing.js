import { Schema, model } from 'mongoose';

const vesselUnberthingSchema = new Schema({
  vesselId: { type: Schema.Types.ObjectId, ref: 'Vessel', required: true },
  unberthingDate: { type: Date, default: Date.now },
  unberthingOfficer: { type: String, required: true },
  remarks: { type: String }
}, { timestamps: true });

export default model('VesselUnberthing', vesselUnberthingSchema);
