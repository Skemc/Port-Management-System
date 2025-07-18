// server/routes/trucks.js
import { Router } from 'express';
import Truck from '../Models/Truck.js';

const routes = Router();

// Create new truck
routes.post('/', async (req, res) => {
  try {
    const truck = new Truck(req.body);
    await truck.save();
    res.status(201).json(truck);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all trucks
routes.get('/', async (req, res) => {
  try {
    const trucks = await Truck.find();
    res.json(trucks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
export default routes;
