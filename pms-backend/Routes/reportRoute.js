import express from 'express';
import { getReport } from '../Controllers/reportController.js';
import { protect } from '../Middleware/authMIddleware.js';

const router = express.Router();

// Example: /reports?type=trucks&format=pdf&startDate=2025-07-01&endDate=2025-07-21
router.get('/', protect, getReport);

export default router;
