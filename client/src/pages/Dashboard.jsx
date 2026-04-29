import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { evaluation } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const res = await evaluation.getDomains();
      setDomains(res.data);
    } catch (err) {
      console.error('Error fetching domains:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (role) => {
    const roles = {
      recteur: 'Recteur',
      vrpd: 'Vice-Rector Pédagogie',
      vrpg: 'Vice-Rector Recherche',
      vrel: 'Vice-Rector Relations',
      vrplan: 'Vice-Rector Planification',
      sg: 'Secrétaire Général',
      doyen: 'Doyen',
      chef_dep: 'Chef de Département'
    };
    return roles[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span>Chargement...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white-900">Dashboard</h1>
        <p className="text-white-500 mt-1">
          Bienvenue, {getRoleName(user?.role)} - {user?.username}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {domains.map(domain => (
          <div key={domain.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                  Domaine {domain.domain_number}
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{domain.progress_percentage}%</p>
                <p className="text-xs text-gray-500">
                  {domain.answered_questions}/{domain.total_questions} questions
                </p>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {domain.title}
            </h3>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${domain.progress_percentage}%` }}
              ></div>
            </div>

            <div className="space-y-2 mb-4">
              {domain.champs?.map(champ => (
                <div key={champ.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{champ.champ_code}: {champ.title?.substring(0, 30)}...</span>
                  <span className="text-gray-500">{champ.answered_questions}/{champ.total_questions}</span>
                </div>
              ))}
            </div>

            <Link
              to={`/evaluation/${domain.id}`}
              className="w-full bg-[#016e1c] hover:bg-[#0b7320] text-white font-bold py-3 px-4 rounded-lg text-center block transition-colors"
            >
              Commencer l'évaluation
            </Link>
          </div>
        ))}
      </div>

      {domains.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun domaine disponible</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
