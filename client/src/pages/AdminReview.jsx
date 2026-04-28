import { useState, useEffect } from 'react';
import { admin, uploads } from '../services/api';

const AdminReview = () => {
  const [pending, setPending] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleDownload = async (fileId) => {
    try {
      const response = await uploads.download(fileId);

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Erreur lors du téléchargement. Veuillez réessayer.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  const filteredPending = pending.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase().trim();

    const answerText = item.answer ? 'yes' : 'no';
    const answerTextFr = item.answer ? 'oui' : 'non';

    return (
      (item.user_role && item.user_role.toLowerCase().includes(term)) ||
      (item.ref_code && item.ref_code.toLowerCase().includes(term)) ||
      (item.question_code && item.question_code.toLowerCase().includes(term)) ||
      answerText === term ||
      answerTextFr === term
    );
  });

  return (
    <div className="max-w-[1440px] mx-auto space-y-8">
      <h1 className="font-h1 text-h1 text-on-background">Révisions en attente</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="font-h3 text-h3 text-on-background">Réponses en attente ({filteredPending.length})</h2>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#016e1c] focus:border-transparent outline-none transition-all"
                placeholder="Rôle, réf, oui/non..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-3">
            {filteredPending.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune réponse en attente</p>
            ) : (
              filteredPending.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleSelectAnswer(item.id)}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${selectedAnswer?.id === item.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
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

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="font-h3 text-h3 text-on-background mb-6">
            {selectedAnswer ? 'Détails de la réponse' : 'Sélectionnez une réponse'}
          </h2>

          {!selectedAnswer ? (
            <div className="text-center py-12 text-gray-500">
              Cliquez sur une réponse pour voir les détails
            </div>
          ) : (
            <div>
              <div className="mb-6 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Question</p>
                <p className="font-manrope font-bold text-lg text-on-background">{selectedAnswer.question_text}</p>
                <p className="font-caption text-caption text-on-surface-variant mt-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">label</span>
                  Domaine {selectedAnswer.domain_number} - {selectedAnswer.champ_code} - {selectedAnswer.ref_code}
                </p>
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
