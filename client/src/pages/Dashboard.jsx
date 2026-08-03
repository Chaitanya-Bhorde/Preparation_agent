import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, Database, Brain, Bot, FileText, GraduationCap, Target, CheckCircle, TrendingUp, Zap, BookOpen, Sparkles, ArrowRight, BarChart3, Trophy } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { PAGE_CONTAINER, LOADING_SPINNER } from '../utils/ui';

export default function Dashboard() {
  usePageTitle('Home');
  const { user } = useAuth();

  const features = [
    {
      name: 'DSA Practice',
      path: '/practice/dsa',
      icon: Code2,
      desc: 'Solve 500+ coding problems with real-time Judge0 execution. Covers Arrays, Strings, DP, Graphs, Trees & more.',
      color: 'from-blue-600 to-blue-800',
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-800/50',
      stats: '500+ Problems',
    },
    {
      name: 'SQL Practice',
      path: '/practice/sql',
      icon: Database,
      desc: 'Write and execute SQL queries against an in-memory SQLite sandbox. Practice Joins, Aggregations, Subqueries & more.',
      color: 'from-emerald-600 to-emerald-800',
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-900/20',
      borderColor: 'border-emerald-800/50',
      stats: '200+ Problems',
    },
    {
      name: 'Aptitude Practice',
      path: '/practice/aptitude',
      icon: Brain,
      desc: 'Practice quantitative aptitude, verbal ability & logical reasoning questions asked in top company placements.',
      color: 'from-purple-600 to-purple-800',
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      borderColor: 'border-purple-800/50',
      stats: '1000+ Questions',
    },
    {
      name: 'Resume Analysis',
      path: '/resume',
      icon: FileText,
      desc: 'Get your resume analyzed with ATS scoring. Get detailed feedback on sections, keywords & formatting improvements.',
      color: 'from-orange-600 to-orange-800',
      iconColor: 'text-orange-400',
      bgColor: 'bg-orange-900/20',
      borderColor: 'border-orange-800/50',
      stats: 'ATS Score',
    },
    {
      name: 'Mock Interview',
      path: '/mock-interview',
      icon: Bot,
      desc: 'AI-powered voice-based mock interviews tailored to your target role. Get real-time feedback and improvement tips.',
      color: 'from-pink-600 to-pink-800',
      iconColor: 'text-pink-400',
      bgColor: 'bg-pink-900/20',
      borderColor: 'border-pink-800/50',
      stats: 'AI Powered',
    },
    {
      name: 'Company Wise Practice',
      path: '/companies',
      icon: Target,
      desc: 'Practice company-specific curated problem sets. Get insights into test patterns and interview questions.',
      color: 'from-cyan-600 to-cyan-800',
      iconColor: 'text-cyan-400',
      bgColor: 'bg-cyan-900/20',
      borderColor: 'border-cyan-800/50',
      stats: 'Top Companies',
    },
  ];

  const highlights = [
    { icon: Trophy, label: 'Leaderboard', desc: 'Compete with peers', path: '/leaderboard', color: 'text-yellow-400' },
    { icon: BarChart3, label: 'Your Analytics', desc: 'Track your progress', path: '/analytics', color: 'text-blue-400' },
    { icon: BookOpen, label: 'Interview Experiences', desc: 'Learn from others', path: '/interview-experiences', color: 'text-green-400' },
  ];

  return (
    <div className={PAGE_CONTAINER}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 mb-8 animate-slideUp">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 rounded-xl animate-float">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">PrepAgent</h1>
              <p className="text-blue-200 text-sm">Your All-in-One Placement Preparation Platform</p>
            </div>
          </div>
          <p className="text-blue-100 text-lg max-w-3xl mb-6">
            Master DSA, SQL, and Aptitude with our comprehensive practice platform. 
            Get your resume analyzed with ATS scoring, take AI-powered mock interviews, 
            and track your progress with detailed analytics — all in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/practice/dsa" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-lg">
              Start Practicing <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/resume" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors border border-white/20">
              Analyze Resume
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 animate-slideUp animate-delay-100">
          <div className="flex items-center gap-2 mb-1">
            <Code2 className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-xs">DSA Problems</span>
          </div>
          <p className="text-xl font-bold text-white">500+</p>
        </div>
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 animate-slideUp animate-delay-200">
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="text-gray-400 text-xs">SQL Problems</span>
          </div>
          <p className="text-xl font-bold text-white">200+</p>
        </div>
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 animate-slideUp animate-delay-300">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400 text-xs">Aptitude Questions</span>
          </div>
          <p className="text-xl font-bold text-white">1000+</p>
        </div>
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 animate-slideUp animate-delay-400">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-4 h-4 text-pink-400" />
            <span className="text-gray-400 text-xs">Mock Interviews</span>
          </div>
          <p className="text-xl font-bold text-white">AI Powered</p>
        </div>
      </div>

      {/* Practice Modules */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          Everything You Need to Crack Placements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((mod, index) => (
            <Link
              key={mod.path}
              to={mod.path}
              className={`group bg-gray-900 border ${mod.borderColor} rounded-xl p-5 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 animate-slideUp animate-delay-${(index + 1) * 100}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 ${mod.bgColor} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <mod.icon className={`w-6 h-6 ${mod.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-semibold">{mod.name}</h3>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{mod.stats}</span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Additional Features */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          More Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {highlights.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all animate-slideUp animate-delay-500"
            >
              <div className="flex items-center gap-3 mb-2">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <h3 className="text-white font-medium">{item.label}</h3>
              </div>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-800 rounded-xl p-6 text-center animate-slideUp animate-delay-600">
        <p className="text-gray-300 text-lg">
          Welcome back, <span className="text-white font-semibold">{user?.name?.split(' ')[0] || 'Student'}</span>! 
          Stay consistent and crack your dream placement.
        </p>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Daily Practice</span>
          <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4 text-blue-400" /> Track Progress</span>
          <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-yellow-400" /> Stay Consistent</span>
        </div>
      </div>
    </div>
  );
}