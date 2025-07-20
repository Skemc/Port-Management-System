import { Router } from 'express';
import Vessel from '../Models/Vessel/vesselEntry.js';
import VesselBerthing from '../Models/Vessel/vesselBerthing.js';
import VesselInvoice from '../Models/Vessel/vesselInvoice.js';
import VesselReceipt from '../Models/Vessel/vesselReceipt.js';
import VesselUnberthing from '../Models/Vessel/vesselUnberthing.js';

const router = Router();

// Register Vessel
router.post('/register', async (req, res) => {
  try {
    const vessel = new Vessel(req.body);
    await vessel.save();
    res.status(201).json(vessel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Berthing Vessel
router.post('/berth', async (req, res) => {
  try {
    const berthing = new VesselBerthing(req.body);
    await berthing.save();
    res.status(201).json(berthing);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate Invoice
router.post('/invoice/:vesselId', async (req, res) => {
  try {
    const { vesselId } = req.params;

    const vessel = await Vessel.findById(vesselId);
    if (!vessel) return res.status(404).json({ error: 'Vessel not found' });

    const arrival = combineDateAndTime(vessel.arrivalDate, vessel.arrivalTime);
    const departure = new Date();
    const diffDays = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));

    const wharfage = 210000;
    const extraDays = diffDays > 3 ? diffDays - 3 : 0;
    const berthing = extraDays * 28000;
    const total = wharfage + berthing;

    const invoice = new VesselInvoice({
      vesselId,
      wharfageFee: wharfage,
      berthingFee: berthing,
      totalAmount: total,
    });
    await invoice.save();

    vessel.isInvoiced = true;
    vessel.lastInvoicedAt = new Date();

    await vessel.save();

    res.status(201).json({ message: 'Invoice generated successfully', invoice });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Pay extra for overstayed time
router.post('/overstay/:vesselId', async (req, res) => {
  try {
    const { vesselId } = req.params;
    const vessel = await Vessel.findById(vesselId);
    if (!vessel || !vessel.lastInvoicedAt) {
      return res.status(404).json({ error: 'Vessel not found or never invoiced' });
    }

    const lastInvoice = new Date(vessel.lastInvoicedAt);
    const now = new Date();

    const durationHours = Math.ceil((now - lastInvoice) / (1000 * 60 * 60));
    const extraDays = Math.ceil(durationHours / 24);

    const berthingFee = extraDays * 28000;
    const totalAmount = berthingFee;

    const extraInvoice = new VesselInvoice({
      vessel: vessel._id,
      wharfageFee: 0,
      berthingFee,
      totalAmount
    });

    await extraInvoice.save();

    vessel.lastInvoicedAt = now;
    await vessel.save();

    res.status(201).json({
      message: 'Extra overstay invoice generated',
      invoice: extraInvoice
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Generate Receipt
router.post('/receipt/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await VesselInvoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const receipt = new VesselReceipt({
      invoiceId: invoice._id,
      amountPaid: invoice.totalAmount,
    });

    await receipt.save();
    res.status(201).json(receipt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Unberth Vessel
router.post('/exit', async (req, res) => {
  try {
    const unberthing = new VesselUnberthing(req.body);
    await unberthing.save();

    await Vessel.findByIdAndUpdate(req.body.vesselId, {
      status: 'Departed',
      departureDate: new Date()
    });

    res.status(201).json(unberthing);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
