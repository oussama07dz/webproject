import { useState, useEffect } from 'react';
import { domains, admin } from '../services/api';

const AdminStructures = () => {
  const [step, setStep] = useState('domains');
  const [domainsList, setDomainsList] = useState([]);
  const [champs, setChamps] = useState([]);
  const [refs, setRefs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedChamp, setSelectedChamp] = useState(null);
  const [selectedRef, setSelectedRef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [customProof, setCustomProof] = useState('');

  const addCustomProof = () => {
    if (customProof.trim()) {
      const currentProofs = formData.proofs || [];
      if (!currentProofs.includes(customProof.trim())) {
        setFormData({ ...formData, proofs: [...currentProofs, customProof.trim()] });
      }
      setCustomProof('');
    }
  };

  const [nextCodes, setNextCodes] = useState({
    domain: '',
    champ: '',
    ref: '',
    question: ''
  });

  const availableRoles = [
    { value: 'recteur', label: 'Recteur' },
    { value: 'vrpd', label: 'VRPD (Vice-Rector Pedagogy)' },
    { value: 'vrpg', label: 'VRPG (Vice-Rector Post-Graduation)' },
    { value: 'vrel', label: 'VREL (Vice-Rector External Relations)' },
    { value: 'vrplan', label: 'VRPLAN (Vice-Rector Planning)' },
    { value: 'sg', label: 'SG (Secrétaire Général)' },
    { value: 'doyen', label: 'Doyen' },
    { value: 'chef_dep', label: 'Chef de département' }
  ];

  const availableProofs = [
    'Bureau(x) d\'accueil',
    'Procédure d\'accueil formalisée',
    'Typologie du personnel',
    'Portail du site web',
    'Planning des événements',
    'Canaux de communication',
    'Réseaux sociaux',
    'Cellule d\'œuvres sociales (COS)',
    'Cellule d\'aide sociale pour les étudiants',
    'Cellule d\'écoute psychologique',
    'Espace de détente',
    'Structures sportives',
    'Structure garde d\'enfants',
    'Bureau postal',
    'Salles de soins',
    'Pharmacie',
    'Protocole sanitaire',
    'Organe HSE',
    'Structure culturelle/sportive',
    'Disciplines sportives',
    'Activités culturelles',
    'Liste des associations'
  ];

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const res = await domains.getAll();
      setDomainsList(res.data);
    } catch (err) {
      console.error('Error fetching domains:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChamps = async (domainId, domain = null) => {
    try {
      const res = await admin.getChamps(domainId);
      setChamps(res.data);
      if (domain) {
        setSelectedDomain(domain);
      }
      setStep('champs');
    } catch (err) {
      console.error('Error fetching champs:', err);
    }
  };

  const fetchRefs = async (champId) => {
    try {
      const res = await admin.getRefs(champId);
      setRefs(res.data);
      setStep('refs');
    } catch (err) {
      console.error('Error fetching refs:', err);
    }
  };

  const fetchQuestions = async (refId) => {
    try {
      const res = await admin.getQuestions(refId);
      setQuestions(res.data);
      setStep('questions');
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  const fetchNextCodes = async (type) => {
    try {
      if (type === 'domain') {
        const res = await admin.getNextDomainNumber();
        setNextCodes(prev => ({ ...prev, domain: res.data.next }));
      } else if (type === 'champ' && selectedDomain) {
        const res = await admin.getNextChampCode(selectedDomain.id);
        setNextCodes(prev => ({ ...prev, champ: res.data.next }));
      } else if (type === 'ref' && selectedChamp) {
        const res = await admin.getNextRefCode(selectedChamp.id);
        setNextCodes(prev => ({ ...prev, ref: res.data.next }));
      } else if (type === 'question' && selectedRef) {
        const res = await admin.getNextQuestionCode(selectedRef.id);
        setNextCodes(prev => ({ ...prev, question: res.data.next }));
      }
    } catch (err) {
      console.error('Error fetching next codes:', err);
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setCustomProof('');
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData({});
      setNextCodes(prev => ({ ...prev, [type]: '' }));
      setTimeout(() => fetchNextCodes(type), 0);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (modalType === 'domain') {
        const domainNumber = formData.domain_number || nextCodes.domain;
        if (!domainNumber) {
          throw new Error('Numéro du domaine manquant');
        }
        if (formData.id) {
          await domains.update(formData.id, formData);
        } else {
          await domains.create({ domain_number: domainNumber, title: formData.title, description: formData.description });
        }
        fetchDomains();
      } else if (modalType === 'champ') {
        const champDomainId = formData.domain_id || selectedDomain?.id;
        if (!champDomainId) {
          throw new Error('Aucun domaine sélectionné');
        }
        const champCode = formData.champ_code || nextCodes.champ;
        if (!champCode) {
          throw new Error('Code du champ manquant');
        }
        if (formData.id) {
          await admin.updateChamp(formData.id, { ...formData, domain_id: champDomainId });
        } else {
          await admin.createChamp({ domain_id: champDomainId, champ_code: champCode, title: formData.title });
        }
        fetchChamps(champDomainId);
      } else if (modalType === 'ref') {
        const refChampId = formData.champ_id || selectedChamp?.id;
        if (!refChampId) {
          throw new Error('Aucun champ sélectionné');
        }
        const refCode = formData.ref_code || nextCodes.ref;
        if (!refCode) {
          throw new Error('Code de la référence manquant');
        }
        if (formData.id) {
          await admin.updateRef(formData.id, formData);
        } else {
          await admin.createRef({ champ_id: refChampId, ref_code: refCode, title: formData.title, description: formData.description });
        }
        fetchRefs(refChampId);
      } else if (modalType === 'question') {
        const questionRefId = formData.ref_id || selectedRef?.id;
        if (!questionRefId) {
          throw new Error('Aucune référence sélectionnée');
        }
        const questionCode = formData.question_code || nextCodes.question;
        if (!questionCode) {
          throw new Error('Code de la question manquant');
        }
        const data = {
          ref_id: questionRefId,
          question_code: questionCode,
          question_text: formData.question_text,
          roles: formData.roles || [],
          proofs: formData.proofs || []
        };
        if (formData.id) {
          await admin.updateQuestion(formData.id, data);
        } else {
          await admin.createQuestion(data);
        }
        fetchQuestions(questionRefId);
      }

      setShowModal(false);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Erreur lors de la sauvegarde';
      alert(errorMessage);
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer?')) return;

    try {
      if (modalType === 'domain') {
        await domains.delete(formData.id);
        fetchDomains();
      } else if (modalType === 'champ') {
        await admin.deleteChamp(formData.id);
        fetchChamps(selectedDomain.id);
      } else if (modalType === 'ref') {
        await admin.deleteRef(formData.id);
        fetchRefs(selectedChamp.id);
      } else if (modalType === 'question') {
        await admin.deleteQuestion(formData.id);
        fetchQuestions(selectedRef.id);
      }
      setShowModal(false);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erreur lors de la suppression';
      alert(errorMessage);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm">
          <button onClick={() => setStep('domains')} className="text-primary-600 hover:underline">Domaines</button>
          {step !== 'domains' && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{selectedDomain?.title?.substring(0, 30)}...</span>
            </>
          )}
          {step === 'refs' && selectedChamp && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{selectedChamp.champ_code}</span>
            </>
          )}
          {step === 'questions' && selectedRef && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{selectedRef.ref_code}</span>
            </>
          )}
        </nav>
      </div>

      {step === 'domains' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Domaines</h1>
            {/* <button onClick={() => openModal('domain')} className="btn btn-primary">
              + Ajouter un domaine
            </button> */}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {domainsList.map(domain => (
              <div key={domain.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <span className="badge bg-primary-100 text-primary-800">Domaine {domain.domain_number}</span>
                </div>
                <h3 className="font-semibold mb-2">{domain.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{domain.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedDomain(domain); fetchChamps(domain.id, domain); }}
                    className="btn btn-secondary flex-1"
                  >
                    Voir Champs
                  </button>
                  {/* <button
                    onClick={() => openModal('domain', domain)}
                    className="btn btn-secondary"
                  >
                    Modifier
                  </button> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'champs' && (
        <div>
          <button onClick={() => setStep('domains')} className="mb-4 text-primary-600 hover:underline">
            ← Retour aux domaines
          </button>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Champs - {selectedDomain?.title?.substring(0, 30)}</h1>
            {/* <button onClick={() => { if (selectedDomain?.id) openModal('champ'); else alert('Veuillez sélectionner un domaine'); }} className="btn btn-primary">
              + Ajouter un champ
            </button> */}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {champs.map(champ => (
              <div key={champ.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-primary-600">{champ.champ_code}</span>
                </div>
                <h3 className="font-semibold mb-4">{champ.title}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedChamp(champ); fetchRefs(champ.id); }}
                    className="btn btn-secondary flex-1"
                  >
                    Voir Références
                  </button>
                  {/* <button
                    onClick={() => openModal('champ', champ)}
                    className="btn btn-secondary"
                  >
                    Modifier
                  </button> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'refs' && (
        <div>
          <button onClick={() => { setStep('champs'); fetchChamps(selectedDomain.id); }} className="mb-4 text-primary-600 hover:underline">
            ← Retour aux champs
          </button>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Références - {selectedChamp?.title?.substring(0, 30)}</h1>
            {/* <button onClick={() => openModal('ref')} className="btn btn-primary">
              + Ajouter une référence
            </button> */}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {refs.map(ref => (
              <div key={ref.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-primary-600">{ref.ref_code}</span>
                </div>
                <h3 className="font-semibold mb-2">{ref.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{ref.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedRef(ref); fetchQuestions(ref.id); }}
                    className="btn btn-secondary flex-1"
                  >
                    Voir Questions
                  </button>
                  {/* <button
                    onClick={() => openModal('ref', ref)}
                    className="btn btn-secondary"
                  >
                    Modifier
                  </button> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'questions' && (
        <div>
          <button onClick={() => { setStep('refs'); fetchRefs(selectedChamp.id); }} className="mb-4 text-primary-600 hover:underline">
            ← Retour aux références
          </button>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Questions - {selectedRef?.title?.substring(0, 30)}</h1>
            {/* <button onClick={() => openModal('question')} className="btn btn-primary">
              + Ajouter une question
            </button> */}
          </div>
          <div className="space-y-4">
            {questions.map(q => (
              <div key={q.id} className="card">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-primary-600">{q.question_code}</span>
                  <div className="flex gap-2">
                    {/* <button
                      onClick={() => openModal('question', q)}
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      Modifier
                    </button> */}
                  </div>
                </div>
                <p className="font-semibold mb-2">{q.question_text}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {q.roles?.map(role => (
                    <span key={role} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {availableRoles.find(r => r.value === role)?.label || role}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {formData.id ? 'Modifier' : 'Ajouter'} {modalType}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {modalType === 'domain' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Numéro</label>
                    <input
                      type="text"
                      value={formData.id ? formData.domain_number : (nextCodes.domain || '')}
                      onChange={(e) => setFormData({ ...formData, domain_number: parseInt(e.target.value) || 0 })}
                      className="input bg-gray-100"
                      readOnly={!formData.id}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Titre</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input h-24"
                    />
                  </div>
                </>
              )}

              {modalType === 'champ' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Code</label>
                    <input
                      type="text"
                      value={formData.id ? formData.champ_code : (nextCodes.champ || '')}
                      onChange={(e) => setFormData({ ...formData, champ_code: e.target.value })}
                      className="input bg-gray-100"
                      readOnly={!formData.id}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Titre</label>
                    <textarea
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="input h-24"
                      required
                    />
                  </div>
                </>
              )}

              {modalType === 'ref' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Code</label>
                    <input
                      type="text"
                      value={formData.id ? formData.ref_code : (nextCodes.ref || '')}
                      onChange={(e) => setFormData({ ...formData, ref_code: e.target.value })}
                      className="input bg-gray-100"
                      readOnly={!formData.id}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Titre</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input h-24"
                    />
                  </div>
                </>
              )}

              {modalType === 'question' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Code</label>
                    <input
                      type="text"
                      value={formData.id ? formData.question_code : (nextCodes.question || '')}
                      onChange={(e) => setFormData({ ...formData, question_code: e.target.value })}
                      className="input bg-gray-100"
                      readOnly={!formData.id}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Question</label>
                    <textarea
                      value={formData.question_text || ''}
                      onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                      className="input h-24"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Rôles</label>
                    <div className="border rounded-md p-2 max-h-32 overflow-y-auto bg-white">
                      {availableRoles.map(role => (
                        <label key={role.value} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={formData.roles?.includes(role.value) || false}
                            onChange={(e) => {
                              const currentRoles = formData.roles || [];
                              if (e.target.checked) {
                                setFormData({ ...formData, roles: [...currentRoles, role.value] });
                              } else {
                                setFormData({ ...formData, roles: currentRoles.filter(r => r !== role.value) });
                              }
                            }}
                            className="rounded text-primary-600"
                          />
                          <span className="text-sm">{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Preuves</label>
                    <div className="border rounded-md p-2 max-h-32 overflow-y-auto bg-white mb-2">
                      {availableProofs.map(proof => (
                        <label key={proof} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={formData.proofs?.includes(proof) || false}
                            onChange={(e) => {
                              const currentProofs = formData.proofs || [];
                              if (e.target.checked) {
                                setFormData({ ...formData, proofs: [...currentProofs, proof] });
                              } else {
                                setFormData({ ...formData, proofs: currentProofs.filter(p => p !== proof) });
                              }
                            }}
                            className="rounded text-primary-600"
                          />
                          <span className="text-sm">{proof}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customProof}
                        onChange={(e) => setCustomProof(e.target.value)}
                        placeholder="Ajouter une preuve personnalisée"
                        className="input flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomProof())}
                      />
                      <button
                        type="button"
                        onClick={addCustomProof}
                        className="btn btn-secondary"
                      >
                        Ajouter
                      </button>
                    </div>
                    {formData.proofs?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {formData.proofs.map(proof => (
                          <span key={proof} className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {proof}
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, proofs: formData.proofs.filter(p => p !== proof) })}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? '...' : 'Sauvegarder'}
                </button>
                {formData.id && (
                  <button type="button" onClick={handleDelete} className="btn btn-danger">
                    Supprimer
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStructures;
