import bcrypt from 'bcryptjs';
import getDb from './db.js';

async function seed() {
  console.log('🌱 Seeding database...\n');

  const db = getDb();

  try {
    // Create demo user
    const passwordHash = bcrypt.hashSync('demo1234', 10);

    const insertUser = db.prepare(`
      INSERT INTO users (email, password_hash, name, has_completed_onboarding, default_reminder_threshold)
      VALUES (?, ?, ?, ?, ?)
    `);

    const userResult = insertUser.run(
      'demo@compass.app',
      passwordHash,
      'Demo User',
      1, // has completed onboarding
      3  // remind after 3 dates
    );

    const userId = userResult.lastInsertRowid;
    console.log('✓ Created demo user: demo@compass.app (password: demo1234)');

    // Create sample criteria for demo user
    const criteriaData = [
      { name: 'Emotional Intelligence', description: 'Ability to understand and communicate feelings', tier: 'dealbreaker', order: 1 },
      { name: 'Physical Chemistry', description: 'Physical attraction and spark', tier: 'dealbreaker', order: 2 },
      { name: 'Shared Values', description: 'Alignment on core life values and beliefs', tier: 'dealbreaker', order: 3 },
      { name: 'Communication Style', description: 'How openly and effectively they communicate', tier: 'important', order: 4 },
      { name: 'Ambition & Drive', description: 'Career focus and personal goals', tier: 'important', order: 5 },
      { name: 'Sense of Humor', description: 'Ability to laugh and have fun together', tier: 'important', order: 6 },
      { name: 'Lifestyle Compatibility', description: 'Daily routines and lifestyle preferences', tier: 'important', order: 7 },
      { name: 'Family Values', description: 'Views on family and future plans', tier: 'important', order: 8 },
      { name: 'Physical Health', description: 'Commitment to health and fitness', tier: 'nice-to-have', order: 9 },
      { name: 'Shared Hobbies', description: 'Common interests and activities', tier: 'nice-to-have', order: 10 },
      { name: 'Financial Stability', description: 'Responsibility with money and finances', tier: 'nice-to-have', order: 11 },
      { name: 'Intellectual Curiosity', description: 'Interest in learning and growth', tier: 'nice-to-have', order: 12 },
    ];

    const insertCriterion = db.prepare(`
      INSERT INTO criteria (user_id, name, description, tier, display_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const criterion of criteriaData) {
      insertCriterion.run(userId, criterion.name, criterion.description, criterion.tier, criterion.order);
    }

    console.log(`✓ Created ${criteriaData.length} sample criteria`);

    // Create sample onboarding responses
    const onboardingData = [
      { q: 1, text: 'Think of someone you deeply admired — what quality stood out most?', answer: 'Their ability to really listen and understand how I feel.' },
      { q: 2, text: 'What\'s a value that is non-negotiable for you in a relationship?', answer: 'Honesty and emotional openness. I need someone I can be vulnerable with.' },
      { q: 3, text: 'How important is physical attraction versus emotional connection to you?', answer: 'Both are essential - I need chemistry but also deep connection.' },
      { q: 4, text: 'What lifestyle factors matter most — career ambition, family focus, adventure, stability?', answer: 'Balance of ambition and stability. Someone driven but grounded.' },
      { q: 5, text: 'How do you feel about someone who shares your hobbies vs complements you?', answer: 'Some overlap would be nice but complementing is fine too.' },
      { q: 6, text: 'What communication style do you need from a partner?', answer: 'Direct and honest, but also warm and considerate.' },
      { q: 7, text: 'How important is shared humour and playfulness?', answer: 'Very important - I need to laugh and have fun together.' },
      { q: 8, text: 'What role does physical health/fitness play in your ideal partner?', answer: 'Some awareness of health is good but not a dealbreaker.' },
      { q: 9, text: 'How much does financial stability or ambition matter to you?', answer: 'They should be responsible but don\'t need to be wealthy.' },
      { q: 10, text: 'What has been a recurring dealbreaker in past relationships?', answer: 'Lack of emotional awareness and poor communication.' }
    ];

    const insertResponse = db.prepare(`
      INSERT INTO onboarding_responses (user_id, question_number, question_text, answer)
      VALUES (?, ?, ?, ?)
    `);

    for (const response of onboardingData) {
      insertResponse.run(userId, response.q, response.text, response.answer);
    }

    console.log(`✓ Created ${onboardingData.length} onboarding responses`);

    // Create a sample partner with rating
    const insertPartner = db.prepare(`
      INSERT INTO partners (user_id, first_name, date_first_met, status, dates_count, reminder_threshold)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const partnerResult = insertPartner.run(
      userId,
      'Alex',
      '2024-11-15',
      'active',
      5,
      3
    );

    const partnerId = partnerResult.lastInsertRowid;
    console.log('✓ Created sample partner: Alex');

    // Create a rating for Alex
    const insertRating = db.prepare(`
      INSERT INTO ratings (partner_id, user_id, overall_score, traffic_light, vibe_label, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const ratingResult = insertRating.run(
      partnerId,
      userId,
      78.5,
      'amber',
      'Promising, keep exploring 🌱',
      'Really enjoying getting to know them, but want to see how communication evolves.'
    );

    const ratingId = ratingResult.lastInsertRowid;

    // Create individual criterion scores for this rating
    const criteriaList = db.prepare('SELECT id, name, tier FROM criteria WHERE user_id = ?').all(userId);

    const sampleScores = [9, 8, 7, 8, 7, 9, 7, 6, 6, 5, 7, 8]; // scores for each criterion

    const insertScore = db.prepare(`
      INSERT INTO rating_scores (rating_id, criterion_id, score, criterion_name, criterion_tier)
      VALUES (?, ?, ?, ?, ?)
    `);

    criteriaList.forEach((criterion: any, index: number) => {
      insertScore.run(
        ratingId,
        criterion.id,
        sampleScores[index] || 7,
        criterion.name,
        criterion.tier
      );
    });

    console.log('✓ Created sample rating with scores');

    // Create a sample journal entry
    const insertJournal = db.prepare(`
      INSERT INTO journal_entries (partner_id, user_id, content, mood)
      VALUES (?, ?, ?, ?)
    `);

    insertJournal.run(
      partnerId,
      userId,
      'Had our fifth date today - went to that new Italian place downtown. Conversation flowed really naturally and there were some genuinely sweet moments. I\'m noticing they\'re really attentive and remember little things I mention. Still getting to know them but feeling cautiously optimistic.',
      'hopeful'
    );

    console.log('✓ Created sample journal entry');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('You can now log in with:');
    console.log('  Email: demo@compass.app');
    console.log('  Password: demo1234\n');
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      console.log('\n⚠️  Demo user already exists - skipping seed');
      console.log('To reseed, delete database.sqlite and run migrations again.\n');
    } else {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    }
  }
}

seed();
