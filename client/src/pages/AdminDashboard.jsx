import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin as adminService, stats } from '../services/api';

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
        adminService.getPending(),
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="material-symbols-outlined animate-spin text-4xl">autorenew</span>
          <span className="font-manrope text-xl font-bold">Chargement...</span>
        </div>
      </div>
    );
  }

  const totalUsers = (overview?.totals?.approved_count || 0) + (overview?.totals?.rejected_count || 0);

  const handleExport = () => {
    if (!overview) return;
    const year = new Date().getFullYear();
    const csvRows = [];
    
    // Derived values for summary
    const yesCount = parseInt(overview?.totals?.yes_count || 0);
    const noCount = parseInt(overview?.totals?.no_count || 0);
    const pendingCount = parseInt(overview?.totals?.pending_count || 0);
    const approvedCount = parseInt(overview?.totals?.approved_count || 0);
    const rejectedCount = parseInt(overview?.totals?.rejected_count || 0);

    // Header
    csvRows.push(`Rapport d'Evaluation - Année ${year}`);
    csvRows.push('');

    // Summary Totals
    csvRows.push('RESUME DES STATISTIQUES');
    csvRows.push(`Total repondu,${yesCount + noCount}`);
    csvRows.push(`Total Oui,${yesCount}`);
    csvRows.push(`Total Non,${noCount}`);
    csvRows.push(`En attente,${pendingCount}`);
    csvRows.push(`Approuves,${approvedCount}`);
    csvRows.push(`Rejetes,${rejectedCount}`);
    csvRows.push('');

    // Domain Details
    csvRows.push('DETAILS PAR DOMAINE');
    csvRows.push('Domaine,Titre,Champs,Questions,Repondus,Progression (%)');

    overview.domains?.forEach(domain => {
      const progress = domain.questions_count > 0
        ? Math.round((domain.answered_questions / domain.questions_count) * 100)
        : 0;
      csvRows.push(`D${domain.domain_number},"${domain.title}",${domain.champs_count},${domain.questions_count},${domain.answered_questions},${progress}%`);
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rapport_evaluation_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-10">
      {/* Page Header */}
      <div className="flex flex-col gap-3">
        <h1 className="font-h1 text-h1 text-on-background tracking-tight">Centre de Supervision Stratégique</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl leading-relaxed">
          Pilotez l'intégrité de la plateforme : analysez les performances globales en temps réel, traitez efficacement les évaluations en attente et orchestrez les privilèges d'accès depuis votre environnement de contrôle unifié.
        </p>
      </div>

      {/* High-Impact Stats Row */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {/* Pending Reviews Card */}
        <Link
          to="/admin/review"
          className="group relative bg-[#fffbe6] border-2 border-[#ffe58f] p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
        >
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-6">
              <span className="material-symbols-outlined text-4xl text-[#d48806]">pending_actions</span>
              <span className="material-symbols-outlined text-xl text-[#d48806] opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-[#874d00] uppercase tracking-widest mb-2 font-bold">Révisions en attente</p>
              <h3 className="font-h1 text-5xl font-black text-[#d48806]">{pendingCount}</h3>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-9xl">pending_actions</span>
          </div>
        </Link>

        {/* Total Users Card */}
        <div className="group relative bg-slate-900 border-2 border-slate-800 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-white">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-6">
              <span className="material-symbols-outlined text-4xl text-slate-300">group</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-slate-400 uppercase tracking-widest mb-2 font-bold">Total des Évaluations</p>
              <h3 className="font-h1 text-5xl font-black">{totalUsers}</h3>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined text-9xl">group</span>
          </div>
        </div>

        {/* Approved Card */}
        <div className="group relative bg-[#f6ffed] border-2 border-[#b7eb8f] p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-[#016e1c]">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-6">
              <span className="material-symbols-outlined text-4xl">task_alt</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-[#016e1c] opacity-70 uppercase tracking-widest mb-2 font-bold">Total Approuvé</p>
              <h3 className="font-h1 text-5xl font-black">{overview?.totals?.approved_count || 0}</h3>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <span className="material-symbols-outlined text-9xl">task_alt</span>
          </div>
        </div>

        {/* Rejected Card */}
        <div className="group relative bg-[#fff1f0] border-2 border-[#ffa39e] p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-[#cf1322]">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-6">
              <span className="material-symbols-outlined text-4xl">cancel</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-[#cf1322] opacity-70 uppercase tracking-widest mb-2 font-bold">Total Rejeté</p>
              <h3 className="font-h1 text-5xl font-black">{overview?.totals?.rejected_count || 0}</h3>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <span className="material-symbols-outlined text-9xl">cancel</span>
          </div>
        </div>
      </div>

      {/* Navigation Shortcuts Grid */}
      <div className="grid gap-8 md:grid-cols-3">
        {/* Review Shortcut */}
        <Link
          to="/admin/review"
          className="group flex items-center gap-6 p-8 bg-white border-2 border-slate-100 rounded-2xl hover:border-[#016e1c] hover:shadow-lg transition-all"
        >
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl">rate_review</span>
          </div>
          <div>
            <h3 className="font-h3 text-h3 text-on-background mb-1">Centre de Révision</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-tight">Traitez les réponses en attente de validation.</p>
          </div>
        </Link>

        {/* Users Shortcut */}
        <Link
          to="/admin/users"
          className="group flex items-center gap-6 p-8 bg-white border-2 border-slate-100 rounded-2xl hover:border-[#016e1c] hover:shadow-lg transition-all"
        >
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl">manage_accounts</span>
          </div>
          <div>
            <h3 className="font-h3 text-h3 text-on-background mb-1">Utilisateurs</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-tight">Gérez les comptes, rôles et privilèges d'accès.</p>
          </div>
        </Link>

        {/* Structures Shortcut */}
        <Link
          to="/admin/structures"
          className="group flex items-center gap-6 p-8 bg-white border-2 border-slate-100 rounded-2xl hover:border-[#016e1c] hover:shadow-lg transition-all"
        >
          <div className="w-20 h-20 bg-[#f6ffed] text-[#016e1c] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl">schema</span>
          </div>
          <div>
            <h3 className="font-h3 text-h3 text-on-background mb-1">Architecture</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-tight">Configurez les domaines et questions d'évaluation.</p>
          </div>
        </Link>
      </div>

      {/* Audit Banner */}
      <div className="bg-[#191c1e] p-10 rounded-2xl text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-2 flex-1">
          <h2 className="font-h2 text-h2 mb-2">Synthèse Annuelle {new Date().getFullYear()}</h2>
          <p className="text-slate-400 font-body-lg text-body-lg max-w-xl">
            Retrouvez les statistiques détaillées et les rapports d'évaluation exportables depuis la section <Link to="/statistics" className="text-secondary font-bold hover:underline">Statistiques</Link>.
          </p>
        </div>
        <div className="relative z-10 flex gap-4">
          <button
            onClick={handleExport}
            className="px-8 py-4 bg-secondary text-white rounded-xl font-bold hover:brightness-110 transition-all text-sm uppercase tracking-widest"
          >
            Exporter Rapport
          </button>
        </div>
        <div className="absolute -right-20 -bottom-20 opacity-10">
          <span className="material-symbols-outlined text-[300px]">auto_graph</span>
        </div>
      </div>
    </div>
  );

};

export default AdminDashboard;
