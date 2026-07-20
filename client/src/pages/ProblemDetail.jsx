import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { getProblem, createSubmission } from '../api';
import { Play, Clock, CheckCircle, XCircle, Loader2, ArrowLeft, BookmarkPlus } from 'lucide-react';
import toast from 'react-hot-toast';
const LANGUAGE_VERSIONS = {
  javascript: '18.15.0',
  python: '3.10.0',
  java: '15.0.2',
  cpp: '10.2.0',
};
export default function ProblemDetail() {
  const { slug } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
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
      javascript: `// Write your solution here\nfunction solve(input) {\n  // Your code here\n  return input;\n}\n`,
      python: `# Write your solution here\ndef solve(input):\n    # Your code here\n    return input\n`,
      java: `// Write your solution here\npublic class Solution {\n    public static int solve(int input) {\n        // Your code here\n        return input;\n    }\n}`,
      cpp: `// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint solve(int input) {\n    // Your code here\n    return input;\n}\n`,
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
      const { data } = await createSubmission({
        problemId: problem._id,
        code,
        language,
      });
      setResult(data.data);
      if (data.data.status === 'accepted') {
        toast.success('All test cases passed! 🎉');
      } else {
        toast.error('Some test cases failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit code');
    } finally {
      setRunning(false);
    }
  };
  const difficultyColor = (d) => {
    if (d === 'easy') return 'text-green-400 bg-green-900/30';
    if (d === 'medium') return 'text-yellow-400 bg-yellow-900/30';
    return 'text-red-400 bg-red-900/30';
  };
  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Loading problem...</div>;
  }
  if (!problem) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Problem not found</div>;
  }
  return (
    <div className="h-[calc(100vh-57px)] bg-gray-950 flex flex-col">
      {}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Link to="/problems" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-white font-semibold">{problem.title}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
          <div className="flex gap-1 text-xs text-gray-500">
            {problem.tags?.map((tag) => (
              <span key={tag} className="bg-gray-800 px-2 py-0.5 rounded">{tag}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm">
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <button onClick={handleRun} disabled={running}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>
      {}
      <div className="flex flex-1 overflow-hidden">
        {}
        <div className="w-1/2 overflow-y-auto border-r border-gray-800 p-6">
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 whitespace-pre-wrap">{problem.description}</div>
          </div>
          {problem.examples?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-white font-semibold mb-3">Examples</h3>
              {problem.examples.map((ex, idx) => (
                <div key={idx} className="bg-gray-900 rounded-lg p-4 mb-3 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">Input:</p>
                  <pre className="bg-gray-950 p-2 rounded text-gray-300 text-sm mb-2">{ex.input}</pre>
                  <p className="text-gray-400 text-sm mb-1">Output:</p>
                  <pre className="bg-gray-950 p-2 rounded text-gray-300 text-sm mb-2">{ex.output}</pre>
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
              <pre className="text-gray-300 text-sm">{problem.constraints}</pre>
            </div>
          )}
        </div>
        {}
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
              }}
            />
          </div>
          {}
          {result && (
            <div className="h-48 border-t border-gray-800 bg-gray-900 p-4 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                {result.status === 'accepted' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={`font-medium ${result.status === 'accepted' ? 'text-green-400' : 'text-red-400'}`}>
                  {result.status === 'accepted' ? 'Accepted' : 'Wrong Answer'}
                </span>
                <span className="text-gray-500 text-sm ml-auto">
                  {result.passedTestCases}/{result.totalTestCases} test cases passed
                </span>
              </div>
              {result.testCaseResults?.map((tc, idx) => (
                <div key={idx} className={`p-2 rounded mb-1 text-sm ${tc.passed ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                  <div className="flex items-center gap-2">
                    {tc.passed ? <CheckCircle className="w-3 h-3 text-green-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                    <span className="text-gray-300">Test Case {idx + 1}</span>
                    {tc.executionTime > 0 && (
                      <span className="text-gray-500 text-xs ml-auto">{tc.executionTime}ms</span>
                    )}
                  </div>
                  {!tc.passed && tc.actualOutput !== undefined && (
                    <div className="mt-1 text-xs text-gray-400">
                      Expected: <span className="text-green-400">{tc.expectedOutput}</span>
                      <br />
                      Got: <span className="text-red-400">{tc.actualOutput}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}