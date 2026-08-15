import { useState, useEffect } from 'react';
import { getCodingSubmissions } from '../../api';
import {
  Loader2, CheckCircle, XCircle, AlertTriangle, Terminal, Clock,
  ChevronLeft, ChevronRight, RotateCcw, X,
} from 'lucide-react';

const VERDICT_STYLES = {
  Accepted: { icon: CheckCircle, cls: 'text-green-400' },
  WrongAnswer: { icon: XCircle, cls: 'text-red-400' },
  CompileError: { icon: Terminal, cls: 'text-orange-400' },
  RuntimeError: { icon: AlertTriangle, cls: 'text-red-400' },
  TLE: { icon: Clock, cls: 'text-yellow-400' },
};

const VERDICT_LABELS = {
  Accepted: 'Accepted', WrongAnswer: 'Wrong Answer', CompileError: 'Compilation Error',
  RuntimeError: 'Runtime Error', TLE: 'Time Limit Exceeded',
};

const STATUS_FILTERS = ['', 'Accepted', 'WrongAnswer', 'CompileError', 'RuntimeError', 'TLE'];
const LANG_FILTERS = ['', 'javascript', 'python', 'java', 'cpp', 'c', 'csharp'];

export default function SubmissionHistory({
  problemId,
  open,
  onClose,
  onResubmit,
  title = 'Submission History',
}) {
  const [submissions, setSubmissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const user = useAuth().user;

  useEffect(() => {
    fetchSubmissions();
  }, [problemId, statusFilter, languageFilter, page]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data } = await getCodingSubmissions({
        problemId,
        status: statusFilter || undefined,
        language: languageFilter || undefined,
        page,
        limit: 10,
      });
      setSubmissions(data.submissions || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      setSubmissions([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (filter) => {
    setStatusFilter(filter);
    setPage(1);
  };

  const handleLanguageChange = (filter) => {
    setLanguageFilter(filter);
    setPage(1);
  };

  const handlePageChange = (pageNum) => {
    setPage(pageNum);
  };

  const renderVerdict = (verdict) => {
    const style = VERDICT_STYLES[verdict] || VERDICT_STYLES.Accepted;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${style.cls}`}>
        <style.icon className="w-2 h-2" />
        {VERDICT_LABELS[verdict]}
      </span>
    );
  };

  const codePreview = (code) => {
    if (!code) return null;
    return (
      <div className="mt-2 max-h-40 overflow-auto rounded border bg-gray-800 text-xs text-gray-300">
        <pre className="p-2 break-all">{code}</pre>
      </div>
    );
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-400" />
        <p className="text-gray-500">Loading submission history...</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No submissions found</p>
        {statusFilter && <p className="text-gray-400 text-sm">Try adjusting filters</p>}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-white font-medium mb-3">{title}</h3>

      {/* Status Filter */}
      <div className="mb-3">
        <label className="text-xs text-gray-400 mb-1 block">Status</label>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => handleStatusChange(filter)}
              className{
                filter === statusFilter
                  ? 'px-2 py-1 rounded text-blue-600 bg-blue-900/20 text-blue-300'
                  : 'px-2 py-1 rounded text-gray-400 hover:bg-gray-700 hover:text-white'
              }
              style={{ fontSize: '0.75rem' }}
            >
              {VERDICT_LABELS[filter] || filter}
            </button>
          ))}
        </div>
      </div>

      {/* Language Filter */}
      <div className="mb-3">
        <label className="text-xs text-gray-400 mb-1 block">Language</label>
        <div className="flex flex-wrap gap-2">
          {LANG_FILTERS.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className{
                lang === languageFilter
                  ? 'px-2 py-1 rounded text-blue-600 bg-blue-900/20 text-blue-300'
                  : 'px-2 py-1 rounded text-gray-400 hover:bg-gray-700 hover:text-white'
              }
              style={{ fontSize: '0.75rem' }}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}