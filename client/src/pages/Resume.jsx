import { useState, useRef } from 'react';
import { analyzeResumeText, analyzeResumeFile } from '../api';
import { Upload, FileText, AlertCircle, CheckCircle, TrendingUp, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
const categoryLabels = {
  contact_structure: 'Contact & Structure',
  experience: 'Work Experience',
  projects: 'Projects',
  technical_skills: 'Technical Skills',
  achievements: 'Quantifiable Achievements',
  education: 'Education',
  keyword_density: 'SDE Keyword Density',
};
const categoryMax = {
  contact_structure: 10,
  experience: 20,
  projects: 25,
  technical_skills: 20,
  achievements: 10,
  education: 10,
  keyword_density: 5,
};
export default function Resume() {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const handleFileUpload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setLoading(true);
    try {
      const { data } = await analyzeResumeFile(f);
      setResult(data.data);
      toast.success('Resume analyzed!');
    } catch (error) {
      toast.error('Failed to analyze resume. Try pasting text instead.');
    } finally {
      setLoading(false);
    }
  };
  const handleTextAnalyze = async () => {
    if (!text.trim()) {
      toast.error('Please paste your resume text');
      return;
    }
    setLoading(true);
    try {
      const { data } = await analyzeResumeText(text);
      setResult(data.data);
      toast.success('Resume analyzed!');
    } catch (error) {
      toast.error('Failed to analyze resume');
    } finally {
      setLoading(false);
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">Resume ATS Analyzer</h1>
      <p className="text-gray-400 mb-8">Strict deterministic scoring based on rubric. Upload your resume to get scored.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" /> Upload Resume
            </h2>
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <FileText className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">{file ? file.name : 'Click to upload PDF/DOCX/TXT'}</p>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" />
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" /> Or Paste Resume Text
            </h2>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm h-40 focus:outline-none focus:border-blue-500"
              placeholder="Paste your resume content here including education, skills, projects, experience..." />
            <button onClick={handleTextAnalyze} disabled={loading || !text.trim()}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
        {}
        <div className="space-y-4">
          {loading && (
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          )}
          {result && !loading && (
            <>
              {}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold">ATS Score</h2>
                  <span className={`text-3xl font-bold ${getScoreColor(result.total_score)}`}>
                    {result.total_score}/100
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all duration-500 ${getScoreBg(result.total_score)}`}
                    style={{ width: `${result.total_score}%` }}></div>
                </div>
              </div>
              {}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-white font-semibold mb-4">Category Breakdown</h2>
                <div className="space-y-3">
                  {Object.keys(categoryLabels).map((key) => {
                    const score = result.category_scores?.[key] || 0;
                    const max = categoryMax[key];
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">{categoryLabels[key]}</span>
                          <span className={getCategoryColor(score, max)}>{score}/{max}</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div className={`h-2 rounded-full ${getCategoryBar(score, max)}`}
                            style={{ width: `${(score / max) * 100}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h2 className="text-white font-semibold mb-3">Detailed Reasoning</h2>
                <div className="space-y-2 text-sm">
                  {Object.keys(categoryLabels).map((key) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-gray-500 min-w-[130px]">{categoryLabels[key]}:</span>
                      <span className="text-gray-300">{result.reasoning?.[key] || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
              {}
              {result.top_3_improvements?.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
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
            </>
          )}
          {!result && !loading && (
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Upload or paste your resume to get scored</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}