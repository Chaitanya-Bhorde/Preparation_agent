import { useState, useEffect } from 'react';
import { getCodingSubmissions } from '../../api';
import {
  Loader2, CheckCircle, XCircle, AlertTriangle, Terminal, Clock,
  ChevronLeft, ChevronRight, Copy, Check,
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

const PAGE_SIZE = 10;

/**
 * SubmissionHistory — the authenticated user's OWN DSA submission history.
 *
 * Every row shows the verdict, the language, the pass/total counts and the
 * timestamp, and expands to reveal the exact submitted source with a
 * Copy button. Authorization is enforced server-side: the list and the
 * single-submission endpoints are both scoped to `req.user.id`, so another
 * user's code is never reachable through this component.
 */
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
  const [copiedId, setCopiedId] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (open === false) return;
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId, statusFilter, languageFilter, page, open]);

  const fetchSubmissions = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await getCodingSubmissions({
        problemId,
        status: statusFilter || undefined,
        language: languageFilter || undefined,
        page,
        limit: PAGE_SIZE,
      });
      // The endpoint exposes the same array as `data` and `submissions`; accept
      // either so a response-shape change can never silently empty this list.
      const rows = data.submissions || data.data || [];
      setSubmissions(rows);
      setTotal(data.total ?? rows.length);
      setTotalPages(Math.max(1, data.totalPages || 1));
    } catch (error) {
      console.error('Failed to load submissions:', error);
      setSubmissions([]);
      setTotal(0);
      setTotalPages(1);
      setLoadError('Could not load your submission history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async (submission) => {
    if (!submission?.code) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(submission.code);
      } else {
        // Fallback for browsers without the async clipboard API (insecure
        // origins), so "copy" is never a dead button.
        const ta = document.createElement('textarea');
        ta.value = submission.code;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedId(submission._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const renderVerdict = (verdict) => {
    const style = VERDICT_STYLES[verdict] || VERDICT_STYLES.WrongAnswer;
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${style.cls}`}>
        <Icon className="w-3 h-3" />
        {VERDICT_LABELS[verdict] || verdict}
      </span>
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">{title}</h3>
        {onClose && (
          <button type="button" onClick={onClose} className="text-xs text-gray-400 hover:text-white">Close</button>
        )}
      </div>

      <div className="mb-3">
        <label className="text-xs text-gray-400 mb-1 block">Status</label>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => { setStatusFilter(filter); setPage(1); }}
              className={
                filter === statusFilter
                  ? 'px-2 py-1 rounded text-blue-600 bg-blue-900/20 text-blue-300'
                  : 'px-2 py-1 rounded text-gray-400 hover:bg-gray-700 hover:text-white'
              }
              style={{ fontSize: '0.75rem' }}
            >
              {VERDICT_LABELS[filter] || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="text-xs text-gray-400 mb-1 block">Language</label>
        <div className="flex flex-wrap gap-2">
          {LANG_FILTERS.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => { setLanguageFilter(lang); setPage(1); }}
              className={
                lang === languageFilter
                  ? 'px-2 py-1 rounded text-blue-600 bg-blue-900/20 text-blue-300'
                  : 'px-2 py-1 rounded text-gray-400 hover:bg-gray-700 hover:text-white'
              }
              style={{ fontSize: '0.75rem' }}
            >
              {lang || 'all'}
            </button>
          ))}
        </div>
      </div>

      {loadError && <p className="text-sm text-red-400 mb-3" role="alert">{loadError}</p>}

      {!loadError && submissions.length === 0 && (
        <div className="text-center py-6">
          <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50 text-gray-500" />
          <p className="text-gray-500">No submissions found</p>
          {(statusFilter || languageFilter) && (
            <p className="text-gray-400 text-sm">Try clearing the filters above.</p>
          )}
        </div>
      )}

      {submissions.length > 0 && (
        <>
          <p className="text-xs text-gray-500 mb-2">
            Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total} submission{total === 1 ? '' : 's'}
          </p>
          <ul className="space-y-2">
            {submissions.map((sub) => {
              const isOpen = expandedId === sub._id;
              return (
                <li key={sub._id} className="rounded-lg border border-gray-800 bg-gray-900/40">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : sub._id)}
                    className="w-full text-left p-3 hover:bg-gray-800/40 rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {renderVerdict(sub.verdict)}
                      <span className="text-xs text-gray-400 capitalize">{sub.language || 'unknown'}</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : 'unknown time'}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      <span>{sub.passedTestCases ?? 0}/{sub.totalTestCases ?? 0} passed</span>
                      {typeof sub.runtimeMs === 'number' && sub.runtimeMs > 0 && <span>{sub.runtimeMs}ms</span>}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3">
                      {sub.code ? (
                        <div className="mt-2 max-h-40 overflow-auto rounded border bg-gray-950 text-xs text-gray-300">
                          <pre className="p-2 whitespace-pre-wrap font-mono">{sub.code}</pre>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 mt-2">No code was stored for this submission.</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => copyCode(sub)}
                          disabled={!sub.code}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white text-xs rounded"
                        >
                          {copiedId === sub._id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          {copiedId === sub._id ? 'Copied' : 'Copy code'}
                        </button>
                        {onResubmit && (
                          <button
                            type="button"
                            onClick={() => onResubmit(sub.code)}
                            disabled={!sub.code}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs rounded"
                          >
                            Use this code
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white text-xs"
          >
            <ChevronLeft className="w-3 h-3" /> Previous
          </button>
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white text-xs"
          >
            Next <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
