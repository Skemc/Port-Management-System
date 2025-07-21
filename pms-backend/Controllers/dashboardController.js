import Boat from '../Models/Boat/boatEntry.js';
import Truck from '../Models/Truck/truckEntry.js';
import Vessel from '../Models/Vessel/vesselEntry.js';
import User from '../Models/Users/user.js';
import Cargo from '../Models/Cargo/cargoArrivalNotice.js';
import CargoStorage from '../Models/Cargo/cargoStorage.js';


// Utility to calculate date range
const getDateRange = (range) => {
  const now = new Date();
  let start;

  switch (range) {
    case 'week':
      start = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      start = new Date(now.setMonth(now.getMonth() - 1));
      break;
    default: // 'today'
      start = new Date(now.setHours(0, 0, 0, 0));
  }

  return { start, end: new Date() };
};

export const getMainOverview = async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    const { start, end } = getDateRange(range);

    const vessels = await Vessel.find({ arrivalTime: { $gte: start, $lte: end } });
    const trucks = await Truck.find({ arrivalTime: { $gte: start, $lte: end } });
    const boats = await Boat.find({ arrivalTime: { $gte: start, $lte: end } });
    const cargo = await Cargo.find({ createdAt: { $gte: start, $lte: end } });

    const usersToday = await User.find({ lastLogin: { $gte: start, $lte: end } });

    res.json({
      vessels: vessels.map(v => ({ name: v.name, flag: v.flag, arrivalTime: v.arrivalTime, status: v.status, user: v.recordedBy })),
      trucks: trucks.map(t => ({ plate: t.plate, arrivalTime: t.arrivalTime })),
      boats: boats.map(b => ({ name: b.name, arrivalTime: b.arrivalTime })),
      cargoHandled: {
        count: cargo.length,
        totalWeight: cargo.reduce((sum, c) => sum + c.totalWeight, 0),
        statusBreakdown: {
          pending: cargo.filter(c => c.status === 'Pending').length,
          handled: cargo.filter(c => c.status === 'Handled').length,
          stored: cargo.filter(c => c.status === 'Stored').length,
        }
      },
      operationsCount: {
        vessels: vessels.length,
        trucks: trucks.length,
        boats: boats.length,
        cargo: cargo.length
      },
      usersToday: usersToday.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Dashboard overview failed' });
  }
};

// Add other methods similarly:
export const getCargoDashboard = async (req, res) => {
  // cargo handling, search filters, FIFO, etc.
try {
    const { startDate, endDate, handledBy, client, noticeNumber, operationType } = req.query;

    const filters = {};
    const dateQuery = {};

    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);
    if (Object.keys(dateQuery).length) filters.createdAt = dateQuery;
    if (handledBy) filters.handledBy = handledBy;
    if (client) filters.client = client;
    if (noticeNumber) filters.noticeNumber = noticeNumber;
    if (operationType) filters.operationType = operationType;

    const cargoList = await Cargo.find(filters)
      .sort({ createdAt: -1 })
      .populate('handledBy client invoice receipt');

    const totalWeight = cargoList.reduce((sum, c) => sum + (c.totalWeight || 0), 0);

    const statusBreakdown = {
      pending: cargoList.filter(c => c.status === 'Pending').length,
      handled: cargoList.filter(c => c.status === 'Handled').length,
      stored: cargoList.filter(c => c.status === 'Stored').length,
      invoiced: cargoList.filter(c => c.status === 'Invoiced').length,
    };

    const recentActivity = {};
    cargoList.forEach(c => {
      const user = c.handledBy?.username || 'Unknown';
      if (!recentActivity[user]) recentActivity[user] = 0;
      recentActivity[user]++;
    });

    const fifoItems = await CargoStorage.find({ status: 'Stored' }).sort({ storedDate: 1 });

    const now = new Date();
    const inStorageBreakdown = {
      grace: 0,
      chargeable_15_30: 0,
      chargeable_31_plus: 0,
    };

    fifoItems.forEach(item => {
      const daysStored = Math.floor((now - item.storedDate) / (1000 * 60 * 60 * 24));
      if (daysStored <= 14) inStorageBreakdown.grace++;
      else if (daysStored <= 30) inStorageBreakdown.chargeable_15_30++;
      else inStorageBreakdown.chargeable_31_plus++;
    });

    res.json({
      totalCargo: cargoList.length,
      totalWeight,
      statusBreakdown,
      recentActivity,
      filtersUsed: { startDate, endDate, handledBy, client, noticeNumber, operationType },
      fifoStorage: fifoItems.map(item => ({
        id: item._id,
        noticeNumber: item.arrivalNotice,
        storedDate: item.storedDate,
        weight: item.totalWeight,
        client: item.client,
        daysStored: Math.floor((now - item.storedDate) / (1000 * 60 * 60 * 24))
      })),
      inStorageBreakdown,
    });
  } catch (err) {
    console.error('Cargo Dashboard Error:', err);
    res.status(500).json({ error: 'Failed to load cargo dashboard' });
  }
};

export const getTruckDashboard = async (req, res) => {
  // parked trucks, status counts, overstays

  try {
    const { startDate, endDate, user, plateNumber } = req.query;

    const filters = {};
    if (startDate && endDate) {
      filters.arrivalTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (user) filters.recordedBy = user;
    if (plateNumber)
      filters.plateNumber = { $regex: plateNumber, $options: 'i' };

    const trucks = await Truck.find(filters)
      .populate('invoice')
      .populate('receipt');

    const now = new Date();

    // Calculate truck stats
    const statusCounts = {
      pending: trucks.filter(t => t.status === 'Pending').length,
      invoiced: trucks.filter(t => t.status === 'Invoiced').length,
      exited: trucks.filter(t => t.status === 'Exited').length,
    };

    // Trucks parked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parkedToday = await Truck.find({
      arrivalTime: { $gte: today },
    });

    // Overstayed trucks
    const overstayed = trucks.filter((t) => {
      if (!t.exitTime || !t.invoice?.createdAt) return false;
      const totalMs = new Date(t.exitTime) - new Date(t.invoice.createdAt);
      const hours = totalMs / (1000 * 60 * 60);
      return hours > 12;
    });

    // Uninvoiced trucks that have exited
    const exitedNotInvoiced = trucks.filter(
      (t) => t.exitTime && !t.invoice
    );

    // Active trucks by user
    const trucksByUser = {};
    trucks.forEach(t => {
      const user = t.recordedBy || 'Unknown';
      trucksByUser[user] = (trucksByUser[user] || 0) + 1;
    });

    res.json({
      parkedToday: parkedToday.length,
      statusCounts,
      overstayed: overstayed.map(t => ({
        plateNumber: t.plateNumber,
        hoursOverstayed: Math.ceil((new Date(t.exitTime) - new Date(t.invoice?.createdAt)) / (1000 * 60 * 60)),
      })),
      exitedNotInvoiced: exitedNotInvoiced.map(t => ({
        plateNumber: t.plateNumber,
        arrivalTime: t.arrivalTime,
        exitTime: t.exitTime,
      })),
      trucksByUser,
      fullList: trucks,
    });
  } catch (err) {
    console.error('Truck Dashboard Error:', err);
    res.status(500).json({ error: 'Truck dashboard failed' });
  }
};

export const getBoatDashboard = async (req, res) => {
  // daily operations, filter by user

  try {
    const { startDate, endDate, user, boatName } = req.query;

    const filters = {};
    if (startDate && endDate) {
      filters.arrivalTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (user) filters.recordedBy = user;
    if (boatName)
      filters.name = { $regex: boatName, $options: 'i' };

    const boats = await Boat.find(filters)
      .populate('invoice')
      .populate('receipt');

    //const now = new Date();

    // Calculate boat stats
    const statusCounts = {
      pending: boats.filter(t => t.status === 'Pending').length,
      invoiced: boats.filter(t => t.status === 'Invoiced').length,
      exited: boats.filter(t => t.status === 'Exited').length,
    };

    // Boats parked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parkedToday = await Boat.find({
      arrivalTime: { $gte: today },
    });

    // Overstayed boats
    const overstayed = boats.filter((t) => {
      if (!t.exitTime || !t.invoice?.createdAt) return false;
      const totalMs = new Date(t.exitTime) - new Date(t.invoice.createdAt);
      const hours = totalMs / (1000 * 60 * 60);
      return hours > 12;
    });

    // Uninvoiced boats that have exited
    const exitedNotInvoiced = boats.filter(
      (t) => t.exitTime && !t.invoice
    );

    // Active boats by user
    const boatsByUser = {};
    boats.forEach(t => {
      const user = t.recordedBy || 'Unknown';
      boatsByUser[user] = (boatsByUser[user] || 0) + 1;
    });

    res.json({
      parkedToday: parkedToday.length,
      statusCounts,
      overstayed: overstayed.map(t => ({
        boatName: t.boatName,
        hoursOverstayed: Math.ceil((new Date(t.exitTime) - new Date(t.invoice?.createdAt)) / (1000 * 60 * 60)),
      })),
      exitedNotInvoiced: exitedNotInvoiced.map(t => ({
        boatName: t.boatName,
        arrivalTime: t.arrivalTime,
        exitTime: t.exitTime,
      })),
      boatsByUser,
      fullList: boats,
    });
  } catch (err) {
    console.error('Boat Dashboard Error:', err);
    res.status(500).json({ error: 'Boat dashboard failed' });
  }
};

export const getVesselDashboard = async (req, res) => {
  // track berthing, invoicing, overstays
  try {
    const { startDate, endDate, user, vesselName } = req.query;

    const filters = {};
    if (startDate && endDate) {
      filters.arrivalTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (user) filters.recordedBy = user;
    if (vesselName)
      filters.name = { $regex: vesselName, $options: 'i' };

    const vessels = await Vessel.find(filters)
      .populate('invoice')
      .populate('receipt');

    const statusCounts = {
      docked: vessels.filter(v => v.status === 'Docked').length,
      invoiced: vessels.filter(v => v.status === 'Invoiced').length,
      overstayed: 0,
      unberthed: vessels.filter(v => v.status === 'Unberthed').length,
    };

    const overstayedVessels = [];

    vessels.forEach(v => {
      if (v.invoice && v.exitTime) {
        const invoicedTime = new Date(v.invoice.createdAt);
        const actualExit = new Date(v.exitTime);
        const hoursStayed = (actualExit - invoicedTime) / (1000 * 60 * 60);
        if (hoursStayed > 12) {
          statusCounts.overstayed++;
          overstayedVessels.push({
            name: v.name,
            plate: v.plateNumber,
            arrival: v.arrivalTime,
            exit: v.exitTime,
            hoursStayed: Math.ceil(hoursStayed),
            invoiceTime: invoicedTime,
          });
        }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const berthedToday = await Vessel.find({
      arrivalTime: { $gte: today },
    });

    res.json({
      berthedToday: berthedToday.length,
      statusCounts,
      overstayedVessels,
      recent: vessels.sort((a, b) => new Date(b.arrivalTime) - new Date(a.arrivalTime)).slice(0, 10),
      filtersUsed: { startDate, endDate, user, vesselName },
    });
  } catch (err) {
    console.error('Vessel Dashboard Error:', err);
    res.status(500).json({ error: 'Vessel dashboard failed' });
  }
};

export const getStorageDashboard = async (req, res) => {
  // FIFO, stored days, client filter
  try {
    const { startDate, endDate, clientName, productName } = req.query;

    const filters = {};
    if (startDate && endDate) {
      filters.storedDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (clientName)
      filters.clientName = { $regex: clientName, $options: 'i' };

    if (productName)
      filters.product = { $regex: productName, $options: 'i' };

    const storedItems = await CargoStorage.find(filters)
      .populate('invoice')
      .sort({ storedDate: 1 }); // FIFO

    const now = new Date();
    const buckets = {
      grace_0_14: 0,
      chargeable_15_30: 0,
      chargeable_31_plus: 0,
    };

    const clients = new Set();
    const uninvoiced = [];

    const detailedItems = storedItems.map(item => {
      const daysStored = Math.floor((now - item.storedDate) / (1000 * 60 * 60 * 24));
      let charge = 0;

      if (daysStored <= 14) buckets.grace_0_14++;
      else if (daysStored <= 30) {
        buckets.chargeable_15_30++;
        charge = item.totalWeight * daysStored * 0.6;
      } else {
        buckets.chargeable_31_plus++;
        charge = item.totalWeight * daysStored * 1.2;
      }

      if (!item.invoice) uninvoiced.push(item);

      clients.add(item.clientName);

      return {
        id: item._id,
        notice: item.arrivalNotice,
        client: item.clientName,
        product: item.product,
        storedDate: item.storedDate,
        daysStored,
        charge,
        status: item.status,
        invoice: item.invoice || null
      };
    });

    res.json({
      totalStored: storedItems.length,
      breakdown: buckets,
      activeClients: Array.from(clients),
      uninvoicedCount: uninvoiced.length,
      fifoStorage: detailedItems
    });
  } catch (err) {
    console.error('Storage Dashboard Error:', err);
    res.status(500).json({ error: 'Storage dashboard failed' });
  }
};

export const getUserActivity = async (req, res) => {
  const { username } = req.params;
  // fetch and aggregate user operations from various models
  try {
    const { username, role, operationType, startDate, endDate } = req.query;

    const userFilter = {};
    if (username) userFilter.username = username;
    if (role) userFilter.role = role;

    const users = await User.find(userFilter);

    const userIds = users.map(u => u._id);

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Helper function to count operations by user
    const countOperations = async (Model, userField) => {
      const filter = {};
      if (userIds.length) filter[userField] = { $in: userIds };
      if (startDate || endDate) filter.createdAt = dateFilter;
      if (operationType && Model.modelName.toLowerCase() !== operationType.toLowerCase()) return 0;

      return Model.countDocuments(filter);
    };

    // Collect counts
    const [cargoCount, truckCount, vesselCount, boatCount] = await Promise.all([
      countOperations(Cargo, 'handledBy'),
      countOperations(Truck, 'recordedBy'),
      countOperations(Vessel, 'recordedBy'),
      countOperations(Boat, 'recordedBy'),
    ]);

    // Logins today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyLogins = await User.countDocuments({ lastLogin: { $gte: today } });

    res.json({
      userCount: users.length,
      dailyLogins,
      operations: {
        cargoHandled: cargoCount,
        trucksAdded: truckCount,
        vesselsHandled: vesselCount,
        boatsHandled: boatCount,
      },
      filtersUsed: { username, role, operationType, startDate, endDate },
    });
  } catch (err) {
    console.error('User Activity Dashboard Error:', err);
    res.status(500).json({ error: 'User activity dashboard failed' });
  }
};

export const searchArrivalNotices = async (req, res) => {
  const { noticeNumber } = req.query;
  const result = await Cargo.findOne({ noticeNumber })
  .populate('invoice')
  .populate('receipt');
  res.json(result);
};
