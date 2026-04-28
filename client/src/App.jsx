import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Evaluation from './pages/Evaluation';
import MyAnswers from './pages/MyAnswers';
import Statistics from './pages/Statistics';
import AdminDashboard from './pages/AdminDashboard';
import AdminReview from './pages/AdminReview';
import AdminUsers from './pages/AdminUsers';
import AdminStructures from './pages/AdminStructures';
import Layout from './components/layout/Layout';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#016e1c] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-manrope font-semibold">Initialisation...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Login />}
      />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route
          index
          element={user ? <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Navigate to="/login" replace />}
        />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="evaluation/:domainId" element={<Evaluation />} />
        <Route path="my-answers" element={<MyAnswers />} />
        <Route path="statistics" element={<Statistics />} />

        <Route path="admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/review" element={<ProtectedRoute adminOnly><AdminReview /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/structures" element={<ProtectedRoute adminOnly><AdminStructures /></ProtectedRoute>} />
      </Route>

      {/* Catch all redirect to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
