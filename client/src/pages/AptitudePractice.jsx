import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Calculator, ListOrdered, BookOpen, Layers, ChevronRight, Star, RefreshCw } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { PAGE_CONTAINER, LOADING_SPINNER } from '../utils/ui';
import { getAptitudeTopics, getAptitudeMockTests } from '../api';
import MockTestGrid from '../components/aptitude/MockTestGrid';

const META = {
  quantitative: { label: 'Quantitative Aptitude', icon: Calculator, color: 'text-blue-400', bg: 'bg-blue-400/10', desc: 'Percentages, Profit & Loss, Ratio, TSD, Time & Work, DI' },
  logical: { label: 'Logical Reasoning', icon: ListOrdered, color: 'text-purple-400', bg: 'bg-purple-400/10', desc: 'Series, Coding-Decoding, Blood Relations, Syllogism, Puzzles' },
  verbal: { label: 'Verbal Ability', icon: BookOpen, color: 'text-green-400', bg: 'bg-green-400/10', desc: 'RC, Grammar, Correction, Para Jumbles, Vocabulary' },
};
const STARS = { 'must-do': 3, high: 2, medium: 1, low: 0 };

export default function AptitudePractice() {
  usePageTitle('Aptitude Practice');
  const [category, setCategory] = useState('quantitative');
  const [topics, setTopics] = useState([]);
  const [mocks, setMocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [t, m] = await Promise.all([getAptitudeTopics({ category }), getAptitudeMockTests()]);
        if (!live) return;
        setTopics(t.data.topics || []);
        setMocks(m.data.mockTests || []);
      } catch (e) {
        if (live) setError('Failed to load aptitude content.');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [category, tick]);

  if (loading) return <div className={LOADING_SPINNER}><BrainCircuit className="w-10 h-10 animate-pulse text-purple-400" /></div>;
  const meta = META[category];

  return (
    <div className={PAGE_CONTAINER}>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BrainCircuit className="w-7 h-7 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Aptitude Practice</h1>
        </div>
        <p className="text-gray-400">3 sections · 43 topics · 6,450+ questions · 50 easy + 50 medium + 50 hard each · 5 mock tests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {Object.entries(META).map(([key, m]) => {
          const Icon = m.icon;
          const active = category === key;
          return (
            <button key={key} onClick={() => setCategory(key)} className={`text-left p-4 rounded-xl border transition-all ${active ? 'bg-gray-800 border-gray-500 ring-1 ring-gray-500/30' : 'bg-gray-900 border-gray-800 hover:border-gray-600'}`}>
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${m.bg} mb-2`}>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <h3 className={`text-white font-semibold ${active ? m.color : ''}`}>{m.label}</h3>
              <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {error && (
        <button onClick={() => setTick(t => t + 1)} className="flex items-center gap-2 text-sm text-red-300 mb-4 hover:text-red-200">
          <RefreshCw className="w-3 h-3" /> {error} — retry
        </button>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Layers className={`w-5 h-5 ${meta.color}`} /> Topics — {meta.label}</h2>
          <span className="text-sm text-gray-500">{topics.length} topics · 50 Qs each</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topics.map((t) => {
            const stars = STARS[t.priority] ?? 0;
            return (
              <Link key={t._id} to={`/practice/aptitude/topic/${t._id}`} className="group flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-purple-500/40 hover:bg-gray-800/60 transition-all">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium truncate">{t.name}</h3>
                    <span className="flex items-center gap-0.5 shrink-0">
                      {[0, 1, 2].map((i) => <Star key={i} className={`w-3 h-3 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(t.subtopics || []).slice(0, 3).map((s) => <span key={s} className="text-[11px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">{s}</span>)}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 shrink-0 ml-2" />
              </Link>
            );
          })}
          {topics.length === 0 && !error && <p className="text-gray-500 text-sm col-span-full">No topics found.</p>}
        </div>
      </div>

      <MockTestGrid mocks={mocks} />
    </div>
  );
}