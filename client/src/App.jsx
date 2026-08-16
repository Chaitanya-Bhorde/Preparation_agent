import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { LOADING_SPINNER } from './utils/ui';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Problems = lazy(() => import('./pages/Problems'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ProblemDetail = lazy(() => import('./pages/ProblemDetail'));
const CodingProblemDetail = lazy(() => import('./pages/CodingProblemDetail'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Resume = lazy(() => import('./pages/Resume'));
const Admin = lazy(() => import('./pages/Admin'));
const Topics = lazy(() => import('./pages/Topics'));
const Companies = lazy(() => import('./pages/Companies'));
const Mistakes = lazy(() => import('./pages/Mistakes'));
const Goals = lazy(() => import('./pages/Goals'));
const Readiness = lazy(() => import('./pages/Readiness'));
const Leaderboard = lazy(() => import('./pages/GlobalLeaderboardPage'));
const ProgressExport = lazy(() => import('./pages/ProgressExport'));
const MockInterview = lazy(() => import('./pages/MockInterview'));
const PracticeHistory = lazy(() => import('./pages/PracticeHistory'));
const InterviewExperiences = lazy(() => import('./pages/InterviewExperiences'));
const DSAPractice = lazy(() => import('./pages/DSAPractice'));
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  return user ? children : <Navigate to="/login" />;
}
const PageLoading = () => (
  <div className={LOADING_SPINNER}>
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      <span className="text-gray-500 text-sm">Loading page...</span>
    </div>
  </div>
);

function App() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  }
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-950">
        {user && <Navbar />}
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/problems" element={<PrivateRoute><Problems /></PrivateRoute>} />
            <Route path="/problems/:slug" element={<PrivateRoute><ProblemDetail /></PrivateRoute>} />
            <Route path="/coding-problems" element={<PrivateRoute><Problems /></PrivateRoute>} />
            <Route path="/coding-problems/:slug" element={<PrivateRoute><CodingProblemDetail /></PrivateRoute>} />
            <Route path="/practice/dsa" element={<PrivateRoute><DSAPractice /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
            <Route path="/resume" element={<PrivateRoute><Resume /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
            <Route path="/topics" element={<PrivateRoute><Topics /></PrivateRoute>} />
            <Route path="/companies" element={<PrivateRoute><Companies /></PrivateRoute>} />
            <Route path="/companies/:slug" element={<PrivateRoute><Companies /></PrivateRoute>} />
            <Route path="/mistakes" element={<PrivateRoute><Mistakes /></PrivateRoute>} />
            <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
            <Route path="/readiness" element={<PrivateRoute><Readiness /></PrivateRoute>} />
            <Route path="/leaderboard" element={<PrivateRoute><GlobalLeaderboardPage /></PrivateRoute>} />
            <Route path="/progress-export" element={<PrivateRoute><ProgressExport /></PrivateRoute>} />
            <Route path="/interview-experiences" element={<PrivateRoute><InterviewExperiences /></PrivateRoute>} />
            <Route path="/mock-interview" element={<PrivateRoute><MockInterview /></PrivateRoute>} />
            <Route path="/practice-history" element={<PrivateRoute><PracticeHistory /></PrivateRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
export default App;