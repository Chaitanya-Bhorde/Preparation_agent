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
  Layers,
  Building2,
  AlertTriangle,
  Target,
  Brain,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const featuresRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isFeaturesActive = ['/topics', '/companies', '/mistakes', '/goals', '/readiness'].includes(location.pathname);

  const featuresSubItems = [
    { name: 'Topics', path: '/topics', icon: Layers },
    { name: 'Companies', path: '/companies', icon: Building2 },
    { name: 'Mistakes', path: '/mistakes', icon: AlertTriangle },
    { name: 'Goals', path: '/goals', icon: Target },
    { name: 'Readiness', path: '/readiness', icon: Brain },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (featuresRef.current && !featuresRef.current.contains(event.target)) {
        setFeaturesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const linkClass = (active) =>
    `text-sm font-medium pb-1 transition-colors ${
      active ? 'text-white border-b-2 border-blue-400' : 'text-gray-300 hover:text-white'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
            <Code2 className="w-6 h-6 text-blue-400" />
            PrepAgent
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className={linkClass(isActive('/'))}>Home</Link>
            <Link to="/problems" className={linkClass(isActive('/problems'))}>
              <BookOpen className="w-4 h-4 inline mr-1" />
              Problems
            </Link>
            <div className="relative" ref={featuresRef}>
              <button
                type="button"
                onClick={() => setFeaturesOpen(!featuresOpen)}
                className={linkClass(isFeaturesActive)}
              >
                Features
              </button>
              {featuresOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 z-50">
                  {featuresSubItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setFeaturesOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link to="/resume" className={linkClass(isActive('/resume'))}>
              <FileText className="w-4 h-4 inline mr-1" />
              Resume Checker
            </Link>
            <Link to="/analytics" className={linkClass(isActive('/analytics'))}>
              <BarChart3 className="w-4 h-4 inline mr-1" />
              Analytics
            </Link>
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
            <Link
              to="/"
              className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              to="/problems"
              className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BookOpen className="w-4 h-4" />
              Problems
            </Link>
            <div className="px-2 py-1 text-xs text-gray-500 uppercase">Features</div>
            {featuresSubItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
            <Link
              to="/resume"
              className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FileText className="w-4 h-4" />
              Resume Checker
            </Link>
            <Link
              to="/analytics"
              className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Link>
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
