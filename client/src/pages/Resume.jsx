import { useState, useRef, useEffect } from 'react';
import { analyzeResumeFile, getRoleRequirements, matchJD } from '../api';
import { Upload, FileText, AlertCircle, TrendingUp, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { PAGE_CONTAINER_NARROW, CARD_CLASSES, LOADING_SPINNER, EMPTY_STATE_CLASSES, INPUT_CLASSES, BUTTON_CLASSES } from '../utils/ui';
const categoryLabels = {
  contact_structure: 'Contact & Structure',
  experience: 'Work Experience',
  projects: 'Projects',
  technical_skills: 'Technical Skills',
  achievements: 'Quantifiable Achievements',
  education: 'Education',
  keyword_density: 'SDE Keyword Density',
  role_fit: 'Role Fit',
};
const categoryMax = {
  contact_structure: 10,
  experience: 20,
  projects: 25,
  technical_skills: 20,
  achievements: 10,
  education: 10,
  keyword_density: 5,
  role_fit: 100,
};
export default function Resume() {
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [jdText, setJdText] = useState('');
  const [jdMatch, setJdMatch] = useState(null);
  const [jdLoading, setJdLoading] = useState(false);
  const fileRef = useRef();
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const { data } = await getRoleRequirements();
        setRoles(data.data || []);
      } catch (error) {
        console.error('Failed to load role requirements', error);
      }
    };
    loadRoles();
  }, []);
  const handleFileUpload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    try {
      const { data } = await analyzeResumeFile(f, selectedRole || undefined);
      setResult(data.data);
      setResumeText(data.data?.resumeText || '');
      toast.success('Resume analyzed!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to analyze resume';
      const formattedMessage = message.includes('\n')
        ? message.split('\n').map((line, i) => i === 0 ? line : `  ${line}`).join('\n')
        : message;
      toast.error(formattedMessage, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const handleJDMatch = async () => {
    if (!jdText.trim()) {
      toast.error('Please paste a job description');
      return;
    }
    setJdLoading(true);
    try {
      const { data } = await matchJD(resumeText || '', jdText);
      setJdMatch(data.data);
      toast.success('JD match computed!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to match JD');
    } finally {
      setJdLoading(false);
    }
  };
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };
  const getScoreBg = (score) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  const getCategoryColor = (score, max) => {
    const pct = score / max;
    if (pct >= 0.7) return 'text-green-400';
    if (pct >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };
  const getCategoryBar = (score, max) => {
    const pct = (score / max) * 100;
    if (pct >= 70) return 'bg-green-500';
    if (pct >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  return (
    <div className={PAGE_CONTAINER_NARROW}>
      <h1 className="text-2xl font-bold text-white mb-2">Resume ATS Analyzer</h1>
      <p className="text-gray-400 mb-8">Strict deterministic scoring based on rubric. Upload your resume to get scored.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className={CARD_CLASSES}>
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" /> Target Role
            </h2>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-white w-full">
              <option value="">Select a role (optional)</option>
              {roles.map((r) => (
                <option key={r.role} value={r.role}>{r.role}</option>
              ))}
            </select>
          </div>
          <div className={CARD_CLASSES}>
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" /> Upload Resume
            </h2>
            <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <FileText className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">{file ? file.name : 'Click to upload PDF/DOCX/TXT'}</p>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {loading && (
            <div className={LOADING_SPINNER}>
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          )}
          {result && !loading && (
            <>
              <div className={CARD_CLASSES}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold">ATS Score</h2>
                  <span className={`text-3xl font-bold ${getScoreColor(result.total_score)}`}>
                    {result.total_score}/100
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all duration-500 ${getScoreBg(result.total_score)}`} style={{ width: `${result.total_score}%` }}></div>
                </div>
              </div>
              <div className={CARD_CLASSES}>
                <h2 className="text-white font-semibold mb-4">Category Breakdown</h2>
                <div className="space-y-3">
                  {Object.keys(categoryLabels).map((key) => {
                    if (key === 'role_fit' && !result.role_fit) return null;
                    const score = key === 'role_fit' ? result.role_fit?.score || 0 : result.category_scores?.[key] || 0;
                    const max = categoryMax[key];
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">{categoryLabels[key]}</span>
                          <span className={getCategoryColor(score, max)}>{score}{key === 'role_fit' ? '%' : `/${max}`}</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div className={`h-2 rounded-full ${getCategoryBar(score, max)}`} style={{ width: `${(score / max) * 100}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className={CARD_CLASSES}>
                <h2 className="text-white font-semibold mb-3">Detailed Reasoning</h2>
                <div className="space-y-2 text-sm">
                  {Object.keys(categoryLabels).map((key) => {
                    if (key === 'role_fit' && !result.role_fit) return null;
                    return (
                      <div key={key} className="flex gap-2">
                        <span className="text-gray-500 min-w-[130px]">{categoryLabels[key]}:</span>
                        <span className="text-gray-300">
                          {key === 'role_fit' ? result.reasoning?.role_fit || 'N/A' : result.reasoning?.[key] || 'N/A'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {result.top_3_improvements?.length > 0 && (
                <div className={CARD_CLASSES}>
                  <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" /> Top 3 Improvements
                  </h2>
                  <ol className="space-y-2">
                    {result.top_3_improvements.map((s, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-gray-300">
                        <span className="text-yellow-400 font-bold min-w-[20px]">{idx + 1}.</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {result.rewriteSuggestions?.length > 0 && (
                <div className={CARD_CLASSES}>
                  <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" /> AI Resume Rewriter
                  </h2>
                  <div className="space-y-3">
                    {result.rewriteSuggestions.map((s, idx) => (
                      <div key={idx} className="text-sm text-gray-300">
                        <div className="mb-1">
                          <span className="text-red-400 font-semibold">Original:</span> {s.original}
                        </div>
                        <div className="mb-1">
                          <span className="text-green-400 font-semibold">Suggested:</span> {s.suggested}
                        </div>
                        <div className="text-gray-500 text-xs">{s.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className={CARD_CLASSES}>
                <h2 className="text-white font-semibold mb-3">JD Match</h2>
                <textarea value={jdText} onChange={(e) => setJdText(e.target.value)} placeholder="Paste a job description to calculate match percentage" className={INPUT_CLASSES.replace('h-40', 'h-32')} />
                <button onClick={handleJDMatch} disabled={jdLoading || !resumeText || !jdText.trim()} className={BUTTON_CLASSES.primary + ' mt-3 w-full'}>
                  {jdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                  {jdLoading ? 'Matching...' : 'Match JD'}
                </button>
                {jdMatch && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">JD Match</span>
                      <span className={getCategoryColor(jdMatch.score, 100)}>{jdMatch.score}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className={`h-2 rounded-full ${getCategoryBar(jdMatch.score, 100)}`} style={{ width: `${jdMatch.score}%` }}></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      <div>Matched: {jdMatch.matchedKeywords?.join(', ')}</div>
                      <div>Missing: {jdMatch.missingKeywords?.join(', ')}</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {!result && !loading && (
            <div className={EMPTY_STATE_CLASSES}>
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Upload your resume to get scored</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}