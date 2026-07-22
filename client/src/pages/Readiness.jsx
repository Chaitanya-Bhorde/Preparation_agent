import { useState, useEffect } from 'react';
import { getInterviewReadiness } from '../api';
import { useAuth } from '../context/AuthContext';
import { PAGE_CONTAINER, LOADING_SPINNER } from '../utils/ui';
import { Brain, Loader2, Code2, BookOpen, FileText, Mic } from 'lucide-react';

export default function Readiness() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadReadiness(); }, []);
  const loadReadiness = async () => {
    try {
      const res = await getInterviewReadiness();
      setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const scoreColor = (s) => {
    if (s >= 80) return 'text-green-400';
    if (s >= 60) return 'text-yellow-400';
    if (s >= 40) return 'text-orange-400';
    return 'text-red-400';
  };
  if (loading) return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  return (
    <div className={PAGE_CONTAINER}>
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3"><Brain className="w-8 h-8" /> Interview Readiness</h1>
        <p className="text-purple-100">Your composite preparation score</p>
      </div>
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 flex flex-col items-center justify-center">
            <div className={`text-6xl font-bold mb-2 ${scoreColor(data.score)}`}>{data.score}</div>
            <p className="text-gray-400 text-lg">{data.label}</p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
            <h3 className="text-white font-semibold mb-2">Breakdown</h3>
            {[
              { label: 'Coding Accuracy', value: data.breakdown.codingAccuracy, icon: <Code2 className="w-4 h-4" /> },
              { label: 'Aptitude Score', value: data.breakdown.aptitudeScore, icon: <BookOpen className="w-4 h-4" /> },
              { label: 'ATS Score', value: data.breakdown.atsScore, icon: <FileText className="w-4 h-4" /> },
              { label: 'Mock Interview', value: data.breakdown.mockInterviewScore, icon: <Mic className="w-4 h-4" /> },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-300 text-sm">{item.icon} {item.label}</div>
                <span className={`font-bold ${scoreColor(item.value)}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}