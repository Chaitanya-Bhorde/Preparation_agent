import axios from 'axios';
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login from protected pages, not public/auth pages
      const currentPath = window.location.pathname;
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
      const isPublicPath = publicPaths.some((path) => currentPath.startsWith(path));
      if (!isPublicPath) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const logout = () => API.get('/auth/logout');
export const refreshToken = () => API.get('/auth/refresh');
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const forgotPassword = (email) => API.post('/auth/forgotpassword', { email });
export const resetPassword = (token, password) => API.put(`/auth/resetpassword/${token}`, { password });
export const getProblems = (params) => API.get('/problems', { params });
export const getProblem = (slug) => API.get(`/problems/${slug}`);
export const createProblem = (data) => API.post('/problems', data);
export const updateProblem = (id, data) => API.put(`/problems/${id}`, data);
export const deleteProblem = (id) => API.delete(`/problems/${id}`);
export const getTags = () => API.get('/problems/tags');
export const runCode = (data) => API.post('/coding/run', data);
export const submitCode = (data) => API.post('/coding/submit', data);
export const runSQLCode = (data) => API.post('/submissions/sql/run', data);
export const submitSQLCode = (data) => API.post('/submissions/sql/submit', data);
export const getSubmissions = (params) => API.get('/submissions', { params });
export const getSubmission = (id) => API.get(`/submissions/${id}`);
export const getProfile = () => API.get('/profile');
export const getRecommendations = () => API.get('/recommendations');
export const addToRevision = (problemId) => API.post('/recommendations/revision', { problemId });
export const removeFromRevision = (problemId) => API.delete(`/recommendations/revision/${problemId}`);
export const analyzeResumeFile = (file, role) => {
  const formData = new FormData();
  formData.append('resume', file);
  if (role) formData.append('role', role);
  return API.post('/ats/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getRoleRequirements = () => API.get('/role-requirements');
export const matchJD = (resumeText, jobDescription) => API.post('/jd-match/match', { resumeText, jobDescription });
export const getAnalytics = (params) => API.get('/analytics', { params });
export const getAdminAnalytics = () => API.get('/analytics/admin');

// Per-module analytics (category: dsa | sql | aptitude | overall)
export const getCategorySummary = (category, userId) => API.get(`/analytics/${category}/summary/${userId}`);
export const getCategoryHeatmap = (category, userId) => API.get(`/analytics/${category}/heatmap/${userId}`);
export const getCategoryTopics = (category, userId) => API.get(`/analytics/${category}/topics/${userId}`);
// Platform-wide (admin-only) insights across all users
export const getPlatformAnalyticsAllUsers = () => API.get('/analytics/overall/allusers');
export const getTopicProgress = () => API.get('/topics/progress');
export const getTopicDetails = (topic) => API.get(`/topics/${topic}`);
export const getConceptNotes = () => API.get('/topics/notes/all');
export const getCompanies = () => API.get('/companies');
export const getCompanyProblems = (company) => API.get(`/companies/${company}/problems`);
export const getCompanyInfo = (company) => API.get(`/companies/${company}`);
export const createMistake = (data) => API.post('/mistakes', data);
export const getMyMistakes = (params) => API.get('/mistakes', { params });
export const updateMistakeStatus = (id, status) => API.patch(`/mistakes/${id}`, { status });
export const updateGoals = (data) => API.patch('/goals', data);
export const getGoalProgress = () => API.get('/goals/progress');
export const getInterviewReadiness = () => API.get('/readiness');
export const getAdminUsers = (params) => API.get('/admin/users', { params });
export const getAdminUser = (id) => API.get(`/admin/users/${id}`);
export const updateUserRole = (id, role) => API.put(`/admin/users/${id}/role`, { role });
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);
export const uploadProfilePicture = (file) => {
  const formData = new FormData();
  formData.append('profile', file);
  return API.post('/ats/upload-profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const saveDraft = (data) => API.post('/drafts', data);
export const getDraft = (params) => API.get('/drafts', { params });
export const getAllDrafts = () => API.get('/drafts/all');
export const deleteDraft = (data) => API.delete('/drafts', { data });
export const getCodingProblems = (params) => API.get('/coding-problems', { params });
export const getCodingProblem = (slug) => API.get(`/coding-problems/${slug}`);
export const getCodingTags = () => API.get('/coding-problems/tags');
export const getCodingTopics = () => API.get('/coding-problems/topics');
export const getCodingCompanies = () => API.get('/coding-problems/companies');
export const getCodingProblemStats = () => API.get('/coding-problems/stats');
export const likeCodingProblem = (problemId, action) => API.post(`/coding-problems/${problemId}/like`, { action });
export const getCodingSubmissions = (params) => API.get('/coding/submissions', { params });
export const generateDSAProblem = (data) => API.post('/dsa/generate', data);
export const getCodingSubmission = (id) => API.get(`/coding/submissions/${id}`);

// Interview Experiences
export const getInterviewExperiences = (params) => API.get('/interview-experiences', { params });
export const getInterviewExperience = (id) => API.get(`/interview-experiences/${id}`);
export const createInterviewExperience = (data) => API.post('/interview-experiences', data);
export const updateInterviewExperience = (id, data) => API.put(`/interview-experiences/${id}`, data);
export const deleteInterviewExperience = (id) => API.delete(`/interview-experiences/${id}`);
export const voteInterviewExperience = (id, voteType) => API.post(`/interview-experiences/${id}/vote`, { voteType });
export const getMyInterviewExperiences = () => API.get('/interview-experiences/my');

// Leaderboard
export const getLeaderboard = (params) => API.get('/leaderboard', { params });
export const getLeaderboardByCategory = (category, params) => API.get(`/leaderboard/${category}`, { params });
export const getMyLeaderboardStats = () => API.get('/leaderboard/me');
export const updateLeaderboard = () => API.post('/leaderboard/update');

// Progress Export
export const exportProgress = () => API.get('/progress/export');

// Mock Interview
export const startMockInterview = (data) => API.post('/mock-interview/start', data);
export const submitMockAnswer = (data) => API.post('/mock-interview/answer', data);
export const getMockInterviewResult = (id) => API.get(`/mock-interview/result/${id}`);

// Practice History
export const getPracticeHistory = (params) => API.get('/submissions/history', { params });
export const getPracticeSummary = (userId) => API.get(`/submissions/summary/${userId}`);
export const getPracticeLanguages = (userId) => API.get(`/submissions/languages/${userId}`);
export const getPracticeSkills = (userId) => API.get(`/submissions/skills/${userId}`);
export const getPracticeStreak = (userId) => API.get(`/submissions/streak/${userId}`);
export const getPracticeRecent = (userId, limit = 10) => API.get(`/submissions/recent/${userId}`, { params: { limit } });
export const createPracticeRecord = (submissionId) => API.post('/submissions', { submissionId });

export default API;
