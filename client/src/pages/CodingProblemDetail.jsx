import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getCodingProblem, runCode, submitCode, getCodingSubmissions, getCodingSubmission, getDraft, saveDraft } from '../api';
import { useAuth } from '../context/AuthContext';
import { Play, CheckCircle, XCircle, Loader2, ArrowLeft, AlertTriangle, Clock, Terminal, BookOpen, History, Lightbulb, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { LOADING_SPINNER, DIFFICULTY_COLORS, BUTTON_CLASSES, SELECT_CLASSES } from '../utils/ui';

const STATUS_CONFIG = {
  Accepted: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20', label: 'Accepted' },
  WrongAnswer: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20', label: 'Wrong Answer' },
  CompileError: { icon: Terminal, color: 'text-orange-400', bg: 'bg-orange-900/20', label: 'Compilation Error' },
  RuntimeError: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-900/20', label: 'Runtime Error' },
  TLE: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-900/20', label: 'Time Limit Exceeded' },
};

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
];

const MONACO_LANG_MAP = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
};

export default function CodingProblemDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [bottomTab, setBottomTab] = useState('testcase');
  const [customTestcases, setCustomTestcases] = useState([]);
  const [visibleTestcases, setVisibleTestcases] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedSubmissionLoading, setSelectedSubmissionLoading] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftFound, setDraftFound] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => { loadProblem(); }, [slug]);

  useEffect(() => {
    if (!problem || !user || initialized) return;
    let cancelled = false;
    async function loadDraft() {
      try {
        const { data } = await getDraft({ problemId: problem._id, language });
        if (!cancelled && data.success && data.data && data.data.code) {
          setCode(data.data.code);
          setDraftFound(true);
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      } finally {
        if (!cancelled) {
          setDraftLoaded(true);
          setInitialized(true);
        }
      }
    }
    loadDraft();
    return () => { cancelled = true; };
  }, [problem ? problem._id : null, language, user, initialized]);

  useEffect(() => {
    if (!problem || !user) return;
    if (!draftLoaded) return;
    if (draftFound) return;
    const starter = problem.starterCode?.[language] || getDefaultCode(language);
    setCode(starter);
  }, [language, problem, user, draftLoaded, draftFound]);

  const loadProblem = async () => {
    try {
      const { data } = await getCodingProblem(slug);
      setProblem(data.data);
      setDraftLoaded(false);
      setDraftFound(false);
      setInitialized(false);
      if (data.data && data.data.visibleTestCases) {
        setVisibleTestcases(data.data.visibleTestCases.map((tc, i) => ({ ...tc, id: `sample-${i}`, editable: false })));
      }
    } catch (error) {
      toast.error('Failed to load problem');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    if (!problem) return;
    setSubmissionsLoading(true);
    setSelectedSubmission(null);
    try {
      const { data } = await getCodingSubmissions({ problemId: problem._id, limit: 20 });
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
      const { data } = await getCodingSubmission(submissionId);
      if (data.success) {
        setSelectedSubmission(data.data);
      }
    } catch (error) {
      console.error('Failed to load submission:', error);
    } finally {
      setSelectedSubmissionLoading(false);
    }
  };

  const restoreSubmission = (submissionCode) => {
    setCode(submissionCode);
    setActiveTab('description');
    setBottomTab('result');
    toast.success('Submission restored to editor');
  };

  const getDefaultCode = (lang) => {
    const defaults = {
      javascript: `function solve(input) {\n  // Your code here\n  return input;\n}\n`,
      python: `def solve(input):\n    # Your code here\n    return input\n`,
      java: `class Solution {\n    public static String solve(String input) {\n        // Your code here\n        return input;\n    }\n}`,
      cpp: `string solve(string input) {\n    // Your code here\n    return input;\n}`,
    };
    return defaults[lang] || defaults.javascript;
  };

  const addCustomTestcase = () => {
    setCustomTestcases([...customTestcases, { input: '', expectedOutput: '', id: `custom-${Date.now()}` }]);
    setBottomTab('testcase');
  };

  const updateCustomTestcase = (id, field, value) => {
    setCustomTestcases(customTestcases.map(tc => tc.id === id ? { ...tc, [field]: value } : tc));
  };

  const removeCustomTestcase = (id) => {
    setCustomTestcases(customTestcases.filter(tc => tc.id !== id));
  };

  const handleRun = async () => {
    if (!code.trim()) { toast.error('Please write some code first'); return; }
    setRunning(true);
    setResult(null);
    setBottomTab('result');
    try {
      const { data } = await runCode({ problemId: problem._id, code, language });
      const runResult = { ...data.data, mode: 'run' };
      setResult(runResult);
      if (data.data.status === 'accepted') toast.success('Sample tests passed!');
      else if (data.data.status === 'compilation_error') toast.error('Compilation failed');
      else if (data.data.status === 'runtime_error') toast.error('Runtime error occurred');
      else toast.error('Sample tests failed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to run code');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) { toast.error('Please write some code first'); return; }
    setSubmitting(true);
    setResult(null);
    setBottomTab('result');
    try {
      const { data } = await submitCode({ problemId: problem._id, code, language });
      const submitResult = { ...data.data, mode: 'submit' };
      setResult(submitResult);
      if (data.data.verdict === 'Accepted') {
        toast.success('All test cases passed!');
        try {
          const { getMe, getAnalytics, getTopicProgress, getGoalProgress } = await import('../api');
          await Promise.all([getMe(), getAnalytics(), getTopicProgress(), getGoalProgress()]);
          window.dispatchEvent(new Event('profile-updated'));
        } catch (e) {
          console.error('Failed to refresh stats after submit:', e);
        }
      } else if (data.data.errorType === 'CompileError') toast.error('Compilation failed');
      else if (data.data.errorType === 'RuntimeError') toast.error('Runtime error occurred');
      else toast.error(`${data.data.passedTestCases}/${data.data.totalTestCases} test cases passed`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (submitting || running) return;
      handleSubmit();
    }
  }, [code, problem, submitting, running]);

  const difficultyColor = (d) => DIFFICULTY_COLORS[d] || DIFFICULTY_COLORS.easy;
  const getStatusConfig = (status) => STATUS_CONFIG[status] || { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20', label: status };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'submissions') loadSubmissions();
  };

  const runTestCaseInputs = [...visibleTestcases, ...customTestcases];
  const saveTimerRef = { current: null };

  useEffect(() => {
    if (!problem || !user || !initialized) return;
    if (!code) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await saveDraft({ problemId: problem._id, language, code });
      } catch (error) {
        console.error('Auto-save draft failed:', error);
      }
    }, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [code, problem, language, user, initialized]);

  if (loading) {
    return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  }
  if (!problem) {
    return <div className={LOADING_SPINNER}><span className="text-gray-400">Problem not found</span></div>;
  }

  return (
    <div className="h-[calc(100vh-57px)] bg-gray-950 flex flex-col" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/coding-problems" className="text-gray-400 hover:text-white shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-white font-semibold truncate">{problem.title}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${difficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 shrink-0">{problem.topic}</span>
          <div className="hidden md:flex gap-1 text-xs text-gray-500">
            {problem.tags?.map((tag) => (<span key={tag} className="bg-gray-800 px-2 py-0.5 rounded">{tag}</span>))}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className={SELECT_CLASSES}>
            {LANGUAGES.map((l) => (<option key={l.id} value={l.id}>{l.label}</option>))}
          </select>
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
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${activeTab === 'description' ? 'text-white border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
              <BookOpen className="w-4 h-4" /> Description
            </button>
            <button onClick={() => handleTabChange('submissions')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${activeTab === 'submissions' ? 'text-white border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
              <History className="w-4 h-4" /> Submissions
            </button>
            <button onClick={() => handleTabChange('solutions')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${activeTab === 'solutions' ? 'text-white border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
              <Lightbulb className="w-4 h-4" /> Solutions
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'description' && (
              <>
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">{problem.description}</div>
                {problem.examples?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-white font-semibold mb-3">Examples</h3>
                    {problem.examples.map((ex, idx) => (
                      <div key={idx} className="bg-gray-900 rounded-lg p-4 mb-3 border border-gray-800">
                        <p className="text-gray-400 text-sm mb-1">Input:</p>
                        <pre className="bg-gray-950 p-2 rounded text-gray-300 text-sm mb-2 overflow-x-auto">{ex.input}</pre>
                        <p className="text-gray-400 text-sm mb-1">Output:</p>
                        <pre className="bg-gray-950 p-2 rounded text-gray-300 text-sm mb-2 overflow-x-auto">{ex.output}</pre>
                        {ex.explanation && (<><p className="text-gray-400 text-sm mb-1">Explanation:</p><p className="text-gray-300 text-sm">{ex.explanation}</p></>)}
                      </div>
                    ))}
                  </div>
                )}
                {problem.constraints && problem.constraints.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-white font-semibold mb-2">Constraints</h3>
                    <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                      {problem.constraints.map((c, i) => (<li key={i}>{c}</li>))}
                    </ul>
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
                    <p>No submissions yet. Write some code and hit Submit!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {submissions.map((sub) => {
                      const cfg = getStatusConfig(sub.verdict);
                      const Icon = cfg.icon;
                      const isSelected = selectedSubmission && selectedSubmission._id === sub._id;
                      return (
                        <div key={sub._id}
                          onClick={() => viewSubmission(sub._id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-blue-500 bg-blue-900/20' : `${cfg.bg} border-gray-800 hover:border-gray-700`}`}>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                            <span className={`text-sm ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-gray-500 text-xs ml-auto">{new Date(sub.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            <span>{sub.passedTestCases}/{sub.totalTestCases} passed</span>
                            <span>{sub.runtimeMs || 0}ms</span>
                            <span>{sub.memoryKb || 0}KB</span>
                            <span className="capitalize">{sub.language}</span>
                          </div>
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-gray-700">
                              {selectedSubmissionLoading ? (
                                <div className="text-gray-400 text-center py-2"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
                              ) : selectedSubmission && selectedSubmission.code && (
                                <div>
                                  <pre className="bg-gray-950 p-3 rounded text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border border-gray-800">
                                    {selectedSubmission.code}
                                  </pre>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); restoreSubmission(selectedSubmission.code); }}
                                    className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded flex items-center gap-1.5">
                                    Restore to editor
                                  </button>
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
            {activeTab === 'solutions' && (
              <div className="text-gray-400 text-center py-8">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Solutions are available after solving the problem.</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-1/2 flex flex-col">
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={MONACO_LANG_MAP[language] || 'javascript'}
              value={code}
              onChange={(value) => setCode(value || '')}
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

          <div className="border-t border-gray-800 bg-gray-900 flex flex-col shrink-0" style={{ maxHeight: '40%' }}>
            <div className="flex border-b border-gray-800 shrink-0">
              <button onClick={() => setBottomTab('testcase')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${bottomTab === 'testcase' ? 'text-white border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
                Testcase
              </button>
              <button onClick={() => setBottomTab('result')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${bottomTab === 'result' ? 'text-white border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
                Test Result
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {bottomTab === 'testcase' && (
                <div className="space-y-3">
                  {runTestCaseInputs.length === 0 && (
                    <div className="text-gray-500 text-sm text-center py-4">No test cases available.</div>
                  )}
                  {runTestCaseInputs.map((tc, idx) => (
                    <div key={tc.id} className="bg-gray-950 rounded-lg border border-gray-800 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 font-medium">Case {idx + 1}</span>
                        {!tc.editable && (
                          <button onClick={() => removeCustomTestcase(tc.id)} className="text-gray-600 hover:text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Input</label>
                          <textarea
                            value={tc.input}
                            onChange={(e) => updateCustomTestcase(tc.id, 'input', e.target.value)}
                            className="w-full bg-gray-900 text-gray-300 text-sm font-mono p-2 rounded border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
                            rows={1}
                            readOnly={tc.editable}
                          />
                        </div>
                        {tc.editable && (
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Expected Output</label>
                            <textarea
                              value={tc.expectedOutput}
                              onChange={(e) => updateCustomTestcase(tc.id, 'expectedOutput', e.target.value)}
                              className="w-full bg-gray-900 text-gray-300 text-sm font-mono p-2 rounded border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
                              rows={1}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <button onClick={addCustomTestcase} className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 py-2">
                    <Plus className="w-4 h-4" /> Add custom test case
                  </button>
                </div>
              )}
              {bottomTab === 'result' && (
                <div>
                  {!result ? (
                    <div className="text-gray-500 text-sm text-center py-4">
                      Click <span className="text-blue-400">Run</span> or <span className="text-green-400">Submit</span> to see test results
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        {(() => {
                          const cfg = getStatusConfig(result.verdict || result.status);
                          const Icon = cfg.icon;
                          return (<><Icon className={`w-5 h-5 ${cfg.color}`} /><span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-gray-500 text-sm ml-auto">{result.passedTestCases}/{result.totalTestCases} test cases passed</span>
                            {result.runtimeMs > 0 && <span className="text-gray-500 text-xs">{result.runtimeMs}ms</span>}
                            {result.memoryKb > 0 && <span className="text-gray-500 text-xs">{result.memoryKb}KB</span>}
                          </>);
                        })()}
                      </div>
                      {(result.errorMessage || result.errorType) && (
                        <div className="mb-3 p-3 bg-gray-950 rounded-lg border border-gray-800">
                          <p className="text-red-400 text-sm font-medium mb-1">
                            {result.errorType === 'CompileError' ? 'Compilation Error:' :
                             result.errorType === 'RuntimeError' ? 'Runtime Error:' :
                             result.errorType === 'TLE' ? 'Time Limit Exceeded:' : 'Error:'}
                          </p>
                          <pre className="text-red-300 text-xs whitespace-pre-wrap font-mono">{result.errorMessage}</pre>
                        </div>
                      )}
                      <div className="space-y-1">
                        {result.testCaseResults?.map((tc, idx) => {
                          const isError = tc.errorType && tc.errorType !== 'unknown';
                          const isHidden = !tc.isSample && result.mode === 'submit';
                          return (
                            <div key={idx} className={`p-2 rounded text-sm ${tc.passed ? 'bg-green-900/20' : isError ? 'bg-red-900/20' : 'bg-red-900/20'}`}>
                              <div className="flex items-center gap-2">
                                {tc.passed ? <CheckCircle className="w-3 h-3 text-green-400 shrink-0" /> :
                                 isError ? <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" /> : <XCircle className="w-3 h-3 text-red-400 shrink-0" />}
                                <span className="text-gray-300 text-xs">
                                  {isHidden ? `Test Case ${idx + 1} (Hidden)` : `Test Case ${idx + 1}${tc.isSample ? ' (Sample)' : ''}`}
                                </span>
                                {tc.executionTime > 0 && <span className="text-gray-500 text-xs ml-auto">{tc.executionTime}ms</span>}
                              </div>
                              {isHidden ? (
                                <div className="mt-1 text-xs text-gray-500">
                                  {tc.passed ? 'Passed' : 'Failed'}
                                </div>
                              ) : (
                                <>
                                  {tc.errorMessage && <pre className="mt-1 text-xs text-red-400 font-mono whitespace-pre-wrap">{tc.errorMessage}</pre>}
                                  {!tc.passed && !tc.errorMessage && (
                                    <div className="mt-1 text-xs space-y-1">
                                      {tc.expectedOutput && <p className="text-gray-400">Expected: <span className="text-green-400 font-mono">{tc.expectedOutput}</span></p>}
                                      <p className="text-gray-400">Got: <span className="text-red-400 font-mono">{tc.actualOutput || '(no output)'}</span></p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
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