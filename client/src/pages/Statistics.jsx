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
    return <div className="flex items-center justify-center h-64">Chargement...</div>;
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
      backgroundColor: '#3b82f6'
    }, {
      label: 'Total questions',
      data: overview?.domains?.map(d => d.questions_count) || [],
      backgroundColor: '#e5e7eb'
    }]
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Statistiques - Année {year}</h1>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Total répondu</p>
          <p className="text-3xl font-bold text-gray-900">
            {yesCount + noCount}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Oui</p>
          <p className="text-3xl font-bold text-green-600">{yesCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Non</p>
          <p className="text-3xl font-bold text-red-600">{noCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="card">
          <h3 className="font-semibold mb-4">Répartition Oui/Non</h3>
          <div className="h-64">
            <Pie data={yesNoData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-4">Statut des réponses</h3>
          <div className="h-64">
            <Pie data={statusData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Progression par Domaine</h3>
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

      <div className="mt-8 card">
        <h3 className="font-semibold mb-4">Détails par Domaine</h3>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2">Domaine</th>
              <th className="text-left px-4 py-2">Champs</th>
              <th className="text-left px-4 py-2">Questions</th>
              <th className="text-left px-4 py-2">Répondus</th>
              <th className="text-left px-4 py-2">Progression</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {overview?.domains?.map(domain => {
              const progress = domain.questions_count > 0 
                ? Math.round((domain.answered_questions / domain.questions_count) * 100) 
                : 0;
              return (
                <tr key={domain.id}>
                  <td className="px-4 py-2 font-medium">D{domain.domain_number}</td>
                  <td className="px-4 py-2">{domain.champs_count}</td>
                  <td className="px-4 py-2">{domain.questions_count}</td>
                  <td className="px-4 py-2">{domain.answered_questions}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm">{progress}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Statistics;
