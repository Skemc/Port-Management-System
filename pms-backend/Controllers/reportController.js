import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import { Readable } from 'stream';
import Truck from '../Models/Truck/truckEntry.js';
import Vessel from '../Models/Vessel/vesselEntry.js';
import Cargo from '../Models/Cargo/cargoArrivalNotice.js';
import Boat from '../Models/Boat/boatEntry.js';
import Rent from '../Models/Utilities/rent.js';
import Storage from '../Models/Cargo/cargoStorage.js';
import User from '../Models/Users/user.js';

export const getReport = async (req, res) => {
  try {
    const {
      client,
      startDate,
      endDate,
      type,
      rentType,
      exportType, // 'csv' or 'pdf'
      page = 1,
      limit = 10
    } = req.query;

    const skip = (page - 1) * limit;

    let Model;
    switch (type) {
      case 'vessel':
        Model = Vessel;
        break;
      case 'truck':
        Model = Truck;
        break;
      case 'boat':
        Model = Boat;
        break;
      case 'cargo':
        Model = Cargo;
        break;
      case 'rent':
        Model = Rent;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    const filters = { invoiced: true };

    if (client) {
      if (type === 'rent') {
        filters.clientId = client;
      } else {
        filters.client = { $regex: new RegExp(client, 'i') };
      }
    }

    if (type === 'rent' && rentType) {
      filters.rentType = rentType;
    }

    if (startDate && endDate) {
      filters.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const totalRecords = await Model.countDocuments(filters);
    const records = await Model.find(filters)
      .skip(exportType ? 0 : skip) // If exporting, don't paginate
      .limit(exportType ? 0 : parseInt(limit))
      .sort({ createdAt: -1 });

    // CSV EXPORT
    if (exportType === 'csv') {
      const json2csv = new Json2csvParser();
      const csv = json2csv.parse(records);
      res.header('Content-Type', 'text/csv');
      res.attachment(`${type}_report.csv`);
      return res.send(csv);
    }

    // PDF EXPORT
    if (exportType === 'pdf') {
      const doc = new PDFDocument();
      const stream = new Readable().wrap(doc);

      doc.fontSize(18).text(`${type.toUpperCase()} REPORT`, { align: 'center' }).moveDown();
      records.forEach((item, idx) => {
        doc.fontSize(12).text(`${idx + 1}. ${JSON.stringify(item, null, 2)}`).moveDown();
      });

      doc.end();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_report.pdf`);
      return stream.pipe(res);
    }

    // JSON RESPONSE (default)
    res.status(200).json({
      success: true,
      message: `${type} report fetched successfully`,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
      data: records
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating report',
      error: error.message
    });
  }
};