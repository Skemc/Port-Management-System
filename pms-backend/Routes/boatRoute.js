import { Router } from 'express';
import Boat from '../Models/Boat/boatEntry.js';
import Invoice from '../Models/Boat/boatInvoice.js';
import Receipt from '../Models/Boat/boatReceipt.js';
import getNextSequence from '../Utils/getNextSequence.js';

const router = Router();

// 1. Register boat
router.post('/register', async (req, res) => {
  try {
    const boatId = await getNextSequence('boatId');
    const boat = new Boat({ ...req.body, boatId });
    await boat.save();
    res.status(201).json(boat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Generate Invoice for a truck by truckId (e.g., 1000, 1001, etc.)
router.post('/invoice/:id', async (req, res) => {
  try {
    const boatId = parseInt(req.params.id);

    const boat = await Boat.findOne({ boatId });

    if (!boat) {
      return res.status(404).json({ error: 'Boat not found' });
    }

    // Calculate hours parked (for simplicity, use arrivalDate + arrivalTime as check-in)
   /* const now = new Date();
    const arrival = new Date(`${boat.arrivalDate}T${boat.arrivalTime}`);
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
    const arrival = new Date(`${boat.arrivalDate.toISOString().split('T')[0]}T${boat.arrivalTime}`);
    const now = new Date();
    const msDiff = now - arrival;
    const hours = Math.ceil(msDiff / (1000 * 60 * 60));
    const blocks = Math.ceil(hours / 12);
    const totalAmount = blocks * 5000;

    const invoice = new Invoice({
      boatId,
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

// 4. Exit boat
router.put('/exit/:id', async (req, res) => {
  try {
     const boatId = parseInt(req.params.id); 
    console.log(`Exiting boat with ID: ${boatId}`);

    const boat = await Boat.findByIdAndUpdate(
      boatId,
      { 
        exited: true, 
        exitTime: new Date(),
        status: 'Exited' 
      },
      { new: true }
    );
    if (!boat) return res.status(404).json({ error: 'Boat not found' });

    res.json(boat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
