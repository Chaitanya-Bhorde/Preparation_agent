import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Problems from './pages/Problems';
import ProblemDetail from './pages/ProblemDetail';
import Analytics from './pages/Analytics';
import Resume from './pages/Resume';
import Admin from './pages/Admin';
import Topics from './pages/Topics';
import Companies from './pages/Companies';
import Mistakes from './pages/Mistakes';
import Goals from './pages/Goals';
import Readiness from './pages/Readiness';
import { Loader2 } from 'lucide-react';
import { LOADING_SPINNER } from './utils/ui';
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  return user ? children : <Navigate to="/login" />;
}
function App() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  }
  return (
    <div className="min-h-screen bg-gray-950">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/problems" element={<PrivateRoute><Problems /></PrivateRoute>} />
        <Route path="/problems/:slug" element={<PrivateRoute><ProblemDetail /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
        <Route path="/resume" element={<PrivateRoute><Resume /></PrivateRoute>} />
         <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
         <Route path="/topics" element={<PrivateRoute><Topics /></PrivateRoute>} />
         <Route path="/companies" element={<PrivateRoute><Companies /></PrivateRoute>} />
         <Route path="/mistakes" element={<PrivateRoute><Mistakes /></PrivateRoute>} />
         <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
         <Route path="/readiness" element={<PrivateRoute><Readiness /></PrivateRoute>} />
      </Routes>
    </div>
  );
}
export default App;