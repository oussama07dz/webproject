import { useState, useEffect } from 'react';
import { answers } from '../services/api';

const MyAnswers = () => {
  const [myAnswers, setMyAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMyAnswers();
  }, []);

  const fetchMyAnswers = async () => {
    try {
      const res = await answers.getMyAnswers();
      setMyAnswers(res.data);
    } catch (err) {
      console.error('Error fetching answers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnswers = myAnswers.filter(a => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-approved">Approuvé</span>;
      case 'rejected':
        return <span className="badge badge-rejected">Rejeté</span>;
      default:
        return <span className="badge badge-pending">En attente</span>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mes Réponses</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Tous ({myAnswers.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
        >
          En attente ({myAnswers.filter(a => a.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`btn ${filter === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Approuvés ({myAnswers.filter(a => a.status === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`btn ${filter === 'rejected' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Rejetés ({myAnswers.filter(a => a.status === 'rejected').length})
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Question</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Domaine</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Réponse</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAnswers.map(answer => (
              <tr key={answer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{answer.question_code}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{answer.question_text}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  D{answer.domain_number} - {answer.champ_code}
                </td>
                <td className="px-6 py-4">
                  {answer.answer === true && <span className="text-green-600 font-medium">Oui</span>}
                  {answer.answer === false && <span className="text-red-600 font-medium">Non</span>}
                  {answer.answer === null && <span className="text-gray-400">Non répondu</span>}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(answer.status)}
                  {answer.admin_comment && (
                    <p className="text-xs text-red-600 mt-1 max-w-xs">{answer.admin_comment}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(answer.created_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAnswers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucune réponse trouvée
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAnswers;
