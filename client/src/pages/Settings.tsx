import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { criteriaApi } from '../services/api';
import { Criterion } from '../types';

export default function Settings() {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCriteria();
  }, []);

  const loadCriteria = async () => {
    try {
      const response: any = await criteriaApi.getAll();
      setCriteria(response.criteria);
    } catch (error) {
      console.error('Failed to load criteria:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCriterion = (index: number, field: keyof Criterion, value: any) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const saveCriteria = async () => {
    setIsSaving(true);
    try {
      await criteriaApi.bulkUpdate(criteria);
      navigate('/');
    } catch (error) {
      console.error('Failed to save criteria:', error);
      alert('Failed to save criteria');
      setIsSaving(false);
    }
  };

  const addNewCriterion = async () => {
    try {
      const newCriterion = {
        name: 'New Criterion',
        description: '',
        tier: 'nice-to-have',
        display_order: criteria.length + 1,
      };

      const response: any = await criteriaApi.create(newCriterion);
      setCriteria([...criteria, response.criterion]);
    } catch (error) {
      console.error('Failed to add criterion:', error);
      alert('Failed to add criterion');
    }
  };

  const deleteCriterion = async (id: number) => {
    if (!confirm('Are you sure you want to delete this criterion? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(id);
    try {
      await criteriaApi.delete(id);
      setCriteria(criteria.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Failed to delete criterion:', error);
      alert('Failed to delete criterion. It may be used in existing ratings.');
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="bg-white border-b border-warm-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button onClick={() => navigate('/')} className="text-navy-600 hover:text-navy-800 mb-2">
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-navy-800">Settings</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="card">
            <h2 className="text-xl font-semibold text-navy-800 mb-4">Profile</h2>
            <div className="space-y-3">
              <div>
                <span className="label">Name</span>
                <p className="text-navy-700">{user?.name || 'Not set'}</p>
              </div>
              <div>
                <span className="label">Email</span>
                <p className="text-navy-700">{user?.email}</p>
              </div>
              <div>
                <span className="label">Default Re-rating Reminder</span>
                <p className="text-navy-700">After {user?.default_reminder_threshold} dates</p>
              </div>
            </div>
          </div>

          {/* Criteria Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-navy-800">Your Criteria</h2>
              <button onClick={addNewCriterion} className="btn btn-outline text-sm">
                + Add Criterion
              </button>
            </div>
            <p className="text-sm text-navy-600 mb-4">
              Edit your rating criteria. Changes will apply to future ratings.
            </p>

            <div className="space-y-4">
              {criteria.map((criterion, index) => (
                <div key={criterion.id} className="p-4 border border-warm-300 rounded-xl relative">
                  <button
                    onClick={() => deleteCriterion(criterion.id)}
                    disabled={isDeleting === criterion.id}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-lg"
                    title="Delete criterion"
                  >
                    {isDeleting === criterion.id ? '⌛' : '🗑️'}
                  </button>

                  <input
                    type="text"
                    value={criterion.name}
                    onChange={(e) => updateCriterion(index, 'name', e.target.value)}
                    className="input mb-2"
                    placeholder="Criterion name"
                  />
                  <textarea
                    value={criterion.description || ''}
                    onChange={(e) => updateCriterion(index, 'description', e.target.value)}
                    className="input mb-2"
                    placeholder="Description"
                    rows={2}
                  />
                  <select
                    value={criterion.tier}
                    onChange={(e) => updateCriterion(index, 'tier', e.target.value)}
                    className="input"
                  >
                    <option value="dealbreaker">Dealbreaker</option>
                    <option value="important">Important</option>
                    <option value="nice-to-have">Nice-to-have</option>
                  </select>
                </div>
              ))}
            </div>

            <button onClick={saveCriteria} disabled={isSaving} className="btn btn-primary w-full mt-6">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
