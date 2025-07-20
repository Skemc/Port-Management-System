import { Router } from 'express';
import CargoArrival from '../Models/CargoHandling/CargoArrival.js';
import CargoInvoice from '../Models/CargoHandling/CargoInvoice.js';
import CargoReceipt from '../Models/CargoHandling/CargoReceipt.js';

const router = Router();

// Register Cargo Arrival
router.post('/arrival', async (req, res) => {
  try {
    const arrival = new CargoArrival(req.body);
    await arrival.save();
    res.status(201).json(arrival);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create Cargo Invoice
router.post('/invoice/:arrivalNoticeNumber', async (req, res) => {
  try {
    const { arrivalNoticeNumber } = req.params;
    const cargo = await CargoArrival.findOne({ arrivalNoticeNumber });

    if (!cargo) {
      return res.status(404).json({ error: 'Cargo Arrival Notice not found' });
    }

    const totalWeight = cargo.tally.reduce((acc, item) => {
      return acc + item.quantity * item.weightPerItem;
    }, 0);

    const rate = cargo.importExport === 'export' ? 0.4 : 2;
    const amount = totalWeight * rate;

    const invoice = new CargoInvoice({
      arrivalNoticeNumber,
      totalWeight,
      rate,
      amount,
      date: new Date()
    });

    await invoice.save();
    cargo.invoiced = true;
    await cargo.save();

    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create Cargo Receipt
router.post('/receipt/:invoiceId', async (req, res) => {
  try {
    const invoice = await CargoInvoice.findById(req.params.invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const receipt = new CargoReceipt({
      invoiceId: invoice._id,
      amountPaid: invoice.amount,
      date: new Date()
    });

    await receipt.save();
    res.status(201).json(receipt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Exit (terminate) cargo record
router.patch('/exit/:arrivalNoticeNumber', async (req, res) => {
  try {
    const cargo = await CargoArrival.findOne({ arrivalNoticeNumber: req.params.arrivalNoticeNumber });
    if (!cargo) {
      return res.status(404).json({ error: 'Cargo record not found' });
    }

    cargo.exited = true;
    await cargo.save();
    res.status(200).json({ message: 'Cargo document closed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
