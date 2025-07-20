import { Router } from 'express';
import CargoArrival from '../Models/Cargo/cargoArrivalNotice.js';
import CargoInvoice from '../Models/Cargo/cargoInvoice.js';
import CargoReceipt from '../Models/Cargo/CargoReceipt.js';
import CargoStorage from '../Models/Cargo/cargoStorage.js';
import { calculateStorageCharges } from '../utils/calculateStorageFee.js';
import CargoStorageReceipt from '../Models/Cargo/cargoStorageReceipt.js';

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

// Endpoint to record offloaded cargo for storage
router.post('/storage/offload', async (req, res) => {
  try {
    const {
      clientName,
      arrivalNoticeId,
      offloadDate,
      totalBags,
      weightPerBag
    } = req.body;

    const totalWeight = totalBags * weightPerBag;

    let clientStorage = await CargoStorage.findOne({ clientName });

    const storageRecord = {
      arrivalNoticeId,
      offloadDate,
      totalBags,
      weightPerBag,
      remainingBags: totalBags,
      invoiceHistory: []
    };

    if (!clientStorage) {
      clientStorage = new CargoStorage({
        clientName,
        storageRecords: [storageRecord]
      });
    } else {
      clientStorage.storageRecords.push(storageRecord);
    }

    await clientStorage.save();
    res.status(200).json({ message: 'Storage entry saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to release goods and calculate charges using FIFO
router.post('/storage/release', async (req, res) => {
  try {
    const { clientName, bagsRequested, releaseDate } = req.body;

    const clientStorage = await CargoStorage.findOne({ clientName });
    if (!clientStorage) return res.status(404).json({ error: 'Client not found' });

    let bagsLeft = bagsRequested;
    let totalAmount = 0;
    const invoiceItems = [];

    for (const record of clientStorage.storageRecords) {
      if (bagsLeft <= 0) break;

      const available = record.remainingBags;
      if (available <= 0) continue;

      const bagsToTake = Math.min(bagsLeft, available);
      const weight = bagsToTake * record.weightPerBag;

      const fee = calculateStorageCharges(new Date(record.offloadDate), new Date(releaseDate), weight);
      totalAmount += fee;

      // Update storage
      record.remainingBags -= bagsToTake;
      record.bagsUsed += bagsToTake;
      record.invoiceHistory.push({
        bagsTaken: bagsToTake,
        dateIssued: releaseDate,
        amountCharged: fee,
        invoiceId: 'INV-' + Math.floor(Math.random() * 90000 + 10000)
      });

      invoiceItems.push({
        arrivalNoticeId: record.arrivalNoticeId,
        bagsTaken: bagsToTake,
        charge: fee
      });

      bagsLeft -= bagsToTake;
    }

    await clientStorage.save();

    if (bagsLeft > 0) {
      return res.status(400).json({ error: `Only ${bagsRequested - bagsLeft} bags released. Not enough stock.` });
    }

    res.status(200).json({
      message: 'Goods released successfully',
      totalCharge: totalAmount,
      invoiceBreakdown: invoiceItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/cargo/storage/receipt', async (req, res) => {
  try {
    const { invoiceId } = req.body;

    const invoice = await CargoStorage.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const receiptNumber = Math.floor(100000 + Math.random() * 900000).toString();

    const receipt = new CargoStorageReceipt({
      receiptNumber,
      invoiceId: invoice._id,
      clientName: invoice.clientName,
      clientTIN: invoice.clientTIN,
      totalWeight: invoice.totalWeight,
      totalAmount: invoice.totalCharge
    });

    await receipt.save();
    return res.status(201).json(receipt);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
