import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { evaluation, answers, uploads } from '../services/api';

const Evaluation = () => {
  const { domainId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState('champs');
  const [champs, setChamps] = useState([]);
  const [refs, setRefs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentRef, setCurrentRef] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [domain, setDomain] = useState(null);

  const [answer, setAnswer] = useState(null);
  const [comment, setComment] = useState('');
  const [uploadsList, setUploadsList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchChamps();
  }, [domainId]);

  useEffect(() => {
    if (step === 'questions' && questions.length > 0) {
      loadQuestionData(questions[currentQuestionIndex]);
    }
  }, [step, currentQuestionIndex, questions]);

  const fetchChamps = async () => {
    try {
      const domainRes = await evaluation.getDomains();
      const foundDomain = domainRes.data.find(d => d.id === parseInt(domainId));
      setDomain(foundDomain);
      
      const res = await evaluation.getChamps(domainId);
      setChamps(res.data);
    } catch (err) {
      console.error('Error fetching champs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefs = async (champId) => {
    try {
      const res = await evaluation.getRefs(champId);
      setRefs(res.data);
      setStep('refs');
    } catch (err) {
      console.error('Error fetching refs:', err);
    }
  };

  const fetchQuestions = async (refId, ref) => {
    try {
      const res = await evaluation.getQuestions(refId);
      setQuestions(res.data);
      setCurrentRef(ref);
      setCurrentQuestionIndex(0);
      setStep('questions');
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  const loadQuestionData = (question) => {
    setAnswer(question.user_answer?.answer ?? null);
    setComment(question.user_answer?.comment || '');
    setUploadsList(question.user_answer?.uploads || []);
  };

  const handleSubmitAnswer = async (skip = false) => {
    if (!skip && answer === null) {
      alert('Veuillez sélectionner Oui ou Non');
      return;
    }

    setSaving(true);
    try {
      const question = questions[currentQuestionIndex];
      
      const res = await answers.submit({
        question_id: question.id,
        answer: skip ? null : answer,
        comment: comment || null
      });

      if (!skip && answer === true && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('answer_id', res.data.id);
        await uploads.upload(formData);
      }

      if (selectedFile) {
        setSelectedFile(null);
      }

      const updatedQuestions = await evaluation.getQuestions(currentRef.id);
      setQuestions(updatedQuestions.data);
      
      console.log('Current question index:', currentQuestionIndex);
      console.log('Total questions:', updatedQuestions.data.length);
      console.log('Is last question:', currentQuestionIndex >= updatedQuestions.data.length - 1);
      
      if (currentQuestionIndex < updatedQuestions.data.length - 1) {
        console.log('Advancing to next question');
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        console.log('Calling handleNextRef to return to refs page');
        handleNextRef();
      }
    } catch (err) {
      console.error('Error saving answer:', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextRef = async () => {
    console.log('handleNextRef called - setting step to refs');
    setStep('refs');
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('La taille du fichier ne doit pas dépasser 10MB');
      return;
    }

    if (questions[currentQuestionIndex]?.user_answer?.id) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('answer_id', questions[currentQuestionIndex].user_answer.id);
        const res = await uploads.upload(formData);
        setUploadsList([...uploadsList, res.data]);
        setSelectedFile(null);
      } catch (err) {
        console.error('Error uploading file:', err);
        alert('Erreur lors du téléchargement');
      }
    } else {
      setSelectedFile(file);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await uploads.delete(fileId);
      setUploadsList(uploadsList.filter(u => u.id !== fileId));
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Erreur lors de la suppression');
    }
  };

  const handleDownload = (file) => {
    window.open(`/api/uploads/${file.id}/download`, '_blank');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isApproved = currentQuestion?.user_answer?.status === 'approved';

  return (
    <div>
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/dashboard" className="text-primary-600 hover:underline">Dashboard</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">{domain?.title?.substring(0, 40)}...</span>
          {step === 'refs' && currentRef && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{currentRef.champ_code}</span>
            </>
          )}
          {step === 'questions' && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{currentRef?.ref_code}</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">Question {currentQuestionIndex + 1}/{questions.length}</span>
            </>
          )}
        </nav>
      </div>

      {step === 'champs' && (
        <div>
          <h1 className="text-2xl font-bold mb-6">Sélectionner un Champ</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {champs.map(champ => (
              <div key={champ.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-sm font-medium text-primary-600">{champ.champ_code}</span>
                    <h3 className="font-semibold text-gray-900 mt-1">{champ.title}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{champ.answered_questions}/{champ.total_questions}</p>
                    <p className="text-xs text-gray-500">questions</p>
                  </div>
                </div>
                <button
                  onClick={() => fetchRefs(champ.id)}
                  className="btn btn-primary w-full"
                >
                  Sélectionner
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'refs' && (
        <div>
          <button onClick={() => setStep('champs')} className="mb-4 text-primary-600 hover:underline">
            ← Retour aux champs
          </button>
          <h1 className="text-2xl font-bold mb-6">Sélectionner une Référence</h1>
          <div className="grid gap-4 md:grid-cols-2">
            {refs.map(ref => (
              <div key={ref.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-sm font-medium text-primary-600">{ref.ref_code}</span>
                    <h3 className="font-semibold text-gray-900 mt-1">{ref.title}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{ref.answered_questions}/{ref.total_questions}</p>
                    <p className="text-xs text-gray-500">questions</p>
                  </div>
                </div>
                <button
                  onClick={() => fetchQuestions(ref.id, ref)}
                  className="btn btn-primary w-full"
                >
                  Sélectionner
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'questions' && currentQuestion && (
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setStep('refs')}
              className="text-primary-600 hover:underline"
            >
              ← Retour aux références
            </button>
            <div className="flex gap-2">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full ${
                    idx === currentQuestionIndex 
                      ? 'bg-primary-600' 
                      : questions[idx]?.user_answer?.answer !== null && questions[idx]?.user_answer?.answer !== undefined
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="mb-6">
              <span className="text-sm font-medium text-primary-600">
                {currentRef.ref_code}
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-2">
                {currentQuestion.question_text}
              </h2>
              {currentQuestion.user_answer && (
                <span className={`badge mt-2 ${
                  currentQuestion.user_answer.status === 'approved' ? 'badge-approved' :
                  currentQuestion.user_answer.status === 'rejected' ? 'badge-rejected' :
                  'badge-pending'
                }`}>
                  {currentQuestion.user_answer.status === 'approved' ? 'Approuvé' :
                   currentQuestion.user_answer.status === 'rejected' ? 'Rejeté' : 'En attente'}
                </span>
              )}
              {currentQuestion.user_answer?.admin_comment && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Motif du rejet:</strong> {currentQuestion.user_answer.admin_comment}
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire (optionnel)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isApproved}
                className="input h-24 resize-none"
                placeholder="Ajouter un commentaire..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Réponse
              </label>
              <div className="flex gap-4">
                <label className={`flex items-center gap-2 cursor-pointer ${isApproved ? 'opacity-50' : ''}`}>
                  <input
                    type="radio"
                    name="answer"
                    value="true"
                    checked={answer === true}
                    onChange={() => setAnswer(true)}
                    disabled={isApproved}
                    className="w-5 h-5 text-primary-600"
                  />
                  <span className="font-medium">Oui</span>
                </label>
                <label className={`flex items-center gap-2 cursor-pointer ${isApproved ? 'opacity-50' : ''}`}>
                  <input
                    type="radio"
                    name="answer"
                    value="false"
                    checked={answer === false}
                    onChange={() => setAnswer(false)}
                    disabled={isApproved}
                    className="w-5 h-5 text-primary-600"
                  />
                  <span className="font-medium">Non</span>
                </label>
              </div>
            </div>

            {answer === true && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preuve (si Oui)
                </label>
                {!isApproved && (
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
                  />
                )}
                
                {(uploadsList.length > 0 || selectedFile) && (
                  <div className="mt-3 space-y-2">
                    {uploadsList.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">{file.original_name}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownload(file)}
                            className="text-primary-600 hover:text-primary-800 text-sm"
                          >
                            Télécharger
                          </button>
                          {!isApproved && (
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {selectedFile && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">{selectedFile.name}</span>
                        </div>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="btn btn-secondary"
              >
                ← Précédent
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSubmitAnswer(true)}
                  disabled={saving}
                  className="btn btn-secondary"
                >
                  Passer
                </button>
                <button
                  onClick={() => handleSubmitAnswer(false)}
                  disabled={saving || isApproved}
                  className="btn btn-primary"
                >
                  {saving ? 'Sauvegarde...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Evaluation;
