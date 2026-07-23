import axios from 'axios';
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
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
export const getProblems = (params) => API.get('/problems', { params });
export const getProblem = (slug) => API.get(`/problems/${slug}`);
export const createProblem = (data) => API.post('/problems', data);
export const updateProblem = (id, data) => API.put(`/problems/${id}`, data);
export const deleteProblem = (id) => API.delete(`/problems/${id}`);
export const getTags = () => API.get('/problems/tags');
export const runCode = (data) => API.post('/submissions/run', data);
export const submitCode = (data) => API.post('/submissions/submit', data);
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
export const getAnalytics = () => API.get('/analytics');
export const getAdminAnalytics = () => API.get('/analytics/admin');
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
export default API;
