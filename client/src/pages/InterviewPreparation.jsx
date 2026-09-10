import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCoreSubjects } from '../api';
import { PAGE_CONTAINER, LOADING_SPINNER, EMPTY_STATE_CLASSES } from '../utils/ui';
import { BookOpen, ChevronRight, Loader2, Database, Globe, Monitor, Table, Coffee, Brain, Layers, Code2, Server } from 'lucide-react';

const ICON_MAP = {
  Database, Globe, Monitor, Table, Coffee, Brain, Layers,
  Snake: Code2,
  Architecture: Server,
};

const COLOR_MAP = {
  blue: 'from-blue-600 to-blue-800',
  green: 'from-green-600 to-green-800',
  purple: 'from-purple-600 to-purple-800',
  cyan: 'from-cyan-600 to-cyan-800',
  orange: 'from-orange-600 to-orange-800',
  yellow: 'from-yellow-600 to-yellow-800',
  red: 'from-red-600 to-red-800',
  teal: 'from-teal-600 to-teal-800',
  indigo: 'from-indigo-600 to-indigo-800',
};

const COLOR_TEXT = {
  blue: 'text-blue-400', green: 'text-green-400', purple: 'text-purple-400',
  cyan: 'text-cyan-400', orange: 'text-orange-400', yellow: 'text-yellow-400',
  red: 'text-red-400', teal: 'text-teal-400', indigo: 'text-indigo-400',
};

const COLOR_BG = {
  blue: 'bg-blue-900/20', green: 'bg-green-900/20', purple: 'bg-purple-900/20',
  cyan: 'bg-cyan-900/20', orange: 'bg-orange-900/20', yellow: 'bg-yellow-900/20',
  red: 'bg-red-900/20', teal: 'bg-teal-900/20', indigo: 'bg-indigo-900/20',
};

export default function InterviewPreparation() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const { data } = await getCoreSubjects();
      setSubjects(data.data || []);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={LOADING_SPINNER}><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;

  return (
    <div className={PAGE_CONTAINER}>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8" /> Interview Preparation
        </h1>
        <p className="text-blue-100">Master core subjects with structured notes, probable MCQs, and interview questions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => {
          const IconComp = ICON_MAP[subject.icon] || BookOpen;
          const gradient = COLOR_MAP[subject.color] || COLOR_MAP.blue;
          const textColor = COLOR_TEXT[subject.color] || COLOR_TEXT.blue;
          const bgColor = COLOR_BG[subject.color] || COLOR_BG.blue;
          return (
            <Link key={subject._id} to={`/interview-prep/${subject.slug}`} className="group bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-gray-600 transition-all hover:bg-gray-800/60">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
                <IconComp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">{subject.name}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{subject.description}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                <span className={`px-2 py-1 rounded ${bgColor} ${textColor}`}>{subject.topics} topics</span>
                <span className={`px-2 py-1 rounded ${bgColor} ${textColor}`}>{subject.notes} notes</span>
                <span className={`px-2 py-1 rounded ${bgColor} ${textColor}`}>{subject.mcqs} MCQs</span>
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${textColor} group-hover:gap-2 transition-all`}>
                Explore <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
      </div>

      {subjects.length === 0 && !loading && (
        <div className={EMPTY_STATE_CLASSES}>
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-500" />
          <p className="text-gray-500">No subjects available yet. Run the seed script to populate data.</p>
        </div>
      )}
    </div>
  );
}
