import { useState, useEffect } from 'react';
import { getAdminAnalytics, getProblems, createProblem, deleteProblem } from '../api';
import { Users, BookOpen, Code2, BarChart3, Plus, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
export default function Admin() {
  const [analytics, setAnalytics] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newProblem, setNewProblem] = useState({
    title: '', description: '', difficulty: 'easy', tags: '',
    examples: '', constraints: '',
  });
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      const [analyticsRes, problemsRes] = await Promise.all([
        getAdminAnalytics(),
        getProblems({ limit: 100 }),
      ]);
      setAnalytics(analyticsRes.data.data);
      setProblems(problemsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const problemData = {
        title: newProblem.title,
        description: newProblem.description,
        difficulty: newProblem.difficulty,
        tags: newProblem.tags.split(',').map((t) => t.trim()),
        examples: newProblem.examples ? [{ input: '', output: '', explanation: newProblem.examples }] : [],
        constraints: newProblem.constraints,
        testCases: [],
      };
      await createProblem(problemData);
      toast.success('Problem created!');
      setShowCreate(false);
      setNewProblem({ title: '', description: '', difficulty: 'easy', tags: '', examples: '', constraints: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create problem');
    }
  };
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this problem?')) return;
    try {
      await deleteProblem(id);
      toast.success('Problem deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete problem');
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
    </div>;
  }
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Problem
        </button>
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Total Students</span>
          </div>
          <p className="text-2xl font-bold text-white">{analytics?.totalStudents || 0}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-green-400" />
            <span className="text-gray-400 text-sm">Total Problems</span>
          </div>
          <p className="text-2xl font-bold text-white">{analytics?.totalProblems || 0}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Code2 className="w-5 h-5 text-purple-400" />
            <span className="text-gray-400 text-sm">Total Submissions</span>
          </div>
          <p className="text-2xl font-bold text-white">{analytics?.totalSubmissions || 0}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-yellow-400" />
            <span className="text-gray-400 text-sm">Users</span>
          </div>
          <p className="text-2xl font-bold text-white">{analytics?.totalUsers || 0}</p>
        </div>
      </div>
      {}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Problem Distribution</h2>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-gray-300">Easy: {analytics?.problemDistribution?.easy || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span className="text-gray-300">Medium: {analytics?.problemDistribution?.medium || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-gray-300">Hard: {analytics?.problemDistribution?.hard || 0}</span>
          </div>
        </div>
      </div>
      {}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Problems Management</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {problems.map((problem) => (
            <div key={problem._id} className="flex items-center justify-between p-4 hover:bg-gray-800/50">
              <div>
                <h3 className="text-white font-medium text-sm">{problem.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    problem.difficulty === 'easy' ? 'text-green-400 bg-green-900/30' :
                    problem.difficulty === 'medium' ? 'text-yellow-400 bg-yellow-900/30' :
                    'text-red-400 bg-red-900/30'
                  }`}>{problem.difficulty}</span>
                  <span className="text-gray-500 text-xs">Acceptance: {problem.acceptanceRate || 0}%</span>
                  <span className="text-gray-500 text-xs">Submissions: {problem.totalSubmissions || 0}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(problem._id)}
                className="text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      {}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-4">Create New Problem</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm block mb-1">Title</label>
                <input type="text" required value={newProblem.title}
                  onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-gray-300 text-sm block mb-1">Description</label>
                <textarea required value={newProblem.description}
                  onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm h-24 focus:outline-none focus:border-purple-500" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-gray-300 text-sm block mb-1">Difficulty</label>
                  <select value={newProblem.difficulty}
                    onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-gray-300 text-sm block mb-1">Tags (comma separated)</label>
                  <input type="text" value={newProblem.tags}
                    onChange={(e) => setNewProblem({ ...newProblem, tags: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                    placeholder="arrays, strings" />
                </div>
              </div>
              <div>
                <label className="text-gray-300 text-sm block mb-1">Example</label>
                <textarea value={newProblem.examples}
                  onChange={(e) => setNewProblem({ ...newProblem, examples: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm h-16 focus:outline-none focus:border-purple-500"
                  placeholder="Explanation of example..." />
              </div>
              <div>
                <label className="text-gray-300 text-sm block mb-1">Constraints</label>
                <textarea value={newProblem.constraints}
                  onChange={(e) => setNewProblem({ ...newProblem, constraints: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm h-16 focus:outline-none focus:border-purple-500"
                  placeholder="1 <= n <= 10^5..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  Create Problem
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}