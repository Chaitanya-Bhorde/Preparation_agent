import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle2, XCircle, RotateCcw, Loader2, AlertCircle, ArrowLeft, Database, Clock } from 'lucide-react';
import { getSQLProblem, runSQLCode, submitSQLCode } from '../api';
import { PAGE_CONTAINER, CARD_CLASSES } from '../utils/ui';

const STATUS_META = {
  accepted: { label: 'Accepted', cls: 'bg-green-500/10 text-green-400 border border-green-500/30' },
  wrong_answer: { label: 'Wrong Answer', cls: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' },
  syntax_error: { label: 'Syntax Error', cls: 'bg-red-500/10 text-red-400 border border-red-500/30' },
  runtime_error: { label: 'Runtime Error', cls: 'bg-red-500/10 text-red-400 border border-red-500/30' },
  time_limit: { label: 'Time Limit Exceeded', cls: 'bg-red-500/10 text-red-400 border border-red-500/30' },
};

const DIFF_STYLES = {
  easy: 'text-green-400 bg-green-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  hard: 'text-red-400 bg-red-400/10',
};

function parseRows(json) {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

function ResultTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <p className="text-xs text-gray-500 italic px-2 py-1">No rows returned</p>;
  }
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded border border-gray-700">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-800">
            {cols.map((c) => (
              <th key={c} className="px-2 py-1.5 text-left font-medium text-gray-300 whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/60'}>
              {cols.map((c) => (
                <td key={c} className="px-2 py-1.5 text-gray-300 whitespace-nowrap">
                  {row[c] === null || row[c] === undefined ? <span className="text-gray-600 italic">NULL</span> : String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TestCaseCard({ tc, index }) {
  const actualRows = parseRows(tc.actualOutput);
  const expectedRows = parseRows(tc.expectedOutput);
  return (
    <div className={`rounded-lg border p-3 ${tc.passed ? 'border-green-800 bg-green-900/10' : 'border-red-800 bg-red-900/10'}`}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-300">Case {index + 1}</span>
        <div className="flex items-center gap-2">
          {typeof tc.executionTime === 'number' && tc.executionTime > 0 && (
            <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{tc.executionTime}ms</span>
          )}
          {tc.passed ? (
            <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Passed</span>
          ) : (
            <span className="text-xs text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> Failed</span>
          )}
        </div>
      </div>
      {tc.errorMessage && <p className="text-xs text-red-300 mb-2">{tc.errorMessage}</p>}
      <p className="text-xs text-gray-500 mb-1">Your output:</p>
      <ResultTable rows={actualRows} />
      {!tc.passed && expectedRows && (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">Expected output</summary>
          <div className="mt-1"><ResultTable rows={expectedRows} /></div>
        </details>
      )}
    </div>
  );
}

export default function SQLProblemDetail() {
  const { slug } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [actionError, setActionError] = useState(null);

  const fetchProblem = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await getSQLProblem(slug);
      if (data.success) setProblem(data.data);
      else setLoadError(data.message || 'Failed to load problem');
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) return;
      setLoadError(
        status === 404 ? 'SQL problem not found.'
        : status === 403 ? 'You are not authorized to view this problem.'
        : status >= 500 ? 'Server error. Please try again.'
        : err.message || 'Network error. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const timer = setTimeout(fetchProblem, 0);
    return () => clearTimeout(timer);
  }, [fetchProblem]);

  const toActionError = (err, fallback) => {
    const status = err.response?.status;
    if (status === 401) return 'Your session has expired. Please log in again.';
    if (status === 403) return 'You are not authorized to perform this action.';
    if (status === 404) return 'Problem not found.';
    if (status === 400) return err.response?.data?.message || 'Invalid request.';
    if (status >= 500) return 'Server error while executing your query. Please try again.';
    return err.message || fallback;
  };

  const handleRun = useCallback(async () => {
    if (!code.trim() || running || submitting) return;
    setRunning(true);
    setActionError(null);
    setSubmitResult(null);
    setRunResult(null);
    try {
      const { data } = await runSQLCode({ problemId: problem._id, code });
      if (data.success) setRunResult(data.data);
      else setActionError(data.message || 'Run failed');
    } catch (err) {
      setActionError(toActionError(err, 'Run failed. Please try again.'));
    } finally {
      setRunning(false);
    }
  }, [code, running, submitting, problem]);

  const handleSubmit = useCallback(async () => {
    if (!code.trim() || running || submitting) return;
    setSubmitting(true);
    setActionError(null);
    setRunResult(null);
    setSubmitResult(null);
    try {
      const { data } = await submitSQLCode({ problemId: problem._id, code });
      if (data.success) {
        setSubmitResult(data.data);
        if (data.data?.status === 'accepted') fetchProblem();
      } else {
        setActionError(data.message || 'Submission failed');
      }
    } catch (err) {
      setActionError(toActionError(err, 'Submission failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }, [code, running, submitting, problem, fetchProblem]);

  const handleReset = () => {
    setCode('');
    setRunResult(null);
    setSubmitResult(null);
    setActionError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (loadError || !problem) {
    return (
      <div className={PAGE_CONTAINER}>
        <div className={`${CARD_CLASSES} text-center py-12`}>
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-3">{loadError || 'Problem not found'}</p>
          <Link to="/practice/sql" className="text-blue-400 hover:text-blue-300 text-sm">Back to SQL Practice</Link>
        </div>
      </div>
    );
  }

  const statusMeta = submitResult ? STATUS_META[submitResult.status] : null;

  return (
    <div className={PAGE_CONTAINER}>
      <Link to="/practice/sql" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to SQL Practice
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Problem panel */}
        <div className="lg:col-span-2 space-y-4 min-w-0">
          <div className={CARD_CLASSES}>
            <h1 className="text-xl font-bold text-white mb-2">{problem.title}</h1>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded capitalize ${DIFF_STYLES[problem.difficulty] || 'text-gray-400 bg-gray-400/10'}`}>
                {problem.difficulty}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">{problem.topic}</span>
              {problem.userStatus === 'solved' && (
                <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Solved
                </span>
              )}
              {problem.userStatus === 'attempted' && (
                <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400">Attempted</span>
              )}
            </div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{problem.description}</p>
          </div>

          {Array.isArray(problem.schemaTables) && problem.schemaTables.length > 0 && (
            <div className={CARD_CLASSES}>
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-400" /> Database Schema
              </h2>
              <div className="space-y-3">
                {problem.schemaTables.map((t) => (
                  <div key={t.tableName} className="border border-gray-800 rounded-lg overflow-hidden">
                    <div className="bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-200">{t.tableName}</div>
                    <table className="w-full text-xs">
                      <tbody>
                        {t.columns.map((c) => (
                          <tr key={c.name} className="border-t border-gray-800">
                            <td className="px-3 py-1.5 text-gray-300">{c.name}</td>
                            <td className="px-3 py-1.5 text-gray-500 font-mono">{c.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {t.notes && <p className="px-3 py-1.5 text-xs text-gray-500 border-t border-gray-800">{t.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(problem.examples) && problem.examples.length > 0 && (
            <div className={CARD_CLASSES}>
              <h2 className="text-sm font-semibold text-white mb-3">Examples</h2>
              <div className="space-y-4">
                {problem.examples.map((ex) => (
                  <div key={ex.exampleNumber}>
                    <p className="text-xs font-medium text-gray-400 mb-2">Example {ex.exampleNumber}</p>
                    {(ex.inputTables || []).map((it) => (
                      <div key={it.tableName} className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">{it.tableName}:</p>
                        <ResultTable rows={it.rows || []} />
                      </div>
                    ))}
                    {ex.outputTable && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">Output:</p>
                        <ResultTable rows={ex.outputTable.rows || []} />
                      </div>
                    )}
                    {ex.explanation && <p className="text-xs text-gray-500 mt-1">Explanation: {ex.explanation}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(problem.constraints) && problem.constraints.length > 0 && (
            <div className={CARD_CLASSES}>
              <h2 className="text-sm font-semibold text-white mb-3">Constraints</h2>
              <ul className="space-y-1.5">
                {problem.constraints.map((c, i) => (
                  <li key={i} className="text-xs text-gray-400">• {c}</li>
                ))}
              </ul>
            </div>
          )}

          {problem.referenceSolutionSQL && (
            <div className={CARD_CLASSES}>
              <h2 className="text-sm font-semibold text-white mb-3">Reference Solution</h2>
              <pre className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto font-mono whitespace-pre-wrap">
                {problem.referenceSolutionSQL}
              </pre>
            </div>
          )}
        </div>

        {/* Editor panel */}
        <div className="lg:col-span-3 min-w-0">
          <div className={CARD_CLASSES}>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <button
                onClick={handleRun}
                disabled={running || submitting || !code.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run
              </button>
              <button
                onClick={handleSubmit}
                disabled={running || submitting || !code.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Submit
              </button>
              <button
                onClick={handleReset}
                disabled={running || submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <span className="text-xs text-gray-500 ml-auto hidden sm:block">Runs against an isolated sandbox database</span>
            </div>

            <div className="border border-gray-800 rounded-lg overflow-hidden" style={{ height: '340px' }}>
              <Editor
                height="100%"
                language="sql"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                loading={<div className="flex items-center justify-center h-full text-gray-500 text-sm">Loading editor…</div>}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  readOnly: running || submitting,
                  renderWhitespace: 'none',
                  padding: { top: 12 },
                }}
              />
            </div>

            {actionError && (
              <div className="flex items-start gap-3 p-3 bg-red-900/20 border border-red-800 rounded-lg mt-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{actionError}</p>
              </div>
            )}

            {(running || submitting) && (
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                {running ? 'Executing against sandbox…' : 'Evaluating all test cases…'}
              </div>
            )}

            {runResult && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">
                  Run Results <span className="text-xs text-gray-500 font-normal">(sample cases — not a submission)</span>
                </h3>
                <div className="space-y-2">
                  {(runResult.testCaseResults || []).map((tc, i) => (
                    <TestCaseCard key={i} tc={tc} index={i} />
                  ))}
                </div>
              </div>
            )}

            {submitResult && (
              <div className="mt-4">
                <div className={`rounded-lg border p-3 mb-3 ${statusMeta ? statusMeta.cls : ''}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-sm font-semibold">{statusMeta ? statusMeta.label : submitResult.status}</span>
                    <span className="text-xs text-gray-300">
                      Passed {submitResult.passedTestCases}/{submitResult.totalTestCases} test cases
                      {typeof submitResult.runtimeMs === 'number' && submitResult.runtimeMs > 0 && (
                        <span className="inline-flex items-center gap-1 ml-2"><Clock className="w-3 h-3" />{submitResult.runtimeMs}ms</span>
                      )}
                    </span>
                  </div>
                  {submitResult.status === 'accepted' && (
                    <p className="text-xs text-green-300 mt-1">Problem solved — your submission has been recorded.</p>
                  )}
                </div>
                <div className="space-y-2">
                  {(submitResult.testCaseResults || []).map((tc, i) => (
                    <TestCaseCard key={i} tc={tc} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
