import { Router } from 'express';
import {
  getMainOverview,
  getCargoDashboard,
  getTruckDashboard,
  getBoatDashboard,
  getVesselDashboard,
  getStorageDashboard,
  searchArrivalNotices,
  getUserActivity
} from '../Controllers/dashboardController.js';

const router = Router();

router.get('/overview', getMainOverview);
router.get('/cargo', getCargoDashboard);
router.get('/trucks', getTruckDashboard);
router.get('/boats', getBoatDashboard);
router.get('/vessels', getVesselDashboard);
router.get('/storage', getStorageDashboard);
router.get('/users/:username', getUserActivity);
router.get('/search/arrival-notices', searchArrivalNotices);

export default router;
