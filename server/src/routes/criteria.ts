import express from 'express';
import {
  getCriteria,
  createCriterion,
  updateCriterion,
  deleteCriterion,
  bulkUpdateCriteria,
} from '../controllers/criteriaController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getCriteria);
router.post('/', createCriterion);
router.put('/bulk', bulkUpdateCriteria);
router.put('/:id', updateCriterion);
router.delete('/:id', deleteCriterion);

export default router;
