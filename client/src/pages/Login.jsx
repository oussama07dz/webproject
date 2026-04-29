import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bgImage from '../assets/login.jpg';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLegal, setShowLegal] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const legalContent = {
    privacy: {
      title: "Politique de Confidentialité",
      content: "Nous collectons uniquement les informations nécessaires au fonctionnement de la plateforme d'évaluation (identifiants, réponses aux questionnaires, documents justificatifs). Vos données sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers sans votre consentement explicite."
    },
    terms: {
      title: "Conditions d'Utilisation",
      content: "En utilisant cette plateforme, vous vous engagez à fournir des informations exactes et véridiques. Les documents téléchargés doivent être conformes aux exigences de l'évaluation. L'accès est strictement réservé au personnel autorisé ."
    }
  };

  const handleLegalClick = (e, type) => {
    e.preventDefault();
    setShowLegal(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await login(username, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <img
          className="w-full h-full object-cover"
          alt="Main entrance gate of Mohamed Kheider University of Biskra"
          src={bgImage}
        />
        <div className="absolute inset-0 bg-slate-900/40 backdrop-brightness-75"></div>
      </div>

      {/* Main Content Canvas */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-6 py-12">
        {/* Brand Header Section */}
        <header className="text-center mb-10 max-w-3xl">
          <h1 className="font-display font-black text-3xl md:text-4xl lg:text-5xl text-white tracking-tighter leading-tight drop-shadow-lg">
            <br />
            <div><br /></div>
            <div><br /></div>
            <div><br /></div>
          </h1>
        </header>

        {/* Login Card Container */}
        <div className="w-full max-w-md">
          <div className="glass-card editorial-shadow p-8 md:p-10 rounded-xl flex flex-col gap-8">
            {/* Card Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-on-surface tracking-tight font-headline">
                Welcome to the Platform
              </h2>
              <p className="text-on-surface-variant font-label text-[11px] uppercase tracking-[0.1em] font-semibold">
                SYSTÈME D'ÉVALUATION DE LA QUALITÉ
                <div className="mt-1">univ biskra</div>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-error-container border border-error text-on-error-container px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Form Section */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Username Field */}
              <div className="space-y-2">
                <label className="block font-label text-[10px] uppercase tracking-[0.05em] font-bold text-on-surface-variant ml-1">
                  NOM D'UTILISATEUR
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border-none rounded-lg focus:ring-0 focus:bg-surface-container-lowest transition-all duration-200 outline outline-2 outline-transparent focus:outline-primary/20 text-on-surface placeholder:text-outline"
                    placeholder="Identifiant"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block font-label text-[10px] uppercase tracking-[0.05em] font-bold text-on-surface-variant ml-1">
                  MOT DE PASSE
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border-none rounded-lg focus:ring-0 focus:bg-surface-container-lowest transition-all duration-200 outline outline-2 outline-transparent focus:outline-primary/20 text-on-surface placeholder:text-outline"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#016e1c] text-white font-bold rounded-lg shadow-lg hover:bg-[#0b7320] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Connexion...' : 'Se connecter'}</span>
                <span className="material-symbols-outlined text-[20px]">
                  {loading ? 'hourglass_empty' : 'arrow_forward'}
                </span>
              </button>
            </form>

            {/* Help & Footer inside card */}
            <div className="bg-surface-container-low p-4 rounded-lg">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Utilisez votre nom de rôle comme identifiant. Exemple: <span className="font-mono font-bold text-primary">vrpd</span> / <span className="font-mono font-bold text-primary">vrpd123</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global Footer */}
      <footer className="relative z-10 w-full px-12 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-[11px] font-label uppercase tracking-widest text-white/70">
          © {new Date().getFullYear()} Oussama Derbali & Lilya Barkat. Tous droits réservés.
        </div>
        <nav className="flex flex-wrap justify-center items-center gap-8">
          <a href="#" onClick={(e) => handleLegalClick(e, 'privacy')} className="text-[11px] font-label uppercase tracking-widest text-white/80 hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" onClick={(e) => handleLegalClick(e, 'terms')} className="text-[11px] font-label uppercase tracking-widest text-white/80 hover:text-white transition-colors">Terms of Service</a>
        </nav>
      </footer>

      {/* Simple Legal Modal */}
      {showLegal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">{legalContent[showLegal].title}</h3>
              <button onClick={() => setShowLegal(null)} className="text-slate-400 hover:text-slate-600">
                <span translate="no" className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              {legalContent[showLegal].content}
            </p>
            <button 
              onClick={() => setShowLegal(null)}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
