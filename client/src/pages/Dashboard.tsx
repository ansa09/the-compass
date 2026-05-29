import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { partnersApi } from '../services/api';
import { Partner } from '../types';

export default function Dashboard() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const response: any = await partnersApi.getAll();
      setPartners(response.partners);
    } catch (error) {
      console.error('Failed to load partners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) return;

    try {
      await partnersApi.create({ first_name: newPartnerName, status: 'active' });
      setNewPartnerName('');
      setShowAddModal(false);
      loadPartners();
    } catch (error) {
      console.error('Failed to add partner:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 65) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (score >= 40) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Header */}
      <header className="bg-white border-b border-warm-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gradient">The Compass</h1>
              <p className="text-sm text-navy-600">Welcome back, {user?.name || 'there'}</p>
            </div>
            <div className="flex gap-3">
              <Link to="/settings" className="btn btn-outline">
                Settings
              </Link>
              <button onClick={logout} className="btn btn-secondary">
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Add Partner Button */}
        <div className="mb-6">
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            + Add Someone New
          </button>
        </div>

        {/* Partners Grid */}
        {partners.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-lg text-navy-600 mb-4">You haven't added anyone yet</p>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              Add Your First Person
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner) => (
              <Link
                key={partner.id}
                to={`/partner/${partner.id}`}
                className="card hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-navy-800">{partner.first_name}</h3>
                    <p className="text-sm text-navy-500">
                      {partner.dates_count} {partner.dates_count === 1 ? 'date' : 'dates'}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      partner.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : partner.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {partner.status}
                  </span>
                </div>

                {partner.latest_rating && (
                  <div className={`p-3 rounded-xl border ${getScoreColor(partner.latest_rating.overall_score)}`}>
                    <div className="text-2xl font-bold mb-1">
                      {Math.round(partner.latest_rating.overall_score)}%
                    </div>
                    <div className="text-sm">{partner.latest_rating.vibe_label}</div>
                  </div>
                )}

                {!partner.latest_rating && (
                  <div className="p-3 rounded-xl border border-warm-300 bg-warm-100 text-center">
                    <p className="text-sm text-navy-600">Not yet rated</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h2 className="text-xl font-semibold text-navy-800 mb-4">Add Someone New</h2>
            <form onSubmit={handleAddPartner}>
              <input
                type="text"
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value)}
                className="input mb-4"
                placeholder="First name"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
