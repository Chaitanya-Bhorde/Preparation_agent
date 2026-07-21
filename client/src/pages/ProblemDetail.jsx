import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getProblem, runCode, submitCode } from '../api';
import { Play, CheckCircle, XCircle, Loader2, ArrowLeft, AlertTriangle, Clock, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';

const LANGUAGE_VERSIONS = {
  javascript: '18.15.0',
  python: '3.10.0',
  java: '15.0.2',
  cpp: '10.2.0',
};

const STATUS_CONFIG = {
  accepted: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20', label: 'Accepted' },
  wrong_answer: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20', label: 'Wrong Answer' },
  compilation_error: { icon: Terminal, color: 'text-orange-400', bg: 'bg-orange-900/20', label: 'Compilation Error' },
  runtime_error: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-900/20', label: 'Runtime Error' },
  time_limit_exceeded: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-900/20', label: 'Time Limit Exceeded' },
};

export default function ProblemDetail() {
  const { slug } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    loadProblem();
  }, [slug]);

  useEffect(() => {
    setCode(getDefaultCode(language));
  }, [language]);

  const loadProblem = async () => {
    try {
      const { data } = await getProblem(slug);
      setProblem(data.data);
      setCode(getDefaultCode('javascript'));
    } catch (error) {
      toast.error('Failed to load problem');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCode = (lang) => {
    const defaults = {
      javascript: `function solve(input) {\n  return input;\n}\n`,
      python: `def solve(input):\n    return input\n`,
      java: `public class Solution {\n    public static int solve(int input) {\n        return input;\n    }\n}`,
      cpp: `#include <iostream>\nusing namespace std;\n\nint solve(int input) {\n    return input;\n}\n`,
    };
    return defaults[lang] || defaults.javascript;
  };

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const { data } = await runCode({
        problemId: problem._id,
        code,
        language,
      });
      setResult({ ...data.data, mode: 'run' });
      if (data.data.status === 'accepted') {
        toast.success('Sample tests passed!');
      } else if (data.data.status === 'compilation_error') {
        toast.error('Compilation failed');
      } else if (data.data.status === 'runtime_error') {
        toast.error('Runtime error occurred');
      } else {
        toast.error('Sample tests failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to run code');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first');
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const { data } = await submitCode({
        problemId: problem._id,
        code,
        language,
      });
      setResult({ ...data.data, mode: 'submit' });
      if (data.data.status === 'accepted') {
        toast.success('All test cases passed!');
      } else if (data.data.status === 'compilation_error') {
        toast.error('Compilation failed');
      } else if (data.data.status === 'runtime_error') {
        toast.error('Runtime error occurred');
      } else {
        toast.error(`${data.data.passedTestCases}/${data.data.totalTestCases} test cases passed`);
      }
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

  const difficultyColor = (d) => {
    if (d === 'easy') return 'text-green-400 bg-green-900/30';
    if (d === 'medium') return 'text-yellow-400 bg-yellow-900/30';
    return 'text-red-400 bg-red-900/30';
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20', label: status };
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading problem...</div>;
  }
  if (!problem) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Problem not found</div>;
  }

  return (
    <div className="h-[calc(100vh-57px)] bg-gray-950 flex flex-col" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/problems" className="text-gray-400 hover:text-white shrink-0"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-white font-semibold truncate">{problem.title}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${difficultyColor(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
          <div className="hidden md:flex gap-1 text-xs text-gray-500">
            {problem.tags?.map((tag) => (
              <span key={tag} className="bg-gray-800 px-2 py-0.5 rounded">{tag}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm">
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <button onClick={handleRun} disabled={running || submitting}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Running...' : 'Run'}
          </button>
          <button onClick={handleSubmit} disabled={submitting || running}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 flex flex-col overflow-hidden border-r border-gray-800">
          <div className="flex border-b border-gray-800 shrink-0">
            <button onClick={() => setActiveTab('description')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'description' ? 'text-white border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
              Description
            </button>
            <button onClick={() => setActiveTab('submissions')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'submissions' ? 'text-white border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
              Submissions
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
                        {ex.explanation && (
                          <>
                            <p className="text-gray-400 text-sm mb-1">Explanation:</p>
                            <p className="text-gray-300 text-sm">{ex.explanation}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {problem.constraints && (
                  <div className="mt-6">
                    <h3 className="text-white font-semibold mb-2">Constraints</h3>
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap">{problem.constraints}</pre>
                  </div>
                )}
              </>
            )}
            {activeTab === 'submissions' && (
              <div className="text-gray-400 text-center py-8">
                <p>Submission history will appear here.</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-1/2 flex flex-col">
          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
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

          {result && (
            <div className="border-t border-gray-800 bg-gray-900 overflow-y-auto shrink-0" style={{ maxHeight: '40%' }}>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  {(() => {
                    const cfg = getStatusConfig(result.status);
                    const Icon = cfg.icon;
                    return (
                      <>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                        <span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-gray-500 text-sm ml-auto">
                          {result.passedTestCases}/{result.totalTestCases} test cases passed
                        </span>
                      </>
                    );
                  })()}
                </div>

                {(result.errorMessage || result.errorType) && (
                  <div className="mb-3 p-3 bg-gray-950 rounded-lg border border-gray-800">
                    <p className="text-red-400 text-sm font-medium mb-1">
                      {result.errorType === 'compilation_error' ? 'Compilation Error:' :
                       result.errorType === 'runtime_error' ? 'Runtime Error:' :
                       result.errorType === 'time_limit_exceeded' ? 'Time Limit Exceeded:' :
                       'Error:'}
                    </p>
                    <pre className="text-red-300 text-xs whitespace-pre-wrap font-mono">{result.errorMessage}</pre>
                  </div>
                )}

                <div className="space-y-1">
                  {result.testCaseResults?.map((tc, idx) => {
                    const isError = tc.errorType && tc.errorType !== 'unknown';
                    return (
                      <div key={idx} className={`p-2 rounded text-sm ${tc.passed ? 'bg-green-900/20' : isError ? 'bg-red-900/20' : 'bg-red-900/20'}`}>
                        <div className="flex items-center gap-2">
                          {tc.passed ? <CheckCircle className="w-3 h-3 text-green-400 shrink-0" /> :
                           isError ? <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" /> :
                           <XCircle className="w-3 h-3 text-red-400 shrink-0" />}
                          <span className="text-gray-300 text-xs">
                            Test Case {idx + 1}
                            {tc.isSample ? ' (Sample)' : ''}
                          </span>
                          {tc.executionTime > 0 && (
                            <span className="text-gray-500 text-xs ml-auto">{tc.executionTime}ms</span>
                          )}
                        </div>
                        {tc.errorMessage && (
                          <pre className="mt-1 text-xs text-red-400 font-mono whitespace-pre-wrap">{tc.errorMessage}</pre>
                        )}
                        {!tc.passed && !tc.errorMessage && tc.expectedOutput !== undefined && (
                          <div className="mt-1 text-xs space-y-1">
                            {tc.expectedOutput && (
                              <p className="text-gray-400">
                                Expected: <span className="text-green-400 font-mono">{tc.expectedOutput}</span>
                              </p>
                            )}
                            <p className="text-gray-400">
                              Got: <span className="text-red-400 font-mono">{tc.actualOutput || '(no output)'}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}