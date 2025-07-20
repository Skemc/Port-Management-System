import { Router } from 'express';
import Truck from '../Models/Truck/truckEntry.js';
import Invoice from '../Models/Truck/truckInvoice.js';
import Receipt from '../Models/Truck/truckReceipt.js';
import getNextSequence from '../Utils/getNextSequence.js';

const router = Router();

// 1. Register truck
router.post('/register', async (req, res) => {
  try {
    const truckId = await getNextSequence('truckId');
    const truck = new Truck({ ...req.body, truckId });
    await truck.save();
    res.status(201).json(truck);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Generate Invoice for a truck by truckId (e.g., 1000, 1001, etc.)
router.post('/invoice/:id', async (req, res) => {
  try {
    const truckId = parseInt(req.params.id); 

    const truck = await Truck.findOne({ truckId });

    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }

    // Calculate hours parked (for simplicity, use arrivalDate + arrivalTime as check-in)
   /* const now = new Date();
    const arrival = new Date(`${truck.arrivalDate}T${truck.arrivalTime}`);
    const hoursParked = Math.ceil((now - arrival) / (1000 * 60 * 60)); // in hours

    const tariffPerBlock = 5000; // RWF per 12-hour block
    const blockCount = Math.ceil(hoursParked / 12);
    const totalAmount = blockCount * tariffPerBlock;

    const invoice = new Invoice({
      truckId,
      amount: totalAmount,
      hoursParked,
      blocks: blockCount,
      issuedAt: now
    });
*/
    const arrival = new Date(`${truck.arrivalDate.toISOString().split('T')[0]}T${truck.arrivalTime}`);
    const now = new Date();
    const msDiff = now - arrival;
    const hours = Math.ceil(msDiff / (1000 * 60 * 60));
    const blocks = Math.ceil(hours / 12);
    const totalAmount = blocks * 5000;

    const invoice = new Invoice({
      truckId,
      blocks,
      hoursParked: hours,
      amount: totalAmount,
    });

    await invoice.save();

    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Pay extra for overstayed time
router.post('/overstay/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const truck = await Truck.findById(id);
    if (!truck || !truck.lastInvoicedAt) {
      return res.status(404).json({ error: 'Truck not found or never invoiced' });
    }

    const now = new Date();
    const diffMs = now - new Date(truck.lastInvoicedAt);
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const blocks = Math.ceil(diffHours / 12);
    const amountDue = blocks * 5000;

    const newInvoice = new TruckInvoice({
      truck: truck._id,
      issuedAt: now,
      amount: amountDue,
    });
    await newInvoice.save();

    const newReceipt = new TruckReceipt({
      invoice: newInvoice._id,
      paidAt: now,
      amountPaid: amountDue,
    });
    await newReceipt.save();

    truck.lastInvoicedAt = now;
    await truck.save();

    res.json({ message: 'Overstay payment processed', amountDue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 3. Generate receipt
router.post('/receipt/:invoiceId', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const receipt = new Receipt({
      invoice: invoice._id,
      amountPaid: invoice.amount,
    });

    await receipt.save();
    res.status(201).json(receipt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Exit truck
router.put('/exit/:id', async (req, res) => {
  try {
     const truckId = parseInt(req.params.id); 
    console.log(`Exiting truck with ID: ${truckId}`);
    
    const truck = await Truck.findByIdAndUpdate(
      truckId,
      { 
        exited: true, 
        exitTime: new Date(),
        status: 'Exited' 
      },
      { new: true }
    );
    if (!truck) return res.status(404).json({ error: 'Truck not found' });

    res.json(truck);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
