import { useState, useRef, useEffect, useCallback } from 'react';
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
  ChevronDown,
  Building2,
  Target,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const practiceRef = useRef(null);
  const companyRef = useRef(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    setPracticeOpen(false);
    setCompanyOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (practiceRef.current && !practiceRef.current.contains(e.target)) {
        setPracticeOpen(false);
      }
      if (companyRef.current && !companyRef.current.contains(e.target)) {
        setCompanyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) setCompanies(data.data || []);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  if (!user) return null;

  const linkClass = (active) =>
    `text-sm font-medium pb-1 transition-colors whitespace-nowrap ${
      active ? 'text-white border-b-2 border-blue-400' : 'text-gray-300 hover:text-white'
    }`;

  const dropdownLinkClass = (active) =>
    `flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
      active ? 'text-white bg-blue-600/20' : 'text-gray-300 hover:text-white hover:bg-gray-800'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl shrink-0" aria-label="Home">
            <GraduationCap className="w-6 h-6 text-blue-400" />
            PrepAgent
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={linkClass(isActive('/'))}>
              <Home className="w-4 h-4 inline mr-1" />
              Home
            </Link>

            {/* Practice Dropdown (DSA / SQL / Aptitude) */}
            <div className="relative" ref={practiceRef}>
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={practiceOpen}
                onClick={() => { setPracticeOpen(!practiceOpen); setCompanyOpen(false); }}
                className={`text-sm font-medium pb-1 transition-colors flex items-center gap-1 ${
                  location.pathname.startsWith('/practice') ? 'text-white border-b-2 border-blue-400' : 'text-gray-300 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Practice
                <ChevronDown className={`w-3 h-3 transition-transform ${practiceOpen ? 'rotate-180' : ''}`} />
              </button>
              {practiceOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-2 animate-fadeIn">
                  <Link to="/practice/dsa" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                    <Code2 className="w-5 h-5 text-blue-400 shrink-0" />
                    <span>
                      <span className="block font-medium">DSA</span>
                      <span className="block text-xs text-gray-500">Data Structures & Algorithms</span>
                    </span>
                  </Link>
                  <Link to="/practice/sql" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                    <Database className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>
                      <span className="block font-medium">SQL</span>
                      <span className="block text-xs text-gray-500">Database query problems</span>
                    </span>
                  </Link>
                  <Link to="/practice/aptitude" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                    <Brain className="w-5 h-5 text-purple-400 shrink-0" />
                    <span>
                      <span className="block font-medium">Aptitude</span>
                      <span className="block text-xs text-gray-500">Quant, Logical & Verbal MCQs</span>
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* Company Wise Dropdown */}
            <div className="relative" ref={companyRef}>
              <button
                onClick={() => { setCompanyOpen(!companyOpen); setPracticeOpen(false); }}
                className={`text-sm font-medium pb-1 transition-colors flex items-center gap-1 ${
                  location.pathname.startsWith('/companies') ? 'text-white border-b-2 border-blue-400' : 'text-gray-300 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Company Wise
                <ChevronDown className={`w-3 h-3 transition-transform ${companyOpen ? 'rotate-180' : ''}`} />
              </button>
              {companyOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-2 max-h-80 overflow-y-auto animate-fadeIn">
                  {companies.length === 0 ? (
                    <div className="px-3 py-2 text-gray-500 text-sm">Loading companies...</div>
                  ) : (
                    companies.slice(0, 15).map((c) => (
                      <Link
                        key={c._id}
                        to={`/companies/${c.slug}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="truncate">{c.name}</span>
                      </Link>
                    ))
                  )}
                  {companies.length > 15 && (
                    <Link to="/companies" className="block px-3 py-2 text-xs text-blue-400 hover:text-blue-300 text-center border-t border-gray-700 mt-1">
                      View all {companies.length} companies →
                    </Link>
                  )}
                </div>
              )}
            </div>

            <Link to="/resume" className={linkClass(isActive('/resume'))}>
              <FileText className="w-4 h-4 inline mr-1" />
              Resume Analysis
            </Link>
            <Link to="/analytics" className={linkClass(isActive('/analytics'))}>
              <BarChart3 className="w-4 h-4 inline mr-1" />
              Analytics
            </Link>
            <Link to="/leaderboard" className={linkClass(isActive('/leaderboard'))}>
              <Trophy className="w-4 h-4 inline mr-1" />
              Leaderboard
            </Link>
            <Link to="/mock-interview" className={linkClass(isActive('/mock-interview'))}>
              <Bot className="w-4 h-4 inline mr-1" />
              Mock Interview
            </Link>

            {user.role === 'admin' && (
              <Link to="/admin" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors pb-1 whitespace-nowrap">
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
          <div className="md:hidden mt-3 pb-3 space-y-1 border-t border-gray-700 pt-2">
            <Link to="/" className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded" onClick={() => setMobileMenuOpen(false)}>
              <Home className="w-4 h-4" /> Home
            </Link>
            <div className="px-2 py-1 text-xs text-gray-500 uppercase tracking-wider">Practice</div>
            <Link to="/practice/dsa" className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded ml-2" onClick={() => setMobileMenuOpen(false)}>
              <Code2 className="w-4 h-4 text-blue-400" /> DSA Practice
            </Link>
            <Link to="/practice/sql" className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded ml-2" onClick={() => setMobileMenuOpen(false)}>
              <Database className="w-4 h-4 text-emerald-400" /> SQL Practice
            </Link>
            <Link to="/practice/aptitude" className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded ml-2" onClick={() => setMobileMenuOpen(false)}>
              <Brain className="w-4 h-4 text-purple-400" /> Aptitude Practice
            </Link>
            <div className="px-2 py-1 text-xs text-gray-500 uppercase tracking-wider mt-1">Company Wise</div>
            {companies.slice(0, 8).map((c) => (
              <Link key={c._id} to={`/companies/${c.slug}`} className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded ml-2" onClick={() => setMobileMenuOpen(false)}>
                <Building2 className="w-4 h-4 text-gray-500" /> {c.name}
              </Link>
            ))}
            {companies.length > 8 && (
              <Link to="/companies" className="block px-4 py-1 text-xs text-blue-400 text-center" onClick={() => setMobileMenuOpen(false)}>
                View all {companies.length} companies →
              </Link>
            )}
            <div className="border-t border-gray-700 my-1"></div>
            <Link to="/resume" className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded" onClick={() => setMobileMenuOpen(false)}>
              <FileText className="w-4 h-4" /> Resume Analysis
            </Link>
            <Link to="/analytics" className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded" onClick={() => setMobileMenuOpen(false)}>
              <BarChart3 className="w-4 h-4" /> Your Analytics
            </Link>
            <Link to="/leaderboard" className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded" onClick={() => setMobileMenuOpen(false)}>
              <Trophy className="w-4 h-4" /> Leaderboard
            </Link>
            <Link to="/mock-interview" className="flex items-center gap-2 px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded" onClick={() => setMobileMenuOpen(false)}>
              <Bot className="w-4 h-4" /> Mock Interview
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="flex items-center gap-2 px-2 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-gray-800 rounded" onClick={() => setMobileMenuOpen(false)}>
                Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}