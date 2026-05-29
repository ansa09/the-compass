import { Response } from 'express';
import getDb from '../database/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { Rating, RatingScore, CriterionScore, CalculatedRating } from '../types/index.js';
import { generateCompatibilityExplanation } from '../services/aiService.js';

// Scoring weights by tier
const TIER_WEIGHTS = {
  dealbreaker: 3,
  important: 2,
  'nice-to-have': 1,
};

// Calculate overall score and traffic light
function calculateRating(scores: CriterionScore[]): CalculatedRating {
  let weightedSum = 0;
  let maxPossibleScore = 0;

  for (const score of scores) {
    const weight = TIER_WEIGHTS[score.tier];
    weightedSum += score.score * weight;
    maxPossibleScore += 10 * weight;
  }

  const overallScore = (weightedSum / maxPossibleScore) * 100;

  let trafficLight: 'green' | 'amber' | 'orange' | 'red';
  let vibeLabel: string;

  if (overallScore >= 85) {
    trafficLight = 'green';
    vibeLabel = 'Strong connection ✨';
  } else if (overallScore >= 65) {
    trafficLight = 'amber';
    vibeLabel = 'Promising, keep exploring 🌱';
  } else if (overallScore >= 40) {
    trafficLight = 'orange';
    vibeLabel = 'Mixed signals 🤔';
  } else {
    trafficLight = 'red';
    vibeLabel = 'Misaligned 💔';
  }

  return {
    overallScore: Math.round(overallScore * 10) / 10, // Round to 1 decimal
    trafficLight,
    vibeLabel,
    scores,
  };
}

export async function createRating(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { partner_id, scores, notes } = req.body;

  if (!partner_id || !Array.isArray(scores) || scores.length === 0) {
    res.status(400).json({ error: 'Partner ID and scores are required' });
    return;
  }

  const db = getDb();

  try {
    // Verify partner ownership
    const partner: any = db
      .prepare('SELECT * FROM partners WHERE id = ? AND user_id = ?')
      .get(partner_id, req.user.userId);

    if (!partner) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }

    // Calculate overall rating
    const calculated = calculateRating(scores);

    // Generate AI explanation
    const aiExplanation = await generateCompatibilityExplanation(
      partner.first_name,
      calculated.overallScore,
      calculated.trafficLight,
      scores,
      notes,
      partner.dates_count || 0
    );

    // Create rating
    const ratingResult = db
      .prepare(
        'INSERT INTO ratings (partner_id, user_id, overall_score, traffic_light, vibe_label, notes, ai_explanation) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        partner_id,
        req.user.userId,
        calculated.overallScore,
        calculated.trafficLight,
        calculated.vibeLabel,
        notes || null,
        aiExplanation
      );

    const ratingId = ratingResult.lastInsertRowid;

    // Insert individual scores
    const insertScore = db.prepare(
      'INSERT INTO rating_scores (rating_id, criterion_id, score, criterion_name, criterion_tier) VALUES (?, ?, ?, ?, ?)'
    );

    const transaction = db.transaction((scoresList: CriterionScore[]) => {
      for (const score of scoresList) {
        insertScore.run(
          ratingId,
          score.criterionId,
          score.score,
          score.criterionName,
          score.tier
        );
      }
    });

    transaction(scores);

    // Get complete rating with scores
    const rating = db
      .prepare('SELECT * FROM ratings WHERE id = ?')
      .get(ratingId) as Rating;

    const ratingScores = db
      .prepare('SELECT * FROM rating_scores WHERE rating_id = ?')
      .all(ratingId) as RatingScore[];

    res.status(201).json({
      rating: {
        ...rating,
        scores: ratingScores,
      },
    });
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({ error: 'Failed to create rating' });
  }
}

export async function getRatingHistory(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { partnerId } = req.params;
  const db = getDb();

  try {
    // Verify partner ownership
    const partner = db
      .prepare('SELECT * FROM partners WHERE id = ? AND user_id = ?')
      .get(partnerId, req.user.userId);

    if (!partner) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }

    // Get all ratings for this partner
    const ratings = db
      .prepare('SELECT * FROM ratings WHERE partner_id = ? ORDER BY created_at DESC')
      .all(partnerId) as Rating[];

    // Get scores for each rating
    const ratingsWithScores = ratings.map((rating) => {
      const scores = db
        .prepare('SELECT * FROM rating_scores WHERE rating_id = ?')
        .all(rating.id) as RatingScore[];

      return {
        ...rating,
        scores,
      };
    });

    res.json({ ratings: ratingsWithScores });
  } catch (error) {
    console.error('Get rating history error:', error);
    res.status(500).json({ error: 'Failed to get rating history' });
  }
}

export async function getLatestRating(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { partnerId } = req.params;
  const db = getDb();

  try {
    // Verify partner ownership
    const partner = db
      .prepare('SELECT * FROM partners WHERE id = ? AND user_id = ?')
      .get(partnerId, req.user.userId);

    if (!partner) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }

    // Get latest rating
    const rating = db
      .prepare(
        'SELECT * FROM ratings WHERE partner_id = ? ORDER BY created_at DESC LIMIT 1'
      )
      .get(partnerId) as Rating | undefined;

    if (!rating) {
      res.status(404).json({ error: 'No ratings found' });
      return;
    }

    // Get scores
    const scores = db
      .prepare('SELECT * FROM rating_scores WHERE rating_id = ?')
      .all(rating.id) as RatingScore[];

    res.json({
      rating: {
        ...rating,
        scores,
      },
    });
  } catch (error) {
    console.error('Get latest rating error:', error);
    res.status(500).json({ error: 'Failed to get latest rating' });
  }
}
