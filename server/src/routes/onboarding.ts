import express from 'express';
import {
  saveOnboardingResponse,
  getOnboardingResponses,
  generateCriteria,
  completeOnboarding,
  ONBOARDING_QUESTIONS,
} from '../controllers/onboardingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/questions', (req, res) => {
  res.json({ questions: ONBOARDING_QUESTIONS });
});

router.post('/responses', saveOnboardingResponse);
router.get('/responses', getOnboardingResponses);
router.post('/generate-criteria', generateCriteria);
router.post('/complete', completeOnboarding);

export default router;
