import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecommendations } from '../api';
import { Code2, TrendingUp, BookOpen, Award, Zap, ArrowRight, Plus, Loader2, Trophy, MessageSquare, Download, BarChart3, Database, Brain, Bot, FileText, GraduationCap, Target, CheckCircle } from 'lucide-react';
import { SkeletonStats, SkeletonCard, SkeletonChart } from '../components/Skeleton';
import { usePageTitle } from '../hooks/usePageTitle';
import { PAGE_CONTAINER, STAT_CARD_CLASSES, LOADING_SPINNER, EMPTY_STATE_CLASSES, DIFFICULTY_COLORS } from '../utils/ui';
export default function Dashboard() {
  usePageTitle('Dashboard');
  const { user, refreshUser } = useAuth();
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadRecommendations();
  }, []);
  useEffect(() => {
    const handler = () => { loadRecommendations(); refreshUser(); };
    window.addEventListener('profile-updated', handler);
    return () => window.removeEventListener('profile-updated', handler);
  }, [refreshUser]);
  const loadRecommendations = async () => {
    try {
      const { data } = await getRecommendations();
      setRecs(data.data);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };
  const difficultyColor = (d) => {
    return DIFFICULTY_COLORS[d] || DIFFICULTY_COLORS.easy;
  };
  if (loading) {
    return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  }

  const modules = [
    { name: 'DSA Practice', path: '/practice/dsa', icon: Code2, desc: 'Solve coding problems with Judge0 execution', color: 'from-blue-600 to-blue-800' },
    { name: 'SQL Practice', path: '/practice/sql', icon: Database, desc: 'Write queries against an in-memory SQLite sandbox', color: 'from-emerald-600 to-emerald-800' },
    { name: 'Aptitude Practice', path: '/practice/aptitude', icon: Brain, desc: 'Practice quant, verbal & logical reasoning', color: 'from-purple-600 to-purple-800' },
    { name: 'Resume Analysis', path: '/resume', icon: FileText, desc: 'ATS score & improvement suggestions', color: 'from-orange-600 to-orange-800' },
    { name: 'Mock Interview', path: '/mock-interview', icon: Bot, desc: 'AI-powered voice-based mock interviews', color: 'from-pink-600 to-pink-800' },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy, desc: 'Compete with peers', color: 'from-yellow-600 to-yellow-800' },
  ];

  return (
    <div className={PAGE_CONTAINER}>
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <GraduationCap className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-bold text-white">PrepAgent</h1>
        </div>
        <p className="text-blue-100 text-lg mb-2">
          Your all-in-one placement preparation platform. Practice DSA, SQL & Aptitude, get your resume analyzed with ATS scoring, 
          take AI-powered mock interviews, and track your progress with detailed analytics.
        </p>
        <p className="text-blue-200 text-sm">
          Welcome back, {user?.name?.split(' ')[0] || 'Student'}! Stay consistent and crack your dream placement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={STAT_CARD_CLASSES}>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Solved</span>
          </div>
          <p className="text-2xl font-bold text-white">{user?.stats?.totalSolved || 0}</p>
        </div>
        <div className={STAT_CARD_CLASSES}>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-gray-400 text-sm">Acceptance</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {user?.stats?.totalSubmissions > 0
              ? Math.round((user.stats.totalSolved / user.stats.totalSubmissions) * 100)
              : 0}%
          </p>
        </div>
        <div className={STAT_CARD_CLASSES}>
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-purple-400" />
            <span className="text-gray-400 text-sm">ATS Score</span>
          </div>
          <p className="text-2xl font-bold text-white">{user?.profile?.atsScore || 0}</p>
        </div>
        <div className={STAT_CARD_CLASSES}>
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-gray-400 text-sm">Streak</span>
          </div>
          <p className="text-2xl font-bold text-white">{user?.stats?.streak || 0} days</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          Practice Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <Link
              key={mod.path}
              to={mod.path}
              className={`bg-gradient-to-r ${mod.color} rounded-xl p-5 hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-center gap-3 mb-2">
                <mod.icon className="w-6 h-6 text-white" />
                <h3 className="text-white font-semibold">{mod.name}</h3>
              </div>
              <p className="text-blue-100 text-sm">{mod.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />Recommended for You
              </h2>
              <Link to="/practice/dsa" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="text-gray-400 text-center py-8">Loading recommendations...</div>
            ) : recs?.recommendations?.length > 0 ? (
              <div className="space-y-2">
                {recs.recommendations.slice(0, 5).map((problem) => (
                  <Link key={problem._id} to={`/problems/${problem.slug}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-300 text-sm font-medium">{problem.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{problem.tags?.slice(0, 2).join(', ')}</span>
                      <span>{problem.acceptanceRate || 0}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={EMPTY_STATE_CLASSES}>
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-50 text-gray-500" />
                <p className="text-gray-500">Solve some problems to get personalized recommendations</p>
                <Link to="/practice/dsa" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">Browse Problems</Link>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-6">
          {recs?.weakTopics?.length > 0 && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Weak Topics</h2>
              <div className="flex flex-wrap gap-2">
                {recs.weakTopics.map((topic) => (
                  <span key={topic} className="px-3 py-1 bg-red-900/30 text-red-400 rounded-full text-xs">{topic}</span>
                ))}
              </div>
            </div>
          )}
          {recs?.revisionQueue?.length > 0 && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Revision Queue</h2>
              <div className="space-y-2">
                {recs.revisionQueue.map((problem) => (
                  <Link key={problem._id} to={`/problems/${problem.slug}`}
                    className="block p-2 rounded hover:bg-gray-800 text-gray-300 text-sm">{problem.title}</Link>
                ))}
              </div>
            </div>
          )}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Quick Stats
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>DSA Solved</span>
                <span className="text-white font-medium">{user?.stats?.totalSolved || 0}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Current Streak</span>
                <span className="text-yellow-400 font-medium">{user?.stats?.streak || 0} days</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>ATS Score</span>
                <span className="text-purple-400 font-medium">{user?.profile?.atsScore || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}