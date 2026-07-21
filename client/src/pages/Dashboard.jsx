import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecommendations } from '../api';
import { Code2, TrendingUp, BookOpen, Award, Zap, ArrowRight, Plus } from 'lucide-react';
export default function Dashboard() {
  const { user } = useAuth();
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadRecommendations();
  }, []);
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
    if (d === 'easy') return 'text-green-400 bg-green-900/30';
    if (d === 'medium') return 'text-yellow-400 bg-yellow-900/30';
    return 'text-red-400 bg-red-900/30';
  };
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
        </h1>
        <p className="text-blue-100 text-lg">Continue your placement preparation journey. Stay consistent!</p>
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Solved</span>
          </div>
          <p className="text-2xl font-bold text-white">{user?.stats?.totalSolved || 0}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
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
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-purple-400" />
            <span className="text-gray-400 text-sm">ATS Score</span>
          </div>
          <p className="text-2xl font-bold text-white">{user?.profile?.atsScore || 0}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-gray-400 text-sm">Streak</span>
          </div>
          <p className="text-2xl font-bold text-white">{user?.stats?.streak || 0} days</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />Recommended for You
              </h2>
              <Link to="/problems" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
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
              <div className="text-gray-400 text-center py-8">
                <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Solve some problems to get personalized recommendations</p>
                <Link to="/problems" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">Browse Problems</Link>
              </div>
            )}
          </div>
        </div>
        {}
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
        </div>
      </div>
    </div>
  );
}