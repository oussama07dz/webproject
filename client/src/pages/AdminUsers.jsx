import { useState, useEffect } from 'react';
import { admin } from '../services/api';

const getRoleBadge = (role) => {
  const map = {
    admin: { label: 'Admin', bg: 'bg-green-100', text: 'text-green-800' },
    recteur: { label: 'Recteur', bg: 'bg-blue-100', text: 'text-blue-800' },
    vrpd: { label: 'VRPD', bg: 'bg-indigo-100', text: 'text-indigo-800' },
    vrpg: { label: 'VRPG', bg: 'bg-indigo-100', text: 'text-indigo-800' },
    vrel: { label: 'VRELEX', bg: 'bg-purple-100', text: 'text-purple-800' },
    vrplan: { label: 'VRPlan', bg: 'bg-purple-100', text: 'text-purple-800' },
    sg: { label: 'SG', bg: 'bg-slate-100', text: 'text-slate-700' },
    doyen: { label: 'Doyen', bg: 'bg-amber-100', text: 'text-amber-800' },
    chef_dep: { label: 'Chef de Dept', bg: 'bg-orange-100', text: 'text-orange-800' },
  };
  return map[role] || { label: role, bg: 'bg-slate-100', text: 'text-slate-700' };
};

const getInitials = (user) => {
  if (user.full_name) return user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return user.username.slice(0, 2).toUpperCase();
};

const avatarColors = [
  'bg-green-600', 'bg-blue-600', 'bg-indigo-600', 'bg-purple-600',
  'bg-amber-600', 'bg-rose-600', 'bg-teal-600', 'bg-cyan-600',
];
const getAvatarColor = (str) => avatarColors[str?.charCodeAt(0) % avatarColors.length] || 'bg-slate-600';

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'recteur', label: 'Recteur' },
  { value: 'vrpd', label: 'VRPD' },
  { value: 'vrpg', label: 'VRPG' },
  { value: 'vrel', label: 'VRELEX' },
  { value: 'vrplan', label: 'VRPlan' },
  { value: 'sg', label: 'SG' },
  { value: 'doyen', label: 'Doyen' },
  { value: 'chef_dep', label: 'Chef de Département' },
];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filterRole, setFilterRole] = useState('');
  const [formData, setFormData] = useState({ username: '', password: '', role: '', full_name: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await admin.getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ username: user.username, password: '', role: user.role, full_name: user.full_name || '' });
    } else {
      setEditingUser(null);
      setFormData({ username: '', password: '', role: '', full_name: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        await admin.updateUser(editingUser.id, { ...formData, username: editingUser.username });
      } else {
        await admin.createUser(formData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await admin.deleteUser(id);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const filtered = filterRole ? users.filter(u => u.role === filterRole) : users;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const doyenCount = users.filter(u => u.role === 'doyen' || u.role === 'chef_dep').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="material-symbols-outlined animate-spin">autorenew</span>
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-h1 text-h1 text-on-background mb-1">Gestion des Utilisateurs</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Configurer les niveaux d'accès et gérer les identités à travers les départements.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#016e1c] text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#0b7320] transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Ajouter un utilisateur
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-start hover:shadow-md transition-all">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Total Utilisateurs</p>
            <h3 className="font-h1 text-5xl font-black text-on-background">{users.length}</h3>
            <p className="mt-4 flex items-center gap-1 text-on-secondary-container font-semibold text-caption">
              <span className="material-symbols-outlined text-sm">group</span>
              Tous rôles confondus
            </p>
          </div>
          <div className="bg-green-100 p-3 rounded-full text-[#016e1c]">
            <span className="material-symbols-outlined">group</span>
          </div>
        </div>

        {/* Admins */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-start hover:shadow-md transition-all">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Administrateurs</p>
            <h3 className="font-h1 text-5xl font-black text-on-background">{adminCount}</h3>
            <p className="mt-4 flex items-center gap-1 text-on-surface-variant font-semibold text-caption">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              Accès système complet
            </p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <span className="material-symbols-outlined">admin_panel_settings</span>
          </div>
        </div>

        {/* Doyens & Chefs */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-start hover:shadow-md transition-all">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Doyens & Chefs Dept.</p>
            <h3 className="font-h1 text-5xl font-black text-on-background">{doyenCount}</h3>
            <p className="mt-4 flex items-center gap-1 text-on-secondary-container font-semibold text-caption">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Postes actifs
            </p>
          </div>
          <div className="bg-amber-100 p-3 rounded-full text-amber-600">
            <span className="material-symbols-outlined">account_balance</span>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        {/* Table Controls */}
        <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">filter_list</span>
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#016e1c] focus:outline-none appearance-none text-slate-700"
              >
                <option value="">Tous les rôles</option>
                {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <p className="font-caption text-caption text-on-surface-variant">
            {filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Nom complet</th>
                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Créé le</th>
                <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400 text-sm">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">person_off</span>
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                filtered.map(u => {
                  const badge = getRoleBadge(u.role);
                  const initials = getInitials(u);
                  const avatarBg = getAvatarColor(u.username);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${avatarBg} flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
                            {initials}
                          </div>
                          <span className="font-semibold text-slate-900">{u.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-body-md text-body-md text-on-surface">{u.full_name || <span className="text-on-surface-variant opacity-30">—</span>}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-caption text-caption text-on-surface-variant">
                        {new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(u)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Modifier"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Supprimer"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="bg-[#31476b] p-6 rounded-xl text-white flex items-center gap-6">
        <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
        </div>
        <div className="flex-1">
          <h4 className="font-h3 text-h3 mb-1">Audit de sécurité</h4>
          <p className="text-white/70 font-body-md text-body-md">La révision trimestrielle des accès est programmée prochainement. Assurez-vous que les comptes désactivés sont supprimés.</p>
        </div>
        <button className="ml-auto px-5 py-2 bg-white text-[#31476b] rounded-lg font-bold hover:bg-slate-100 transition-all text-sm flex-shrink-0">
          Voir le planning
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-h3 text-h3 text-on-background">
                {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body-md text-body-md font-semibold text-on-surface mb-1.5">Nom d'utilisateur</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#016e1c] focus:border-transparent outline-none text-sm"
                  required
                  disabled={!!editingUser}
                />
              </div>

              <div>
                <label className="block font-body-md text-body-md font-semibold text-on-surface mb-1.5">
                  Mot de passe {!editingUser && <span className="text-error">*</span>}
                  {editingUser && <span className="text-on-surface-variant font-normal">(laisser vide pour ne pas changer)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#016e1c] focus:border-transparent outline-none text-sm"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block font-body-md text-body-md font-semibold text-on-surface mb-1.5">Rôle</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#016e1c] focus:border-transparent outline-none text-sm"
                  required
                >
                  <option value="">Sélectionner un rôle</option>
                  {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-body-md text-body-md font-semibold text-on-surface mb-1.5">Nom complet</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#016e1c] focus:border-transparent outline-none text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-all text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#016e1c] text-white rounded-lg font-semibold hover:bg-[#0b7320] transition-all text-sm disabled:opacity-70"
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
