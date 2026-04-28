import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { notifications } from '../../services/api';
import bgImage from '../../assets/background.png';
import logoImage from '../../assets/UMKBiskra_Logo.png';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        notifications.getAll(),
        notifications.getUnreadCount()
      ]);
      setNotifs(notifRes.data);
      setUnreadCount(countRes.data.count);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await notifications.markRead(notif.id);
      fetchNotifications();
    }
    if (notif.answer_id) {
      navigate('/my-answers');
    }
  };

  const isAdmin = user?.role === 'admin';
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase();

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${isActive
      ? 'bg-[#016e1c] text-white'
      : 'text-slate-500 hover:bg-slate-900/5 hover:text-slate-900'
    }`;

  return (
    <div className="flex h-screen bg-[#f7f9fb] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] min-w-[260px] h-full border-r border-slate-200 bg-slate-50 z-50 flex flex-col p-6 overflow-y-auto">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <img src={logoImage} alt="UMK Biskra Logo" className="w-[120px] h-auto object-contain" />
          <div className="text-center mt-2">
            <h1 className="text-[15px] font-extrabold tracking-tight text-slate-900 leading-snug">Plateforme d'évaluation<br />de la qualité</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#016e1c] font-black mt-1">univ-biskra</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {!isAdmin && (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>
                <span className="material-symbols-outlined text-xl">dashboard</span>
                Dashboard
              </NavLink>

              <NavLink to="/my-answers" className={navLinkClass}>
                <span className="material-symbols-outlined text-xl">fact_check</span>
                Mes Réponses
              </NavLink>

              <NavLink to="/statistics" className={navLinkClass}>
                <span className="material-symbols-outlined text-xl">analytics</span>
                Statistiques
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <div className="pt-4 mt-4 border-t border-slate-200">
                <p className="px-4 text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Administration</p>
              </div>

              <NavLink to="/admin" end className={navLinkClass}>
                <span className="material-symbols-outlined text-xl">grid_view</span>
                Admin Dashboard
              </NavLink>

              <NavLink to="/admin/review" className={navLinkClass}>
                <span className="material-symbols-outlined text-xl">rate_review</span>
                Révisions
              </NavLink>

              <NavLink to="/statistics" className={navLinkClass}>
                <span className="material-symbols-outlined text-xl">analytics</span>
                Statistiques
              </NavLink>

              <NavLink to="/admin/users" className={navLinkClass}>
                <span className="material-symbols-outlined text-xl">manage_accounts</span>
                Utilisateurs
              </NavLink>

              <NavLink to="/admin/structures" className={navLinkClass}>
                <span className="material-symbols-outlined text-xl">table_chart</span>
                Structures
              </NavLink>
            </>
          )}
        </nav>

        {/* Bottom: user + logout */}
        <div className="mt-auto border-t border-slate-200 pt-5 space-y-1">
          {/* Notifications button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-900/5 transition-all text-sm font-medium"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="fixed bottom-12 left-[280px] w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-[100] mb-2 transform">
                <div className="p-3 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <p className="p-4 text-sm text-slate-400 text-center">Aucune notification</p>
                  ) : (
                    notifs.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${!notif.is_read ? 'bg-green-50' : ''}`}
                      >
                        <p className="font-medium text-sm text-slate-800">{notif.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg">
            <div className="w-9 h-9 bg-[#016e1c] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.full_name || user?.username}</p>
              <p className="text-[11px] text-slate-500 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Déconnexion"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        <main
          className="flex-1 overflow-y-auto"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
          }}
        >
          <div className="min-h-full p-8 bg-white/0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
