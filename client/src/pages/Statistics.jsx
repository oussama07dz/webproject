import { useState, useEffect } from 'react';
import { stats } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Statistics = () => {
  const [year] = useState(new Date().getFullYear());
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [year]);

  const fetchStats = async () => {
    try {
      const res = await stats.getOverview(year);
      setOverview(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <span translate="no" className="material-symbols-outlined animate-spin text-4xl mr-3">autorenew</span>
        <span className="font-manrope text-xl font-bold">Chargement...</span>
      </div>
    );
  }

  const yesCount = parseInt(overview?.totals?.yes_count || 0);
  const noCount = parseInt(overview?.totals?.no_count || 0);
  const pendingCount = parseInt(overview?.totals?.pending_count || 0);
  const approvedCount = parseInt(overview?.totals?.approved_count || 0);
  const rejectedCount = parseInt(overview?.totals?.rejected_count || 0);

  const yesNoData = {
    labels: ['Oui', 'Non'],
    datasets: [{
      data: [yesCount, noCount],
      backgroundColor: ['#10b981', '#ef4444'],
      borderWidth: 0
    }]
  };

  const statusData = {
    labels: ['En attente', 'Approuvés', 'Rejetés'],
    datasets: [{
      data: [pendingCount, approvedCount, rejectedCount],
      backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
      borderWidth: 0
    }]
  };

  const domainData = {
    labels: overview?.domains?.map(d => `D${d.domain_number}`) || [],
    datasets: [{
      label: 'Questions répondues',
      data: overview?.domains?.map(d => d.answered_questions) || [],
      backgroundColor: '#016e1c'
    }, {
      label: 'Total questions',
      data: overview?.domains?.map(d => d.questions_count) || [],
      backgroundColor: '#9bc3d1'
    }]
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-h1 text-h1 text-on-background">Statistiques - Année {year}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Visualisation détaillée des performances et du statut des évaluations.</p>
      </div>

      {/* Buffed Stats Cards */}
      <div className="grid gap-8 md:grid-cols-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Total répondu</p>
          <p className="font-h1 text-5xl font-black text-on-background">{yesCount + noCount}</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Total "Oui"</p>
          <p className="font-h1 text-5xl font-black text-green-600">{yesCount}</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Total "Non"</p>
          <p className="font-h1 text-5xl font-black text-red-600">{noCount}</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">En attente</p>
          <p className="font-h1 text-5xl font-black text-yellow-600">{pendingCount}</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-h3 text-h3 mb-6 text-on-background">Répartition Oui/Non</h3>
          <div className="h-64">
            <Pie data={yesNoData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-h3 text-h3 mb-6 text-on-background">Statut des réponses</h3>
          <div className="h-64">
            <Pie data={statusData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-h3 text-h3 mb-6 text-on-background">Progression par Domaine</h3>
        <div className="h-80">
          <Bar
            data={domainData}
            options={{
              maintainAspectRatio: false,
              scales: {
                y: { beginAtZero: true }
              }
            }}
          />
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-h3 text-h3 mb-6 text-on-background">Détails par Domaine</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Domaine</th>
                <th className="text-left px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Champs</th>
                <th className="text-left px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Questions</th>
                <th className="text-left px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Répondus</th>
                <th className="text-left px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase">Progression</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-body-md text-body-md">
              {overview?.domains?.map(domain => {
                const progress = domain.questions_count > 0
                  ? Math.round((domain.answered_questions / domain.questions_count) * 100)
                  : 0;
                return (
                  <tr key={domain.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-on-background">D{domain.domain_number}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{domain.champs_count}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{domain.questions_count}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{domain.answered_questions}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-secondary h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="font-bold text-on-background w-12">{progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
