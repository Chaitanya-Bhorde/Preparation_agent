import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getSQLProblem, runSQLQuery, submitSQLQuery } from '../api';
import { Play, CheckCircle, XCircle, Loader2, ArrowLeft, BookOpen, Database } from 'lucide-react';
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
  const [bottomTab, setBottomTab] = useState('result');
  const [activeTab, setActiveTab] = useState('description');

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


  const renderResultTab = () => {
    if (!result) {
      return (
        <div className="text-gray-500 text-sm text-center py-4">
          Click <span className="text-purple-400">Run</span> or <span className="text-green-400">Submit</span> to see results inline below the editor
        </div>
      );
    }
    const isRun = result.mode === 'run';
    return (
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

        {/* RUN (or submit w/ sample): show the actual query result rows immediately below the editor */}
        {isRun && result.testCaseResults?.[0]?.actualRows?.length > 0 && (
          <div className="mb-4 p-3 bg-gray-950 rounded-lg border border-gray-800">
            <p className="text-blue-400 text-sm font-medium mb-2">Query Result (actual rows)</p>
            {renderTable(result.testCaseResults[0].actualRows, 'Query Result')}
          </div>
        )}

        {result.testCaseResults?.map((tc, idx) => {
          const isSample = tc.isSample;
          const hasRows = (tc.actualRows?.length > 0) || (tc.expectedRows?.length > 0);
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
                </div>
              )}
              {/* EXPECTED vs ACTUAL — shown side-by-side for EVERY case (pass or fail) so you can compare without extra clicks */}
              {hasRows && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="text-green-400 text-xs font-medium mb-1">Expected Output:</p>
                    {tc.expectedRows?.length > 0 ? renderTable(tc.expectedRows, 'Expected') : <div className="text-gray-600 text-xs py-2">(not shown)</div>}
                  </div>
                  <div>
                    <p className="text-red-400 text-xs font-medium mb-1">Your Output (actual):</p>
                    {tc.actualRows?.length > 0 ? renderTable(tc.actualRows, 'Actual') : <div className="text-gray-600 text-xs py-2">(no rows)</div>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTestCasesTab = () => {
    if (!result || result.mode !== 'submit') {
      return (
        <div className="text-gray-500 text-sm text-center py-4">
          Submit your query to see per-test-case results
        </div>
      );
    }
    return (
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
    );
  };

  if (loading) {
    return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>;
  }
  if (!problem) {
    return <div className={LOADING_SPINNER}><span className="text-gray-400">SQL problem not found</span></div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col" onKeyDown={handleKeyDown} tabIndex={0}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link to="/sql" className="text-gray-400 hover:text-white shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-white font-semibold text-lg truncate">#{problem.problemNumber} {problem.title}</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 font-medium ${difficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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

      {/* Tags row */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border-b border-gray-800 shrink-0 flex-wrap">
        {(problem.topics || []).map((t) => (
          <span key={t} className="text-xs px-2 py-1 rounded-full bg-purple-900/30 text-purple-400">{t}</span>
        ))}
        {(problem.tags || []).map((t) => (
          <span key={t} className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">{t}</span>
        ))}
      </div>

      {/* Split Panel */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Description */}
        <div className="w-1/2 flex flex-col overflow-hidden border-r border-gray-800">
          <div className="flex border-b border-gray-800 shrink-0">
            <button onClick={() => setActiveTab('description')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${activeTab === 'description' ? 'text-white border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
              <BookOpen className="w-4 h-4" /> Description
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'description' && (
              <>

                {/* Schema inline */}
                {problem.schemaTables?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold mb-3">Table Schema</h3>
                    <div className="space-y-3">
                      {problem.schemaTables.map((table, tIdx) => (
                        <div key={tIdx} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                          <div className="px-3 py-1.5 bg-gray-800/50 border-b border-gray-800">
                            <span className="text-blue-400 font-medium text-sm">{table.tableName}</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-xs">
                              <thead>
                                <tr className="bg-gray-800/30">
                                  <th className="px-3 py-1.5 text-left text-gray-400 font-medium border-b border-gray-800">Column</th>
                                  <th className="px-3 py-1.5 text-left text-gray-400 font-medium border-b border-gray-800">Type</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(table.columns || []).map((col, cIdx) => (
                                  <tr key={cIdx} className={cIdx % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/30'}>
                                    <td className="px-3 py-1.5 text-gray-300 border-t border-gray-800 font-mono">{col.name}</td>
                                    <td className="px-3 py-1.5 text-gray-400 border-t border-gray-800 font-mono">{col.type}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {table.notes && (
                            <div className="px-3 py-1.5 bg-gray-900/30 border-t border-gray-800">
                              <p className="text-gray-500 text-xs italic">{table.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed mb-6">{problem.description}</div>
                {/* Examples */}
                {problem.examples?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold mb-3">Examples</h3>
                    <div className="space-y-4">
                      {problem.examples.map((example) => (
                        <div key={example.exampleNumber} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                          <div className="px-3 py-1.5 bg-gray-800/50 border-b border-gray-800">
                            <span className="text-white font-medium text-sm">Example {example.exampleNumber}:</span>
                          </div>
                          {(example.inputTables || []).map((inputTable, idx) => (
                            <div key={idx} className="px-4 py-3 border-b border-gray-800">
                              <p className="text-gray-400 text-xs mb-2 font-medium">Input:</p>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse bg-gray-950 rounded border border-gray-700 text-xs">
                                  <thead>
                                    <tr className="bg-gray-800">
                                      {inputTable.rows?.[0] && Object.keys(inputTable.rows[0]).map((col) => (
                                        <th key={col} className="px-3 py-2 text-left text-gray-300 font-medium border-b border-gray-700 whitespace-nowrap">{col}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(inputTable.rows || []).map((row, rIdx) => (
                                      <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/30'}>
                                        {Object.values(row).map((val, cIdx) => (
                                          <td key={cIdx} className="px-3 py-2 text-gray-300 border-t border-gray-800 whitespace-nowrap">
                                            {val !== null && val !== undefined ? String(val) : <span className="text-gray-600 italic">null</span>}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                          {example.outputTable && (
                            <div className="px-4 py-3">
                              <p className="text-gray-400 text-xs mb-2 font-medium">Output:</p>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse bg-gray-950 rounded border border-gray-700 text-xs">
                                  <thead>
                                    <tr className="bg-gray-800">
                                      {(example.outputTable.columns || []).map((col) => (
                                        <th key={col} className="px-3 py-2 text-left text-gray-300 font-medium border-b border-gray-700 whitespace-nowrap">{col}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(example.outputTable.rows || []).map((row, rIdx) => (
                                      <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/30'}>
                                        {(example.outputTable.columns || []).map((col, cIdx) => {
                                          const val = row[col];
                                          return (
                                            <td key={cIdx} className="px-3 py-2 text-gray-300 border-t border-gray-800 whitespace-nowrap">
                                              {val !== null && val !== undefined ? String(val) : <span className="text-gray-600 italic">null</span>}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          {example.explanation && (
                            <div className="px-4 py-3 bg-gray-900/30 border-t border-gray-800">
                              <p className="text-gray-400 text-xs leading-relaxed">{example.explanation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Sample Test Cases */}
                {problem.sampleTestCases?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold mb-3">Sample Test Cases</h3>
                    <div className="space-y-3">
                      {problem.sampleTestCases.map((tc, idx) => (
                        <div key={idx} className="bg-gray-900 rounded-lg border border-gray-800 p-4">
                          <p className="text-gray-400 text-xs mb-2 font-medium">Case {idx + 1}</p>
                          <p className="text-gray-500 text-xs mb-1">Input State:</p>
                          <pre className="bg-gray-950 p-2 rounded text-gray-300 text-xs mb-2 overflow-x-auto">{tc.inputStateSQL}</pre>
                          <p className="text-gray-500 text-xs mb-1">Expected Output:</p>
                          <pre className="bg-gray-950 p-2 rounded text-gray-300 text-xs overflow-x-auto">{JSON.stringify(tc.expectedOutputRows)}</pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints?.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">Constraints</h3>
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
                      <ul className="space-y-1.5">
                        {problem.constraints.map((constraint, idx) => (
                          <li key={idx} className="text-gray-400 text-sm flex items-start gap-2">
                            <span className="text-gray-600 mt-0.5">•</span>
                            <span>{constraint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {/* RIGHT: Editor + Results (results render inline below the editor) */}
        <div className="w-1/2 flex flex-col">
          <div className="flex border-b border-gray-800 shrink-0">
            <button onClick={() => setBottomTab('result')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${bottomTab === 'result' ? 'text-white border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}>
              <BookOpen className="w-4 h-4" /> Result
            </button>
            <button onClick={() => setBottomTab('testcases')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${bottomTab === 'testcases' ? 'text-white border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}>
              <CheckCircle className="w-4 h-4" /> Test Cases
            </button>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Query Editor — ALWAYS visible on top */}
            <div className="h-[45%] shrink-0 border-b border-gray-800 flex flex-col">
              <div className="bg-gray-900 px-3 py-1.5 border-b border-gray-800 text-xs text-gray-400 flex items-center gap-1.5 shrink-0">
                <Database className="w-3.5 h-3.5 text-purple-400" /> SQL Query Editor
              </div>
              <div className="flex-1 min-h-0">
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
            {/* Results inline below the editor — no tab switch required to see output */}
            <div className="flex-1 overflow-y-auto p-4">
              {bottomTab === 'result' && renderResultTab()}
              {bottomTab === 'testcases' && renderTestCasesTab()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
