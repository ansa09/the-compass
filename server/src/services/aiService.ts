import { GoogleGenerativeAI } from '@google/generative-ai';
import { CriterionScore } from '../types/index.js';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export async function generateCompatibilityExplanation(
  partnerName: string,
  overallScore: number,
  trafficLight: string,
  scores: CriterionScore[],
  userNotes?: string,
  datesCount: number = 0
): Promise<string> {
  // If no API key, return a fallback explanation
  if (!genAI) {
    return generateFallbackExplanation(overallScore, scores, userNotes, datesCount);
  }

  // Group scores by tier
  const dealbreakers = scores.filter(s => s.tier === 'dealbreaker');
  const important = scores.filter(s => s.tier === 'important');
  const niceToHave = scores.filter(s => s.tier === 'nice-to-have');

  // Build the prompt
  const prompt = `You are a warm, empathetic relationship advisor helping someone reflect on their compatibility with a potential partner named ${partnerName}.

Based on their rating, here are the scores (out of 10) across different criteria:

**Dealbreakers (highest weight):**
${dealbreakers.map(s => `- ${s.criterionName}: ${s.score}/10`).join('\n')}

**Important criteria:**
${important.map(s => `- ${s.criterionName}: ${s.score}/10`).join('\n')}

**Nice-to-have criteria:**
${niceToHave.map(s => `- ${s.criterionName}: ${s.score}/10`).join('\n')}

**Overall compatibility score: ${Math.round(overallScore)}%**
**Number of dates so far: ${datesCount}**

${userNotes ? `**Their personal reflections:** "${userNotes}"` : ''}

Write a thoughtful, warm 3-5 sentence explanation using this structure:

1. Start by identifying specific qualities ${partnerName} has based on their HIGH scores (8+). Say "They have [quality] and [quality], which shows they are [type of person]." For example: "They have strong emotional intelligence and great communication, which shows they are someone who values deep connection."

2. Compare to general patterns: "In people like this, [what this typically means or what to expect]."

3. Consider the number of dates (${datesCount}):
   - If 1-3 dates: It's early days, note that time will reveal more
   - If 4-7 dates: You're getting to know them, patterns are emerging
   - If 8+ dates: You have substantial experience to base this on

4. Address any concerns from LOW scores (below 6) on important criteria or dealbreakers, if any exist.

5. Make a clear overall decision: Is this person a good fit, uncertain, or not a good fit? Factor in both the score AND the number of dates. Be direct but compassionate.

Keep it conversational, emotionally intelligent, and specific. Use actual criterion names and scores to make it personal.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (text && text.length > 0) {
      return text.trim();
    }

    return generateFallbackExplanation(overallScore, scores, userNotes, datesCount);
  } catch (error) {
    console.error('AI generation error:', error);
    return generateFallbackExplanation(overallScore, scores, userNotes, datesCount);
  }
}

function generateFallbackExplanation(
  overallScore: number,
  scores: CriterionScore[],
  userNotes?: string,
  datesCount: number = 0
): string {
  const dealbreakers = scores.filter(s => s.tier === 'dealbreaker');
  const strongScores = scores.filter(s => s.score >= 8).sort((a, b) => b.score - a.score);
  const weakScores = scores.filter(s => (s.score <= 5 && s.tier !== 'nice-to-have')).sort((a, b) => a.score - b.score);

  const avgDealbreaker = dealbreakers.reduce((sum, s) => sum + s.score, 0) / (dealbreakers.length || 1);

  let explanation = '';

  // 1. Start with specific qualities they have
  if (strongScores.length >= 2) {
    explanation += `They have strong ${strongScores[0].criterionName.toLowerCase()} and ${strongScores[1].criterionName.toLowerCase()}, which shows they are someone who `;

    // Infer character based on the strengths
    const strengthNames = strongScores.slice(0, 2).map(s => s.criterionName.toLowerCase()).join(' and ');
    if (strengthNames.includes('emotional') || strengthNames.includes('communication')) {
      explanation += 'values genuine connection and openness. ';
    } else if (strengthNames.includes('ambition') || strengthNames.includes('drive')) {
      explanation += 'is motivated and goal-oriented. ';
    } else if (strengthNames.includes('humor') || strengthNames.includes('fun')) {
      explanation += 'brings lightness and joy to the relationship. ';
    } else {
      explanation += 'brings real strengths to a partnership. ';
    }
  } else if (strongScores.length === 1) {
    explanation += `They have strong ${strongScores[0].criterionName.toLowerCase()}, which is a notable strength. `;
  } else {
    explanation += 'They show potential, though no areas are standing out strongly yet. ';
  }

  // 2. General pattern comparison
  if (strongScores.length > 0 && avgDealbreaker >= 7) {
    explanation += 'In people like this, these qualities often form the foundation for lasting compatibility. ';
  } else if (avgDealbreaker < 6) {
    explanation += 'In people like this, when core values don\'t align strongly, the connection tends to face challenges. ';
  }

  // 3. Consider number of dates
  if (datesCount <= 3) {
    explanation += `With ${datesCount} ${datesCount === 1 ? 'date' : 'dates'} so far, it's still early—time will reveal whether this develops. `;
  } else if (datesCount <= 7) {
    explanation += `After ${datesCount} dates, you're getting a clearer sense of who they are and patterns are emerging. `;
  } else if (datesCount > 7) {
    explanation += `With ${datesCount} dates under your belt, you have substantial experience to trust this assessment. `;
  }

  // 4. Address concerns
  if (weakScores.length > 0) {
    const concerns = weakScores.slice(0, 2).map(s => s.criterionName.toLowerCase());
    if (concerns.length === 1) {
      explanation += `However, ${concerns[0]} is a concern that deserves attention. `;
    } else {
      explanation += `However, areas like ${concerns[0]} and ${concerns[1]} are raising some red flags. `;
    }
  }

  // 5. Clear overall decision factoring in dates AND score
  if (overallScore >= 75 && avgDealbreaker >= 7) {
    if (datesCount >= 5) {
      explanation += `Overall, they're a good fit—the time you've spent together confirms this.`;
    } else {
      explanation += `Overall, they seem like a good fit worth continuing to explore.`;
    }
  } else if (overallScore >= 60) {
    if (datesCount >= 8) {
      explanation += `The fit is moderate—after this many dates, you'd typically know if it were stronger.`;
    } else {
      explanation += `They could be a good fit, but more time together will tell.`;
    }
  } else if (overallScore >= 45) {
    if (datesCount >= 6) {
      explanation += `The fit is uncertain—you've given it a fair chance, trust your instincts.`;
    } else {
      explanation += `The fit is uncertain—give it a bit more time or trust your gut.`;
    }
  } else {
    explanation += `Based on your criteria and what you've experienced so far, this may not be the right fit.`;
  }

  return explanation.trim();
}
