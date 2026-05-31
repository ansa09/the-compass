import getDb from '../database/db.js';
import { generateCompatibilityExplanation } from '../services/aiService.js';
import { Rating, RatingScore, Partner } from '../types/index.js';

async function regenerateAllExplanations() {
  const db = getDb();

  try {
    console.log('🔄 Starting to regenerate AI explanations for all ratings...\n');

    // Get all ratings
    const ratings = db.prepare('SELECT * FROM ratings ORDER BY created_at DESC').all() as Rating[];

    console.log(`Found ${ratings.length} ratings to process.\n`);

    let updated = 0;
    let failed = 0;

    for (const rating of ratings) {
      try {
        // Get partner info
        const partner = db
          .prepare('SELECT * FROM partners WHERE id = ?')
          .get(rating.partner_id) as Partner;

        if (!partner) {
          console.log(`⚠️  Skipping rating ${rating.id} - partner not found`);
          failed++;
          continue;
        }

        // Get rating scores
        const scores = db
          .prepare('SELECT * FROM rating_scores WHERE rating_id = ?')
          .all(rating.id) as RatingScore[];

        if (scores.length === 0) {
          console.log(`⚠️  Skipping rating ${rating.id} - no scores found`);
          failed++;
          continue;
        }

        // Transform scores to the format expected by AI service
        const criterionScores = scores.map((s) => ({
          criterionId: s.criterion_id,
          score: s.score,
          criterionName: s.criterion_name,
          tier: s.criterion_tier,
        }));

        console.log(`Processing rating ${rating.id} for ${partner.first_name}...`);

        // Generate new explanation
        const newExplanation = await generateCompatibilityExplanation(
          partner.first_name,
          rating.overall_score,
          rating.traffic_light,
          criterionScores,
          rating.notes || undefined,
          partner.dates_count || 0
        );

        // Update the rating
        db.prepare('UPDATE ratings SET ai_explanation = ? WHERE id = ?').run(
          newExplanation,
          rating.id
        );

        console.log(`✓ Updated rating ${rating.id}\n`);
        updated++;
      } catch (error) {
        console.error(`✗ Failed to process rating ${rating.id}:`, error);
        failed++;
      }
    }

    console.log('\n✨ Regeneration complete!');
    console.log(`   Updated: ${updated}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${ratings.length}`);
  } catch (error) {
    console.error('Error regenerating explanations:', error);
    process.exit(1);
  }
}

regenerateAllExplanations();
