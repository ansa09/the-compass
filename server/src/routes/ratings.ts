import express from 'express';
import {
  createRating,
  getRatingHistory,
  getLatestRating,
} from '../controllers/ratingsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createRating);
router.get('/partner/:partnerId/history', getRatingHistory);
router.get('/partner/:partnerId/latest', getLatestRating);

export default router;
