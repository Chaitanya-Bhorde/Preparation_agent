import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Code2,
  LogOut,
  BarChart3,
  BookOpen,
  FileText,
  Home,
  Database,
  Brain,
  Menu,
  X,
  Trophy,
  Bot,
  GraduationCap,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  if (!user) return null;

  const linkClass = (active) =>
    `text-sm font-medium pb-1 transition-colors ${
      active ? 'text-white border-b-2 border-blue-400' : 'text-gray-300 hover:text-white'
    }`;

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'DSA Practice', path: '/practice/dsa', icon: Code2 },
    { name: 'SQL Practice', path: '/practice/sql', icon: Database },
    { name: 'Aptitude Practice', path: '/practice/aptitude', icon: BookOpen },
    { name: 'Resume Analysis', path: '/resume', icon: FileText },
    { name: 'Your Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Mock Interview', path: '/mock-interview', icon: Bot },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl" aria-label="Home">
            <GraduationCap className="w-6 h-6 text-blue-400" />
            PrepAgent
          </Link>

          <div className="hidden md:flex items-center gap-5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={linkClass(isActive(item.path))}
              >
                <item.icon className="w-4 h-4 inline mr-1" />
                {item.name}
              </Link>
            ))}
            {user.role === 'admin' && (
              <Link to="/admin" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm hidden md:block">{user.name}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="md:hidden text-gray-400 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pb-3 space-y-1 border-t border-gray-700">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-2 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-gray-800 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}