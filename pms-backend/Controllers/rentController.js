import Rent from '../Models/Utilities/rent.js';
import Invoice from '../Models/Utilities/rentInvoice.js';

// Create rent
export const createRent = async (req, res) => {
  try {
    const rent = new Rent(req.body);
    await rent.save();
    res.status(201).json({ success: true, data: rent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get rents with filters
export const getRents = async (req, res) => {
  try {
    const { clientId, rentType, startDate, endDate } = req.query;
    let filter = {};

    if (clientId) filter.clientId = clientId;
    if (rentType) filter.rentType = rentType;
    if (startDate && endDate) filter.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };

    const rents = await Rent.find(filter).sort({ startDate: -1 });
    res.status(200).json({ success: true, data: rents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get rent summary per client/type
export const getRentSummary = async (req, res) => {
  try {
    const { clientId, rentType } = req.query;
    let match = { invoiced: false };

    if (clientId) match.clientId = clientId;
    if (rentType) match.rentType = rentType;

    const summary = await Rent.aggregate([
      { $match: match },
      { $group: { _id: "$rentType", totalAmount: { $sum: "$amount" } } }
    ]);

    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create invoice linked to rent and mark rent as invoiced
export const createInvoiceForRent = async (req, res) => {
  try {
    const { rentId, dueDate } = req.body;

    const rent = await Rent.findById(rentId);
    if (!rent) {
      return res.status(404).json({ success: false, message: 'Rent record not found' });
    }
    if (rent.invoiced) {
      return res.status(400).json({ success: false, message: 'Rent already invoiced' });
    }

    const invoice = new Invoice({
      clientId: rent.clientId,
      rentId: rent._id,
      amount: rent.amount,
      dueDate,
      status: 'pending'
    });

    await invoice.save();

    rent.invoiced = true;
    rent.invoiceId = invoice._id;
    await rent.save();

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get invoices with filters
export const getInvoices = async (req, res) => {
  try {
    const { clientId, status } = req.query;
    const filter = {};

    if (clientId) filter.clientId = clientId;
    if (status) filter.status = status;

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};