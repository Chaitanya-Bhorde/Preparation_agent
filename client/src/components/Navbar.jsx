import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, LogOut, BarChart3, BookOpen, FileText, Home, Layers, Building2, AlertTriangle, Target, Brain } from 'lucide-react';
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  if (!user) return null;
  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
            <Code2 className="w-6 h-6 text-blue-400" />
            PrepAgent
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/" className="text-gray-300 hover:text-white flex items-center gap-1 text-sm">
              <Home className="w-4 h-4" /> Home
            </Link>
            <Link to="/problems" className="text-gray-300 hover:text-white flex items-center gap-1 text-sm">
              <BookOpen className="w-4 h-4" /> Problems
            </Link>
            <Link to="/analytics" className="text-gray-300 hover:text-white flex items-center gap-1 text-sm">
              <BarChart3 className="w-4 h-4" /> Analytics
            </Link>
            <Link to="/resume" className="text-gray-300 hover:text-white flex items-center gap-1 text-sm">
              <FileText className="w-4 h-4" /> Resume ATS
            </Link>
            <Link to="/topics" className="text-gray-300 hover:text-white flex items-center gap-1 text-sm">
              <Layers className="w-4 h-4" /> Topics
            </Link>
            <Link to="/companies" className="text-gray-300 hover:text-white flex items-center gap-1 text-sm">
              <Building2 className="w-4 h-4" /> Companies
            </Link>
            <Link to="/mistakes" className="text-gray-300 hover:text-white flex items-center gap-1 text-sm">
              <AlertTriangle className="w-4 h-4" /> Mistakes
            </Link>
            <Link to="/goals" className="text-gray-300 hover:text-white flex items-center gap-1 text-sm">
              <Target className="w-4 h-4" /> Goals
            </Link>
            <Link to="/readiness" className="text-gray-300 hover:text-white flex items-center gap-1 text-sm">
              <Brain className="w-4 h-4" /> Readiness
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm font-medium">
                Admin
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden md:block">{user.name}</span>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}