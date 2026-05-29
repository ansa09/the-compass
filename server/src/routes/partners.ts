import express from 'express';
import {
  getPartners,
  getPartner,
  createPartner,
  updatePartner,
  deletePartner,
  incrementDatesCount,
} from '../controllers/partnersController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getPartners);
router.post('/', createPartner);
router.get('/:id', getPartner);
router.put('/:id', updatePartner);
router.delete('/:id', deletePartner);
router.post('/:id/increment-dates', incrementDatesCount);

export default router;
