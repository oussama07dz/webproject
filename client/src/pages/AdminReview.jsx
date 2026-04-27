import { useState, useEffect } from 'react';
import { admin } from '../services/api';

const AdminReview = () => {
  const [pending, setPending] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [adminComment, setAdminComment] = useState('');

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await admin.getPending();
      setPending(res.data);
    } catch (err) {
      console.error('Error fetching pending:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = async (id) => {
    try {
      const res = await admin.getAnswer(id);
      setSelectedAnswer(res.data);
      setAdminComment('');
    } catch (err) {
      console.error('Error fetching answer:', err);
    }
  };

  const handleReview = async (status) => {
    if (status === 'rejected' && !adminComment.trim()) {
      alert('Veuillez fournir un motif de rejet');
      return;
    }

    setReviewing(true);
    try {
      await admin.review(selectedAnswer.id, {
        status,
        admin_comment: adminComment
      });
      setSelectedAnswer(null);
      fetchPending();
    } catch (err) {
      console.error('Error reviewing:', err);
      alert('Erreur lors de la révision');
    } finally {
      setReviewing(false);
    }
  };

  const handleDownload = (fileId) => {
    window.open(`/api/uploads/${fileId}/download`, '_blank');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Révisions en attente</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold mb-4">Réponses en attente ({pending.length})</h2>
          <div className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune réponse en attente</p>
            ) : (
              pending.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleSelectAnswer(item.id)}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedAnswer?.id === item.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.question_code}</p>
                      <p className="text-sm text-gray-500">{item.username} ({item.user_role})</p>
                    </div>
                    <span className="badge badge-pending">En attente</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.question_text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`font-medium ${item.answer ? 'text-green-600' : 'text-red-600'}`}>
                      {item.answer ? 'Oui' : 'Non'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">
            {selectedAnswer ? 'Détails de la réponse' : 'Sélectionnez une réponse'}
          </h2>
          
          {!selectedAnswer ? (
            <div className="text-center py-12 text-gray-500">
              Cliquez sur une réponse pour voir les détails
            </div>
          ) : (
            <div>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Question</p>
                <p className="font-medium">{selectedAnswer.question_text}</p>
                <p className="text-sm text-gray-500 mt-2">Domaine {selectedAnswer.domain_number} - {selectedAnswer.champ_code} - {selectedAnswer.ref_code}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Utilisateur</p>
                <p className="font-medium">{selectedAnswer.username} ({selectedAnswer.user_role})</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Réponse</p>
                <p className={`font-medium ${selectedAnswer.answer ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedAnswer.answer ? 'Oui' : 'Non'}
                </p>
              </div>

              {selectedAnswer.comment && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Commentaire</p>
                  <p className="text-gray-700">{selectedAnswer.comment}</p>
                </div>
              )}

              {selectedAnswer.proofs && selectedAnswer.proofs.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Preuves attendues</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {selectedAnswer.proofs.map(proof => (
                      <li key={proof.id}>{proof.proof_text}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAnswer.uploads && selectedAnswer.uploads.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Fichiers téléchargés</p>
                  <div className="space-y-2">
                    {selectedAnswer.uploads.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm">{file.original_name}</span>
                        </div>
                        <button
                          onClick={() => handleDownload(file.id)}
                          className="text-primary-600 hover:text-primary-800 text-sm"
                        >
                          Télécharger
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif de rejet (obligatoire si rejeté)
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  className="input h-24 resize-none"
                  placeholder="Expliquez pourquoi la réponse est rejetée..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleReview('approved')}
                  disabled={reviewing}
                  className="btn btn-success flex-1"
                >
                  {reviewing ? '...' : 'Approuver'}
                </button>
                <button
                  onClick={() => handleReview('rejected')}
                  disabled={reviewing}
                  className="btn btn-danger flex-1"
                >
                  {reviewing ? '...' : 'Rejeter'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReview;
