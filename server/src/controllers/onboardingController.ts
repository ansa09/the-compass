import { Response } from 'express';
import getDb from '../database/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { OnboardingResponse } from '../types/index.js';

// The 10 onboarding questions
export const ONBOARDING_QUESTIONS = [
  'Think of someone you deeply admired — what quality stood out most?',
  'What\'s a value that is non-negotiable for you in a relationship?',
  'How important is physical attraction versus emotional connection to you?',
  'What lifestyle factors matter most — career ambition, family focus, adventure, stability?',
  'How do you feel about someone who shares your hobbies vs complements you?',
  'What communication style do you need from a partner?',
  'How important is shared humour and playfulness?',
  'What role does physical health/fitness play in your ideal partner?',
  'How much does financial stability or ambition matter to you?',
  'What has been a recurring dealbreaker in past relationships?',
];

// Generate criteria based on user responses
function generateCriteriaFromResponses(responses: OnboardingResponse[]): any[] {
  // This is a simplified version. In a real implementation, you might use
  // NLP or more sophisticated matching, but for now we'll generate a standard
  // set of criteria based on keyword matching in responses

  const criteria = [
    { name: 'Emotional Intelligence', description: 'Ability to understand and communicate feelings', tier: 'dealbreaker', order: 1 },
    { name: 'Physical Chemistry', description: 'Physical attraction and spark', tier: 'dealbreaker', order: 2 },
    { name: 'Shared Values', description: 'Alignment on core life values and beliefs', tier: 'dealbreaker', order: 3 },
    { name: 'Communication Style', description: 'How openly and effectively they communicate', tier: 'important', order: 4 },
    { name: 'Lifestyle Compatibility', description: 'Daily routines and lifestyle preferences', tier: 'important', order: 5 },
    { name: 'Sense of Humor', description: 'Ability to laugh and have fun together', tier: 'important', order: 6 },
    { name: 'Ambition & Drive', description: 'Career focus and personal goals', tier: 'important', order: 7 },
    { name: 'Family Values', description: 'Views on family and future plans', tier: 'nice-to-have', order: 8 },
    { name: 'Physical Health', description: 'Commitment to health and fitness', tier: 'nice-to-have', order: 9 },
    { name: 'Shared Hobbies', description: 'Common interests and activities', tier: 'nice-to-have', order: 10 },
    { name: 'Financial Stability', description: 'Responsibility with money and finances', tier: 'nice-to-have', order: 11 },
    { name: 'Intellectual Curiosity', description: 'Interest in learning and growth', tier: 'nice-to-have', order: 12 },
  ];

  // Analyze responses for keywords to adjust tiers
  const allAnswers = responses.map((r) => r.answer.toLowerCase()).join(' ');

  // Promote criteria to dealbreaker if mentioned emphatically
  if (allAnswers.includes('communication') || allAnswers.includes('communicate')) {
    const comm = criteria.find((c) => c.name === 'Communication Style');
    if (comm) comm.tier = 'dealbreaker';
  }

  if (allAnswers.includes('humor') || allAnswers.includes('laugh') || allAnswers.includes('fun')) {
    const humor = criteria.find((c) => c.name === 'Sense of Humor');
    if (humor) humor.tier = 'important';
  }

  if (allAnswers.includes('fitness') || allAnswers.includes('health') || allAnswers.includes('active')) {
    const health = criteria.find((c) => c.name === 'Physical Health');
    if (health) health.tier = 'important';
  }

  if (allAnswers.includes('ambition') || allAnswers.includes('career') || allAnswers.includes('driven')) {
    const ambition = criteria.find((c) => c.name === 'Ambition & Drive');
    if (ambition && ambition.tier === 'important') ambition.tier = 'dealbreaker';
  }

  if (allAnswers.includes('family') || allAnswers.includes('children') || allAnswers.includes('kids')) {
    const family = criteria.find((c) => c.name === 'Family Values');
    if (family) family.tier = 'important';
  }

  return criteria;
}

export async function saveOnboardingResponse(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { question_number, answer } = req.body;

  if (question_number === undefined || !answer) {
    res.status(400).json({ error: 'Question number and answer are required' });
    return;
  }

  if (question_number < 1 || question_number > 10) {
    res.status(400).json({ error: 'Question number must be between 1 and 10' });
    return;
  }

  const db = getDb();
  const questionText = ONBOARDING_QUESTIONS[question_number - 1];

  try {
    // Upsert the response
    db.prepare(
      `INSERT INTO onboarding_responses (user_id, question_number, question_text, answer)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, question_number)
       DO UPDATE SET answer = excluded.answer, created_at = CURRENT_TIMESTAMP`
    ).run(req.user.userId, question_number, questionText, answer);

    const response = db
      .prepare('SELECT * FROM onboarding_responses WHERE user_id = ? AND question_number = ?')
      .get(req.user.userId, question_number) as OnboardingResponse;

    res.json({ response });
  } catch (error) {
    console.error('Save onboarding response error:', error);
    res.status(500).json({ error: 'Failed to save response' });
  }
}

export async function getOnboardingResponses(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const db = getDb();

  try {
    const responses = db
      .prepare('SELECT * FROM onboarding_responses WHERE user_id = ? ORDER BY question_number ASC')
      .all(req.user.userId) as OnboardingResponse[];

    res.json({ responses });
  } catch (error) {
    console.error('Get onboarding responses error:', error);
    res.status(500).json({ error: 'Failed to get responses' });
  }
}

export async function generateCriteria(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const db = getDb();

  try {
    // Get all onboarding responses
    const responses = db
      .prepare('SELECT * FROM onboarding_responses WHERE user_id = ? ORDER BY question_number ASC')
      .all(req.user.userId) as OnboardingResponse[];

    if (responses.length < 10) {
      res.status(400).json({ error: 'Please complete all 10 questions first' });
      return;
    }

    // Generate criteria based on responses
    const generatedCriteria = generateCriteriaFromResponses(responses);

    // Check if user already has criteria
    const existingCriteria = db
      .prepare('SELECT COUNT(*) as count FROM criteria WHERE user_id = ?')
      .get(req.user.userId) as { count: number };

    if (existingCriteria.count > 0) {
      res.status(409).json({
        error: 'User already has criteria. Use the update endpoints to modify them.',
        criteria: db.prepare('SELECT * FROM criteria WHERE user_id = ? ORDER BY display_order ASC').all(req.user.userId)
      });
      return;
    }

    // Insert generated criteria
    const insertStmt = db.prepare(
      'INSERT INTO criteria (user_id, name, description, tier, display_order) VALUES (?, ?, ?, ?, ?)'
    );

    const transaction = db.transaction((criteriaList: any[]) => {
      for (const criterion of criteriaList) {
        insertStmt.run(
          req.user!.userId,
          criterion.name,
          criterion.description,
          criterion.tier,
          criterion.order
        );
      }
    });

    transaction(generatedCriteria);

    // Mark user as having completed onboarding
    db.prepare('UPDATE users SET has_completed_onboarding = 1 WHERE id = ?').run(req.user.userId);

    // Get saved criteria
    const savedCriteria = db
      .prepare('SELECT * FROM criteria WHERE user_id = ? ORDER BY display_order ASC')
      .all(req.user.userId);

    res.json({
      criteria: savedCriteria,
      message: 'Criteria generated successfully'
    });
  } catch (error) {
    console.error('Generate criteria error:', error);
    res.status(500).json({ error: 'Failed to generate criteria' });
  }
}

export async function completeOnboarding(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const db = getDb();

  try {
    db.prepare('UPDATE users SET has_completed_onboarding = 1 WHERE id = ?').run(req.user.userId);

    res.json({ message: 'Onboarding completed' });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
}
