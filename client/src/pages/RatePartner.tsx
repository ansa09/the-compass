import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { partnersApi, criteriaApi, ratingsApi } from '../services/api';
import { Partner, Criterion } from '../types';

export default function RatePartner() {
  const { id } = useParams<{ id: string }>();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      const [partnerRes, criteriaRes]: any = await Promise.all([
        partnersApi.get(Number(id)),
        criteriaApi.getAll(),
      ]);

      setPartner(partnerRes.partner);
      setCriteria(criteriaRes.criteria);

      // Initialize scores at 5 (middle value)
      const initialScores: Record<number, number> = {};
      criteriaRes.criteria.forEach((c: Criterion) => {
        initialScores[c.id] = 5;
      });
      setScores(initialScores);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (criterionId: number, score: number) => {
    setScores({ ...scores, [criterionId]: score });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);

    try {
      const ratingScores = criteria.map((c) => ({
        criterionId: c.id,
        criterionName: c.name,
        tier: c.tier,
        score: scores[c.id],
      }));

      await ratingsApi.create({
        partner_id: Number(id),
        scores: ratingScores,
        notes: notes || undefined,
      });

      navigate(`/partner/${id}`);
    } catch (error) {
      console.error('Failed to save rating:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!partner) {
    return <div className="min-h-screen flex items-center justify-center">Partner not found</div>;
  }

  const groupedCriteria = {
    dealbreaker: criteria.filter((c) => c.tier === 'dealbreaker'),
    important: criteria.filter((c) => c.tier === 'important'),
    'nice-to-have': criteria.filter((c) => c.tier === 'nice-to-have'),
  };

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="bg-white border-b border-warm-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button onClick={() => navigate(`/partner/${id}`)} className="text-navy-600 hover:text-navy-800 mb-2">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-navy-800">Rate {partner.first_name}</h1>
          <p className="text-navy-600">How do they measure up on your criteria?</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dealbreakers */}
          {groupedCriteria.dealbreaker.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-rose-600 mb-4">Dealbreakers</h2>
              <div className="space-y-6">
                {groupedCriteria.dealbreaker.map((criterion) => (
                  <CriterionRating
                    key={criterion.id}
                    criterion={criterion}
                    score={scores[criterion.id]}
                    onChange={(score) => handleScoreChange(criterion.id, score)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Important */}
          {groupedCriteria.important.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-navy-600 mb-4">Important</h2>
              <div className="space-y-6">
                {groupedCriteria.important.map((criterion) => (
                  <CriterionRating
                    key={criterion.id}
                    criterion={criterion}
                    score={scores[criterion.id]}
                    onChange={(score) => handleScoreChange(criterion.id, score)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Nice-to-have */}
          {groupedCriteria['nice-to-have'].length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-warm-600 mb-4">Nice-to-Have</h2>
              <div className="space-y-6">
                {groupedCriteria['nice-to-have'].map((criterion) => (
                  <CriterionRating
                    key={criterion.id}
                    criterion={criterion}
                    score={scores[criterion.id]}
                    onChange={(score) => handleScoreChange(criterion.id, score)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Notes / Feelings */}
          <div className="card bg-gradient-to-br from-rose-50 to-warm-50 border-rose-200">
            <label htmlFor="notes" className="label text-rose-700">
              Your Feelings & Reflections
            </label>
            <p className="text-sm text-navy-600 mb-3">
              How do you feel about them? What stands out? Your reflections will help generate a personalized compatibility explanation.
            </p>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input min-h-[120px]"
              placeholder="e.g., 'They make me laugh and I feel comfortable around them, but I'm not sure if we want the same things long-term...'"
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(`/partner/${id}`)} className="btn btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn btn-primary flex-1">
              {isSaving ? 'Saving...' : 'Save Rating'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function CriterionRating({
  criterion,
  score,
  onChange,
}: {
  criterion: Criterion;
  score: number;
  onChange: (score: number) => void;
}) {
  return (
    <div>
      <div className="mb-2">
        <h3 className="font-semibold text-navy-800">{criterion.name}</h3>
        {criterion.description && <p className="text-sm text-navy-600">{criterion.description}</p>}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-navy-500 w-8">1</span>
        <input
          type="range"
          min="1"
          max="10"
          value={score}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-warm-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
        />
        <span className="text-sm text-navy-500 w-8">10</span>
        <span className="text-lg font-bold text-rose-500 w-12 text-right">{score}</span>
      </div>
    </div>
  );
}
