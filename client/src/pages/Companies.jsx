import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCompanies, getCompanyProblems, getCompanyInfo } from '../api';
import { PAGE_CONTAINER, LOADING_SPINNER, EMPTY_STATE_CLASSES } from '../utils/ui';
import { Building2, ChevronRight, Loader2, BookOpen, BarChart3, HelpCircle } from 'lucide-react';
export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [problems, setProblems] = useState([]);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadCompanies(); }, []);
  const loadCompanies = async () => {
    try {
      const { data } = await getCompanies();
      setCompanies(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const selectCompany = async (slug) => {
    setSelected(slug);
    setProblems([]);
    setInfo(null);
    try {
      const [pRes, iRes] = await Promise.all([getCompanyProblems(slug), getCompanyInfo(slug)]);
      setProblems(pRes.data.data || []);
      setInfo(iRes.data.data);
    } catch (error) {
      console.error(error);
    }
  };
  if (loading) return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  return (
    <div className={PAGE_CONTAINER}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><Building2 className="w-8 h-8" /> Companies</h1>
        <p className="text-blue-100">Practice company-wise curated problem sets</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {companies.map((c) => (
            <button key={c._id} onClick={() => selectCompany(c.slug)} className={`w-full text-left p-4 rounded-xl border transition-colors ${selected === c.slug ? 'bg-gray-800 border-blue-500' : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}>
              <p className="text-white font-medium">{c.name}</p>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{c.testPattern}</p>
            </button>
          ))}
        </div>
        <div className="lg:col-span-2">
          {selected && info ? (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">{info.info?.name}</h2>
                  {info.progress !== undefined && (
                    <span className="text-sm text-gray-400">{info.progress}% complete</span>
                  )}
                </div>
                {info.info?.testPattern && <p className="text-gray-300 text-sm mb-4">{info.info.testPattern}</p>}
                {info.info?.rounds && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {info.info.rounds.map((r, i) => <span key={i} className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs">{r}</span>)}
                  </div>
                )}
              </div>
               <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-400" /> Problems ({problems.length})</h3>
                {problems.length === 0 ? (
                  <p className="text-gray-500 text-sm">No active problems assigned for this company yet.</p>
                ) : (
                  <div className="space-y-2">
                    {problems.map((p) => (
                      <Link key={p._id} to={`/problems/${p.slug}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-300 text-sm">{p.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.difficulty === 'easy' ? 'bg-green-900/30 text-green-400' : p.difficulty === 'medium' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'}`}>{p.difficulty}</span>
                        </div>
                        {p.category === 'SQL' && <span className="text-xs text-purple-400">SQL</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {info.info?.interviewQuestions?.length > 0 && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-purple-400" /> Interview Questions</h3>
                  <div className="space-y-3">
                    {info.info.interviewQuestions.map((q, i) => (
                      <div key={i} className="p-3 rounded-lg bg-gray-800/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-200 text-sm font-medium">{q.question}</span>
                          <span className="text-xs text-gray-400">{q.difficulty}</span>
                        </div>
                        {q.hint && <p className="text-gray-500 text-xs mb-1">Hint: {q.hint}</p>}
                        <p className="text-gray-400 text-xs">Expected: {q.expectedAnswer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={EMPTY_STATE_CLASSES}>
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-500" />
              <p className="text-gray-500">Select a company to view problems and test pattern</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}