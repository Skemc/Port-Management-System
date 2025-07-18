// server/routes/vessels.js
import { Router } from 'express';
import Vessel from '../Models/Vessel.js';

const routes = Router();

// Create new vessel
routes.post('/', async (req, res) => {
  try {
    const vessel = new Vessel(req.body);
    await vessel.save();
    res.status(201).json(vessel);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all vessels
routes.get('/', async (req, res) => {
  try {
    const vessels = await Vessel.find();
    res.json(vessels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default routes;