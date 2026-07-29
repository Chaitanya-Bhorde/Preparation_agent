import { Link } from 'react-router-dom';
import { Code2, Database, Brain, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function PracticeHub() {
  const modules = [
    {
      name: 'DSA',
      path: '/practice/dsa',
      icon: Code2,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      border: 'border-green-400/30',
      description: 'Data Structures & Algorithms',
      details: 'Solve coding problems with Judge0 execution. Track streaks and topic performance.',
      status: 'active',
    },
    {
      name: 'SQL',
      path: '/practice/sql',
      icon: Database,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/30',
      description: 'SQL Query Practice',
      details: 'Write queries against an in-memory SQLite sandbox. Immediate result validation.',
      status: 'active',
    },
    {
      name: 'Aptitude',
      path: '/practice/aptitude',
      icon: Brain,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      border: 'border-purple-400/30',
      description: 'Quant, Verbal & Logical',
      details: 'MCQ-style practice with categories matching placement-prep structure.',
      status: 'active',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Practice</h1>
        <p className="text-gray-400">Choose a module to start practicing. All submissions feed into unified analytics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Link
            key={module.path}
            to={module.path}
            className="group relative bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-gray-500 transition-all"
          >
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${module.bg} mb-4`}>
              <module.icon className={`w-6 h-6 ${module.color}`} />
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">{module.name}</h2>
            <p className="text-sm text-gray-400 mb-3">{module.description}</p>
            <p className="text-xs text-gray-500 mb-4">{module.details}</p>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs text-green-400">
                <CheckCircle2 className="w-3 h-3" />
                {module.status}
              </span>
              <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}