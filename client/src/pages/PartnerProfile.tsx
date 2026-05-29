import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { partnersApi, ratingsApi, journalApi } from '../services/api';
import { Partner, Rating, JournalEntry } from '../types';
import HeartChart from '../components/HeartChart';

export default function PartnerProfile() {
  const { id } = useParams<{ id: string }>();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'journal'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDates, setEditedDates] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      const [partnerRes, ratingsRes, journalRes]: any = await Promise.all([
        partnersApi.get(Number(id)),
        ratingsApi.getHistory(Number(id)),
        journalApi.getAll(Number(id)),
      ]);

      setPartner(partnerRes.partner);
      setRatings(ratingsRes.ratings || []);
      setJournal(journalRes.entries || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const incrementDates = async () => {
    if (!id) return;
    try {
      await partnersApi.incrementDates(Number(id));
      loadData();
    } catch (error) {
      console.error('Failed to increment dates:', error);
    }
  };

  const startEditingName = () => {
    if (partner) {
      setEditedName(partner.first_name);
      setIsEditingName(true);
    }
  };

  const savePartnerName = async () => {
    if (!id || !editedName.trim()) return;
    try {
      await partnersApi.update(Number(id), { first_name: editedName.trim() });
      setIsEditingName(false);
      loadData();
    } catch (error) {
      console.error('Failed to update partner name:', error);
    }
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const startEditingDates = () => {
    if (partner) {
      setEditedDates(partner.dates_count);
      setIsEditingDates(true);
    }
  };

  const savePartnerDates = async () => {
    if (!id || editedDates < 0) return;
    try {
      await partnersApi.update(Number(id), { dates_count: editedDates });
      setIsEditingDates(false);
      loadData();
    } catch (error) {
      console.error('Failed to update dates count:', error);
    }
  };

  const cancelEditingDates = () => {
    setIsEditingDates(false);
    setEditedDates(0);
  };

  const latestRating = ratings[0];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!partner) {
    return <div className="min-h-screen flex items-center justify-center">Partner not found</div>;
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="bg-white border-b border-warm-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button onClick={() => navigate('/')} className="text-navy-600 hover:text-navy-800 mb-2">
            ← Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {/* Name editing */}
              {isEditingName ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-3xl font-bold text-navy-800 border-b-2 border-rose-500 focus:outline-none bg-transparent"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') savePartnerName();
                      if (e.key === 'Escape') cancelEditingName();
                    }}
                  />
                  <button onClick={savePartnerName} className="text-green-600 hover:text-green-700 text-sm">
                    ✓ Save
                  </button>
                  <button onClick={cancelEditingName} className="text-gray-600 hover:text-gray-700 text-sm">
                    ✗ Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-navy-800">{partner.first_name}</h1>
                  <button
                    onClick={startEditingName}
                    className="text-navy-400 hover:text-navy-600 text-sm"
                    title="Edit name"
                  >
                    ✎
                  </button>
                </div>
              )}

              {/* Dates count editing */}
              {isEditingDates ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={editedDates}
                    onChange={(e) => setEditedDates(parseInt(e.target.value) || 0)}
                    className="w-20 text-navy-600 border-b-2 border-rose-500 focus:outline-none bg-transparent"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') savePartnerDates();
                      if (e.key === 'Escape') cancelEditingDates();
                    }}
                  />
                  <span className="text-navy-600">
                    {editedDates === 1 ? 'date' : 'dates'}
                  </span>
                  <button onClick={savePartnerDates} className="text-green-600 hover:text-green-700 text-sm">
                    ✓
                  </button>
                  <button onClick={cancelEditingDates} className="text-gray-600 hover:text-gray-700 text-sm">
                    ✗
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-navy-600">
                    {partner.dates_count} {partner.dates_count === 1 ? 'date' : 'dates'}
                  </p>
                  <button
                    onClick={startEditingDates}
                    className="text-navy-400 hover:text-navy-600 text-sm"
                    title="Edit dates count"
                  >
                    ✎
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={incrementDates} className="btn btn-outline">
                + Add Date
              </button>
              <Link to={`/partner/${id}/rate`} className="btn btn-primary">
                Rate
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-warm-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 -mb-px ${
              activeTab === 'overview'
                ? 'border-b-2 border-rose-500 text-rose-600 font-medium'
                : 'text-navy-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 -mb-px ${
              activeTab === 'history'
                ? 'border-b-2 border-rose-500 text-rose-600 font-medium'
                : 'text-navy-600'
            }`}
          >
            Rating History
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-4 py-2 -mb-px ${
              activeTab === 'journal'
                ? 'border-b-2 border-rose-500 text-rose-600 font-medium'
                : 'text-navy-600'
            }`}
          >
            Journal
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {latestRating ? (
              <>
                <div className="card">
                  <h2 className="text-xl font-semibold text-navy-800 mb-4">Compatibility Score</h2>
                  <div className="text-center py-6">
                    <div className="text-6xl font-bold text-rose-500 mb-2">
                      {Math.round(latestRating.overall_score)}%
                    </div>
                    <div className="text-lg text-navy-700 mb-4">{latestRating.vibe_label}</div>

                    {/* AI-generated explanation */}
                    {latestRating.ai_explanation && (
                      <div className="mt-6 p-4 bg-gradient-to-br from-rose-50 to-warm-50 rounded-xl border border-rose-200 text-left">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-rose-500 text-xl">✨</span>
                          <h3 className="font-semibold text-navy-800">Why this score?</h3>
                        </div>
                        <p className="text-navy-700 leading-relaxed">{latestRating.ai_explanation}</p>
                      </div>
                    )}

                    {latestRating.notes && (
                      <div className="mt-4 p-4 bg-warm-100 rounded-xl text-left">
                        <p className="text-sm font-medium text-navy-600 mb-1">Your feelings:</p>
                        <p className="text-navy-700 italic">{latestRating.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <h2 className="text-xl font-semibold text-navy-800 mb-6 text-center">How Full Is Your Heart?</h2>
                  {latestRating.scores && latestRating.scores.length > 0 && (
                    <HeartChart scores={latestRating.scores} />
                  )}
                </div>
              </>
            ) : (
              <div className="card text-center py-12">
                <p className="text-lg text-navy-600 mb-4">No ratings yet</p>
                <Link to={`/partner/${id}/rate`} className="btn btn-primary">
                  Create First Rating
                </Link>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {ratings.length > 0 ? (
              ratings.map((rating) => (
                <div key={rating.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-navy-500">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-2xl font-bold text-rose-500">
                      {Math.round(rating.overall_score)}%
                    </span>
                  </div>
                  <p className="text-navy-700">{rating.vibe_label}</p>
                  {rating.notes && <p className="mt-2 text-sm text-navy-600 italic">{rating.notes}</p>}
                </div>
              ))
            ) : (
              <div className="card text-center py-12">
                <p className="text-navy-600">No rating history yet</p>
              </div>
            )}
          </div>
        )}

        {/* Journal Tab */}
        {activeTab === 'journal' && (
          <div className="space-y-4">
            <Link to={`/partner/${id}/journal/new`} className="btn btn-primary w-full">
              + New Journal Entry
            </Link>
            {journal.length > 0 ? (
              journal.map((entry) => (
                <div key={entry.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-navy-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                    {entry.mood && (
                      <span className="px-3 py-1 rounded-full text-xs bg-warm-200 text-warm-700">
                        {entry.mood}
                      </span>
                    )}
                  </div>
                  <p className="text-navy-700 whitespace-pre-wrap">{entry.content}</p>
                </div>
              ))
            ) : (
              <div className="card text-center py-12">
                <p className="text-navy-600">No journal entries yet</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
