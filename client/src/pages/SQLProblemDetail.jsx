import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getSQLProblem, runSQLQuery, submitSQLQuery, getSQLSubmissions, getSQLSubmission } from '../api';
import { Play, CheckCircle, XCircle, Loader2, ArrowLeft, AlertTriangle, Clock, BookOpen, History, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { LOADING_SPINNER, DIFFICULTY_COLORS, BUTTON_CLASSES } from '../utils/ui';

const STATUS_CONFIG = {
  passed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20', label: 'Passed' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20', label: 'Failed' },
};

export default function SQLProblemDetail() {
  const { slug } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [bottomTab, setBottomTab] = useState('result');
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedSubmissionLoading, setSelectedSubmissionLoading] = useState(false);

  useEffect(() => { loadProblem(); }, [slug]);

  const loadProblem = async () => {
    try {
      const { data } = await getSQLProblem(slug);
      setProblem(data.data);
      setQuery('SELECT ');
    } catch (error) {
      toast.error('Failed to load SQL problem');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    if (!problem) return;
    setSubmissionsLoading(true);
    setSelectedSubmission(null);
    try {
      const { data } = await getSQLSubmissions({ problemId: problem._id, limit: 20 });
      setSubmissions(data.data || []);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const viewSubmission = async (submissionId) => {
    setSelectedSubmissionLoading(true);
    try {
      const { data } = await getSQLSubmission(submissionId);
      if (data.success) {
        setSelectedSubmission(data.data);
      }
    } catch (error) {
      console.error('Failed to load submission:', error);
    } finally {
      setSelectedSubmissionLoading(false);
    }
  };

  const handleRun = async () => {
    if (!query.trim()) { toast.error('Please write a SQL query first'); return; }
    setRunning(true);
    setResult(null);
    setBottomTab('result');
    try {
      const { data } = await runSQLQuery({ problemId: problem._id, query });
      setResult({ ...data.data, mode: 'run' });
      if (data.data.status === 'passed') toast.success('Sample tests passed!');
      else toast.error('Sample tests failed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to run query');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!query.trim()) { toast.error('Please write a SQL query first'); return; }
    setSubmitting(true);
    setResult(null);
    setBottomTab('result');
    try {
      const { data } = await submitSQLQuery({ problemId: problem._id, query });
      setResult({ ...data.data, mode: 'submit' });
      if (data.data.status === 'passed') {
        toast.success('All test cases passed!');
        window.dispatchEvent(new Event('profile-updated'));
      } else {
        toast.error(`${data.data.testCasesPassed}/${data.data.totalTestCases} test cases passed`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit query');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (submitting || running) return;
      handleSubmit();
    }
  }, [query, problem, submitting, running]);

  const difficultyColor = (d) => DIFFICULTY_COLORS[d] || DIFFICULTY_COLORS.easy;
  const getStatusConfig = (status) => STATUS_CONFIG[status] || { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20', label: status };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'submissions') loadSubmissions();
  };

  const renderTable = (rows, label) => {
    if (!rows || rows.length === 0) {
      return <div className="text-gray-500 text-xs py-2">No rows returned</div>;
    }
    const columns = Object.keys(rows[0]);
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-gray-950 rounded border border-gray-700 text-xs">
          <thead>
            <tr className="bg-gray-800">
              {columns.map((col, idx) => (
                <th key={idx} className="px-2 py-1.5 text-left text-gray-300 font-medium border-b border-gray-700 whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/30'}>
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="px-2 py-1.5 text-gray-300 border-t border-gray-800 whitespace-nowrap">
                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-gray-600 italic">null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>;
  }
  if (!problem) {
    return <div className={LOADING_SPINNER}><span className="text-gray-400">SQL problem not found</span></div>;
  }

  return (
    <div className="h-[calc(100vh-57px)] bg-gray-950 flex flex-col" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/sql" className="text-gray-400 hover:text-white shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
          <Database className="w-4 h-4 text-purple-400 shrink-0" />
          <h1 className="text-white font-semibold truncate">{problem.title}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${difficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400 shrink-0">{problem.topic}</span>
          <div className="hidden md:flex gap-1 text-xs text-gray-500">
            {problem.tags?.map((tag) => (<span key={tag} className="bg-gray-800 px-2 py-0.5 rounded">{tag}</span>))}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={handleRun} disabled={running || submitting} className={BUTTON_CLASSES.secondaryCompact}>
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Running...' : 'Run'}
          </button>
          <button onClick={handleSubmit} disabled={submitting || running} className={BUTTON_CLASSES.primaryCompact}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 flex flex-col overflow-hidden border-r border-gray-800">
          <div className="flex border-b border-gray-800 shrink-0">
            <button onClick={() => handleTabChange('description')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${activeTab === 'description' ? 'text-white border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}>
              <BookOpen className="w-4 h-4" /> Description
            </button>
            <button onClick={() => handleTabChange('submissions')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${activeTab === 'submissions' ? 'text-white border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}>
              <History className="w-4 h-4" /> Submissions
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'description' && (
              <>
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">{problem.description}</div>
                {problem.schemaSetupSQL && (
                  <div className="mt-6">
                    <h3 className="text-white font-semibold mb-3">Schema</h3>
                    <pre className="bg-gray-900 p-4 rounded-lg border border-gray-800 text-gray-300 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                      {problem.schemaSetupSQL}
                    </pre>
                  </div>
                )}
                {problem.sampleTestCases?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-white font-semibold mb-3">Expected Output (Sample)</h3>
                    {renderTable(problem.sampleTestCases[0]?.expectedOutputRows, 'Expected Output')}
                  </div>
                )}
              </>
            )}
            {activeTab === 'submissions' && (
              <div>
                {submissionsLoading ? (
                  <div className="text-gray-400 text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
                ) : submissions.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No submissions yet. Write a query and hit Submit!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {submissions.map((sub) => {
                      const cfg = getStatusConfig(sub.status);
                      const Icon = cfg.icon;
                      const isSelected = selectedSubmission && selectedSubmission._id === sub._id;
                      return (
                        <div key={sub._id}
                          onClick={() => viewSubmission(sub._id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-purple-500 bg-purple-900/20' : `${cfg.bg} border-gray-800 hover:border-gray-700`}`}>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                            <span className={`text-sm ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-gray-500 text-xs ml-auto">{new Date(sub.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            <span>{sub.testCasesPassed}/{sub.totalTestCases} passed</span>
                            <span className="capitalize">SQL</span>
                          </div>
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-gray-700">
                              {selectedSubmissionLoading ? (
                                <div className="text-gray-400 text-center py-2"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
                              ) : selectedSubmission && selectedSubmission.submittedQuery && (
                                <div>
                                  <pre className="bg-gray-950 p-3 rounded text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border border-gray-800">
                                    {selectedSubmission.submittedQuery}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="w-1/2 flex flex-col">
          <div className="flex-1 min-h-0">
            <div className="h-full flex flex-col">
              <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300 text-sm font-medium">SQL Query Editor</span>
              </div>
              <Editor
                height="100%"
                language="sql"
                value={query}
                onChange={(value) => setQuery(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>

          <div className="border-t border-gray-800 bg-gray-900 flex flex-col shrink-0" style={{ maxHeight: '40%' }}>
            <div className="flex border-b border-gray-800 shrink-0">
              <button onClick={() => setBottomTab('result')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${bottomTab === 'result' ? 'text-white border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}>
                Result
              </button>
              <button onClick={() => setBottomTab('testcases')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${bottomTab === 'testcases' ? 'text-white border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}>
                Test Cases
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {bottomTab === 'result' && (
                <div>
                  {!result ? (
                    <div className="text-gray-500 text-sm text-center py-4">
                      Click <span className="text-purple-400">Run</span> or <span className="text-green-400">Submit</span> to see results
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        {(() => {
                          const cfg = getStatusConfig(result.status);
                          const Icon = cfg.icon;
                          return (<><Icon className={`w-5 h-5 ${cfg.color}`} /><span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-gray-500 text-sm ml-auto">{result.testCasesPassed}/{result.totalTestCases} test cases passed</span>
                          </>);
                        })()}
                      </div>
                      {result.testCaseResults?.map((tc, idx) => {
                        const isSample = tc.isSample;
                        return (
                          <div key={idx} className={`mb-3 p-3 rounded-lg border ${tc.passed ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              {tc.passed ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                              <span className="text-gray-300 text-sm font-medium">
                                {isSample ? `Sample Test Case ${idx + 1}` : `Hidden Test Case ${idx + 1}`}
                              </span>
                              <span className="text-xs text-gray-500 ml-auto">{tc.passed ? 'Passed' : 'Failed'}</span>
                            </div>
                            {tc.error && (
                              <div className="mb-2 p-2 bg-red-950 rounded text-red-400 text-xs font-mono">{tc.error}</div>
                            )}
                            {!tc.passed && (
                              <div className="space-y-2">
                                {tc.missingRows?.length > 0 && (
                                  <div>
                                    <p className="text-orange-400 text-xs font-medium mb-1">Missing Rows (expected but not found):</p>
                                    {renderTable(tc.missingRows, 'Missing')}
                                  </div>
                                )}
                                {tc.extraRows?.length > 0 && (
                                  <div>
                                    <p className="text-yellow-400 text-xs font-medium mb-1">Extra Rows (found but not expected):</p>
                                    {renderTable(tc.extraRows, 'Extra')}
                                  </div>
                                )}
                                {tc.wrongValueRows?.length > 0 && (
                                  <div>
                                    <p className="text-red-400 text-xs font-medium mb-1">Wrong Values:</p>
                                    {tc.wrongValueRows.map((wv, wIdx) => (
                                      <div key={wIdx} className="mb-2 p-2 bg-gray-950 rounded border border-gray-800">
                                        <p className="text-gray-500 text-xs mb-1">Mismatched columns: {wv.mismatchedColumns?.join(', ')}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <p className="text-green-400 text-xs mb-1">Expected:</p>
                                            <pre className="text-green-300 text-xs font-mono">{JSON.stringify(wv.expected, null, 2)}</pre>
                                          </div>
                                          <div>
                                            <p className="text-red-400 text-xs mb-1">Got:</p>
                                            <pre className="text-red-300 text-xs font-mono">{JSON.stringify(wv.actual, null, 2)}</pre>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {tc.actualRows?.length > 0 && tc.expectedRows?.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div>
                                      <p className="text-green-400 text-xs font-medium mb-1">Expected Output:</p>
                                      {renderTable(tc.expectedRows, 'Expected')}
                                    </div>
                                    <div>
                                      <p className="text-red-400 text-xs font-medium mb-1">Your Output:</p>
                                      {renderTable(tc.actualRows, 'Actual')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {bottomTab === 'testcases' && (
                <div>
                  {!result || result.mode !== 'submit' ? (
                    <div className="text-gray-500 text-sm text-center py-4">
                      Submit your query to see per-test-case results
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {result.testCaseResults?.map((tc, idx) => (
                        <div key={idx} className={`p-2 rounded text-sm ${tc.passed ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                          <div className="flex items-center gap-2">
                            {tc.passed ? <CheckCircle className="w-3 h-3 text-green-400 shrink-0" /> : <XCircle className="w-3 h-3 text-red-400 shrink-0" />}
                            <span className="text-gray-300 text-xs">
                              {tc.isSample ? `Sample Test Case ${idx + 1}` : `Hidden Test Case ${idx + 1}`}
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">{tc.passed ? 'Passed' : 'Failed'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}