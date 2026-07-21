import { useState, useEffect } from 'react';
import { getAdminAnalytics, getProblems, createProblem, deleteProblem, getAdminUsers, getAdminUser, updateUserRole, deleteUser } from '../api';
import { Users, BookOpen, Code2, BarChart3, Plus, Trash2, Loader2, Search, Shield, ChevronLeft, Activity, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [problems, setProblems] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
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

  const loadUsers = async (page = 1, search = '') => {
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      const { data } = await getAdminUsers(params);
      setUsers(data.data || []);
      setUserTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadUserDetail = async (id) => {
    try {
      const { data } = await getAdminUser(id);
      setUserDetail(data.data);
    } catch (error) {
      toast.error('Failed to load user details');
    }
  };

  useEffect(() => {
    if (tab === 'users') {
      loadUsers(userPage, searchTerm);
    }
  }, [tab, userPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setUserPage(1);
    loadUsers(1, searchTerm);
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

  const handleDeleteProblem = async (id) => {
    if (!confirm('Are you sure you want to delete this problem?')) return;
    try {
      await deleteProblem(id);
      toast.success('Problem deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete problem');
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await updateUserRole(id, role);
      toast.success('Role updated');
      loadUsers(userPage, searchTerm);
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user and all their submissions? This cannot be undone.')) return;
    try {
      await deleteUser(id);
      toast.success('User deleted');
      if (selectedUser === id) {
        setSelectedUser(null);
        setUserDetail(null);
      }
      loadUsers(userPage, searchTerm);
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const difficultyColor = (d) => {
    if (d === 'easy') return 'text-green-400 bg-green-900/30';
    if (d === 'medium') return 'text-yellow-400 bg-yellow-900/30';
    return 'text-red-400 bg-red-900/30';
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
    </div>;
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'problems', label: 'Problems' },
    { id: 'users', label: 'Users' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedUser(null); setUserDetail(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <>
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
                <span className="text-gray-400 text-sm">Total Users</span>
              </div>
              <p className="text-2xl font-bold text-white">{analytics?.totalUsers || 0}</p>
            </div>
          </div>

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

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Top Students</h2>
            <div className="space-y-2">
              {analytics?.topStudents?.map((student, idx) => (
                <div key={student._id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm w-6">{idx + 1}.</span>
                    <div>
                      <p className="text-white text-sm font-medium">{student.name}</p>
                      <p className="text-gray-500 text-xs">{student.email} {student.profile?.college ? `• ${student.profile.college}` : ''}</p>
                    </div>
                  </div>
                  <span className="text-blue-400 font-bold">{student.stats?.totalSolved || 0} solved</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'problems' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Problem
            </button>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Problems Management</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {problems.map((problem) => (
                <div key={problem._id} className="flex items-center justify-between p-4 hover:bg-gray-800/50">
                  <div className="min-w-0">
                    <h3 className="text-white font-medium text-sm">{problem.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
                      <span className="text-gray-500 text-xs">Acceptance: {problem.acceptanceRate || 0}%</span>
                      <span className="text-gray-500 text-xs">Submissions: {problem.totalSubmissions || 0}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteProblem(problem._id)}
                    className="text-gray-500 hover:text-red-400 transition-colors shrink-0 ml-4">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'users' && !selectedUser && (
        <>
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"/>
            </div>
          </form>
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">User Management</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {users.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => { setSelectedUser(user._id); loadUserDetail(user._id); }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{user.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'text-purple-400 bg-purple-900/30' : 'text-blue-400 bg-blue-900/30'}`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{user.email} {user.profile?.college ? `• ${user.profile.college}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 shrink-0 ml-4">
                    <span>{user.stats?.totalSolved || 0} solved</span>
                    <span>ATS: {user.profile?.atsScore || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {userTotalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button disabled={userPage <= 1} onClick={() => setUserPage(userPage - 1)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 text-sm">Previous</button>
              <span className="px-4 py-2 text-gray-400 text-sm">Page {userPage} of {userTotalPages}</span>
              <button disabled={userPage >= userTotalPages} onClick={() => setUserPage(userPage + 1)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 text-sm">Next</button>
            </div>
          )}
        </>
      )}

      {tab === 'users' && selectedUser && userDetail && (
        <div>
          <button onClick={() => { setSelectedUser(null); setUserDetail(null); }}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 text-sm">
            <ChevronLeft className="w-4 h-4" /> Back to Users
          </button>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{userDetail.user.name}</h2>
                <p className="text-gray-400 text-sm">{userDetail.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <select value={userDetail.user.role} onChange={(e) => handleRoleChange(userDetail.user._id, e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm">
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => handleDeleteUser(userDetail.user._id)}
                  className="flex items-center gap-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 px-3 py-1.5 rounded-lg text-sm">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Total Solved</p>
                <p className="text-white text-lg font-bold">{userDetail.user.stats?.totalSolved || 0}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Acceptance Rate</p>
                <p className="text-white text-lg font-bold">{userDetail.stats?.acceptanceRate || 0}%</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Total Submissions</p>
                <p className="text-white text-lg font-bold">{userDetail.stats?.totalSubmissions || 0}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">ATS Score</p>
                <p className="text-white text-lg font-bold">{userDetail.user.profile?.atsScore || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Submissions</h2>
            <div className="space-y-2">
              {userDetail.recentSubmissions?.length > 0 ? userDetail.recentSubmissions.map((sub) => {
                const isAccepted = sub.status === 'accepted';
                return (
                  <div key={sub._id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      {isAccepted ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                      <span className="text-white text-sm truncate">{sub.problem?.title || 'Unknown Problem'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor(sub.problem?.difficulty || 'easy')}`}>
                        {sub.problem?.difficulty || 'unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0 ml-4">
                      <span>{sub.language}</span>
                      <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-gray-500 text-sm text-center py-4">No submissions yet</p>
              )}
            </div>
          </div>
        </div>
      )}

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
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Create Problem</button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}