import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin, stats } from '../services/api';

const AdminDashboard = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pendingRes, statsRes] = await Promise.all([
        admin.getPending(),
        stats.getOverview(new Date().getFullYear())
      ]);
      setPendingCount(pendingRes.data.length);
      setOverview(statsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Link to="/admin/review" className="card hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500">En attente de révision</p>
          <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
        </Link>
        <div className="card">
          <p className="text-sm text-gray-500">Total utilisateurs</p>
          <p className="text-3xl font-bold text-gray-900">
            {overview?.totals?.approved_count + overview?.totals?.rejected_count || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Approuvés</p>
          <p className="text-3xl font-bold text-green-600">{overview?.totals?.approved_count || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Rejetés</p>
          <p className="text-3xl font-bold text-red-600">{overview?.totals?.rejected_count || 0}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Link to="/admin/review" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Révisions</h3>
              <p className="text-sm text-gray-500">Voir les réponses en attente</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/users" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Utilisateurs</h3>
              <p className="text-sm text-gray-500">Gérer les utilisateurs</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/structures" className="card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Structures</h3>
              <p className="text-sm text-gray-500">Gérer domaines, champs, questions</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
