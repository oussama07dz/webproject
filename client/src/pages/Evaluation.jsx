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

      if (currentQuestionIndex < updatedQuestions.data.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        handleNextRef();
      }
    } catch (err) {
      console.error('Error saving answer:', err);
      const errorMessage = err.response?.data?.details || err.response?.data?.error || 'Erreur lors de la sauvegarde';
      alert(`Erreur: ${errorMessage}`);
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

  const handleDownload = async (file) => {
    try {
      const response = await uploads.download(file.id);

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_name || 'download');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Erreur lors du téléchargement.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <span className="material-symbols-outlined animate-spin text-4xl mr-3">autorenew</span>
        <span className="font-manrope text-xl font-bold">Chargement...</span>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isApproved = currentQuestion?.user_answer?.status === 'approved';

  return (
    <div className="max-w-[1440px] mx-auto space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-3 px-1">
        <nav className="flex items-center gap-3 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
          <Link to="/dashboard" className="hover:text-secondary flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-base">home</span>
            Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="truncate max-w-[200px]">{domain?.title}</span>
          {step !== 'champs' && (
            <>
              <span className="text-slate-300">/</span>
              <button
                onClick={() => setStep('champs')}
                className="hover:text-secondary truncate max-w-[150px] transition-colors"
              >
                {champs.find(c => c.id === refs?.[0]?.champ_id)?.champ_code || 'Champ'}
              </button>
            </>
          )}
        </nav>
      </div>

      {step === 'champs' && (
        <div className="space-y-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-h1 text-h1 text-on-background">Sélectionner un Champ</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Choisissez le domaine de compétence que vous souhaitez évaluer ou renseigner.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {champs.map(champ => (
              <div key={champ.id} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs tracking-widest uppercase">{champ.champ_code}</span>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-base">task</span>
                      <span className="font-bold text-xs">{champ.answered_questions}/{champ.total_questions}</span>
                    </div>
                  </div>
                  <h3 className="font-h3 text-h3 text-on-background mb-2 group-hover:text-secondary transition-colors line-clamp-2">{champ.title}</h3>
                </div>
                <button
                  onClick={() => fetchRefs(champ.id)}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  Ouvrir le Champ
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'refs' && (
        <div className="space-y-8">
          <div className="flex flex-col gap-6">
            <button onClick={() => setStep('champs')} className="flex items-center gap-2 font-label-sm text-label-sm text-secondary hover:underline w-fit">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Retour aux champs
            </button>
            <div className="flex flex-col gap-2">
              <h1 className="font-h1 text-h1 text-on-background">Choix de la Référence</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">Sélectionnez une référence spécifique pour accéder aux briques de questions.</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {refs.map(ref => (
              <div key={ref.id} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-lg transition-all group">
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <span className="px-3 py-1 bg-secondary/10 text-secondary font-bold rounded-lg text-xs tracking-widest uppercase">{ref.ref_code}</span>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-base">assignment</span>
                      <span className="font-bold text-xs">{ref.answered_questions}/{ref.total_questions}</span>
                    </div>
                  </div>
                  <h3 className="font-h3 text-h3 text-on-background line-clamp-2">{ref.title}</h3>
                </div>
                <button
                  onClick={() => fetchQuestions(ref.id, ref)}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  Voir les Questions
                  <span className="material-symbols-outlined text-xl">list_alt</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'questions' && currentQuestion && (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <button
              onClick={() => setStep('refs')}
              className="flex items-center gap-2 font-label-sm text-label-sm text-secondary hover:underline"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Références
            </button>
            <div className="flex gap-3">
              {questions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-10 h-10 rounded-xl font-bold text-xs transition-all ${idx === currentQuestionIndex
                      ? 'bg-slate-900 text-white scale-110 shadow-md ring-2 ring-slate-900 ring-offset-2'
                      : q?.user_answer?.answer !== null && q?.user_answer?.answer !== undefined
                        ? 'bg-secondary text-white'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-[120px]">quiz</span>
            </div>

            <div className="relative z-10 mb-10">
              <span className="px-3 py-1 bg-secondary text-white font-bold rounded-lg text-xs tracking-widest uppercase mb-4 inline-block">
                Question {currentQuestionIndex + 1} de {questions.length} • {currentRef.ref_code}
              </span>
              <h2 className="font-h2 text-4xl text-on-background leading-tight mb-4">
                {currentQuestion.question_text}
              </h2>

              {currentQuestion.user_answer && (
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2 ${currentQuestion.user_answer.status === 'approved' ? 'bg-[#f6ffed] text-[#016e1c] border border-[#b7eb8f]' :
                      currentQuestion.user_answer.status === 'rejected' ? 'bg-[#fff1f0] text-[#cf1322] border border-[#ffa39e]' :
                        'bg-[#fffbe6] text-[#d48806] border border-[#ffe58f]'
                    }`}>
                    <span className="material-symbols-outlined text-base">
                      {currentQuestion.user_answer.status === 'approved' ? 'verified' :
                        currentQuestion.user_answer.status === 'rejected' ? 'cancel' : 'pending'}
                    </span>
                    {currentQuestion.user_answer.status === 'approved' ? 'Approuvé' :
                      currentQuestion.user_answer.status === 'rejected' ? 'Rejeté' : 'En attente'}
                  </span>
                </div>
              )}

              {currentQuestion.user_answer?.admin_comment && (
                <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-2xl flex gap-4">
                  <span className="material-symbols-outlined text-red-600">report</span>
                  <div>
                    <strong className="font-manrope block mb-1">Motif du rejet par l'administration :</strong>
                    <p className="text-red-700 font-body-md text-body-md">{currentQuestion.user_answer.admin_comment}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-8">
              {/* Radio Group */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => !isApproved && setAnswer(true)}
                  className={`p-6 rounded-2xl border-2 flex items-center justify-center gap-4 transition-all ${answer === true
                      ? 'bg-secondary/10 border-secondary text-secondary shadow-inner'
                      : 'border-slate-100 hover:border-secondary/30 text-on-surface-variant'
                    } ${isApproved ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  <span className="material-symbols-outlined text-3xl">{answer === true ? 'radio_button_checked' : 'radio_button_unchecked'}</span>
                  <span className="font-manrope font-bold text-xl uppercase tracking-widest">Oui</span>
                </button>
                <button
                  onClick={() => !isApproved && setAnswer(false)}
                  className={`p-6 rounded-2xl border-2 flex items-center justify-center gap-4 transition-all ${answer === false
                      ? 'bg-red-50 border-red-500 text-red-600 shadow-inner'
                      : 'border-slate-100 hover:border-red-200 text-on-surface-variant'
                    } ${isApproved ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  <span className="material-symbols-outlined text-3xl">{answer === false ? 'radio_button_checked' : 'radio_button_unchecked'}</span>
                  <span className="font-manrope font-bold text-xl uppercase tracking-widest">Non</span>
                </button>
              </div>

              {/* Comment Field */}
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-3 block px-1">
                  Commentaire explicatif
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={isApproved}
                  className="w-full p-6 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-secondary/10 transition-all font-body-md text-body-md h-32 resize-none text-on-background placeholder:text-slate-400"
                  placeholder="Apportez des précisions sur votre réponse..."
                />
              </div>

              {/* File Uploads */}
              {answer === true && (
                <div className="space-y-4">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-3 block px-1">
                    Documents justificatifs
                  </label>
                  {!isApproved && (
                    <div className="relative group">
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
                      />
                      <div className="w-full py-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-3 group-hover:border-secondary group-hover:bg-secondary/5 transition-all">
                        <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-secondary group-hover:scale-110 transition-all">cloud_upload</span>
                        <p className="font-manrope font-bold text-slate-500 group-hover:text-secondary">Déposez un fichier ou cliquez pour parcourir</p>
                        <p className="text-xs text-slate-400">PDF, IMAGES, DOCS (Max 10MB)</p>
                      </div>
                    </div>
                  )}

                  {/* Uploads List */}
                  {(uploadsList.length > 0 || selectedFile) && (
                    <div className="grid gap-3">
                      {uploadsList.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <span className="material-symbols-outlined text-slate-400">description</span>
                            </div>
                            <div>
                              <p className="font-manrope font-bold text-sm text-on-background truncate max-w-[200px]">{file.original_name}</p>
                              <button onClick={() => handleDownload(file)} className="text-[10px] uppercase font-black text-secondary tracking-widest hover:brightness-125 transition-all">Télécharger</button>
                            </div>
                          </div>
                          {!isApproved && (
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="w-10 h-10 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-2xl">delete</span>
                            </button>
                          )}
                        </div>
                      ))}
                      {selectedFile && (
                        <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-xl border border-secondary/20 animate-pulse">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <span className="material-symbols-outlined text-secondary">upload_file</span>
                            </div>
                            <div>
                              <p className="font-manrope font-bold text-sm text-secondary truncate max-w-[200px]">{selectedFile.name}</p>
                              <span className="text-[10px] uppercase font-black text-secondary/60 tracking-widest block">Prêt à l'envoi</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="w-10 h-10 rounded-xl hover:bg-red-50 text-red-500 transition-all flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-2xl">cancel</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-10 border-t border-slate-100">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="px-8 py-4 flex items-center gap-3 font-manrope font-bold text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined">arrow_back_ios</span>
                  Précédent
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleSubmitAnswer(true)}
                    disabled={saving}
                    className="px-8 py-4 font-manrope font-bold text-slate-400 hover:text-slate-900 transition-all"
                  >
                    Passer la question
                  </button>
                  <button
                    onClick={() => handleSubmitAnswer(false)}
                    disabled={saving || isApproved}
                    className="px-10 py-4 bg-secondary text-white font-bold rounded-2xl shadow-lg hover:shadow-secondary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3"
                  >
                    {saving ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">autorenew</span>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        Confirmer la Réponse
                        <span className="material-symbols-outlined">check_circle</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Evaluation;
