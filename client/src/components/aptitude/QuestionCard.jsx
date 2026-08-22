import { useState } from 'react';
import { CheckCircle2, XCircle, Eye, EyeOff, ChevronRight, Lightbulb } from 'lucide-react';

// Single MCQ card: click an option -> instant feedback; toggle full solution.
export default function QuestionCard({ q, index, total, selected, onSelect, showSolution, onToggleSolution }) {
  const [revealed, setRevealed] = useState(false);
  const answered = selected !== null && selected !== undefined;
  const isRight = answered && selected === q.correctAnswer;
  const labels = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">Question {index + 1} of {total}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${q.difficulty === 'easy' ? 'text-green-400 bg-green-900/30' : q.difficulty === 'hard' ? 'text-red-400 bg-red-900/30' : 'text-yellow-400 bg-yellow-900/30'}`}>
          {q.difficulty}
        </span>
      </div>
      <p className="text-white whitespace-pre-line mb-4">{q.questionText}</p>

      <div className="space-y-2">
        {(q.options || []).map((opt, i) => {
          const label = opt.label || labels[i];
          const chosen = selected === label;
          let cls = 'border-gray-700 hover:border-gray-500 bg-gray-800/40';
          if (answered) {
            if (label === q.correctAnswer) cls = 'border-green-500/60 bg-green-900/20';
            else if (chosen) cls = 'border-red-500/60 bg-red-900/20';
            else cls = 'border-gray-800 bg-gray-900 opacity-60';
          }
          return (
            <button
              key={label}
              disabled={answered}
              onClick={() => onSelect(label)}
              className={`w-full flex items-start gap-3 text-left px-4 py-2.5 rounded-lg border transition-all ${cls} ${answered ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span className="text-sm font-semibold text-gray-400 shrink-0 w-5">{label}.</span>
              <span className="text-sm text-gray-200 flex-1">{opt.text}</span>
              {answered && label === q.correctAnswer && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
              {answered && chosen && label !== q.correctAnswer && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-3">
          <div className={`flex items-center gap-2 text-sm font-medium ${isRight ? 'text-green-400' : 'text-red-400'}`}>
            {isRight ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {isRight ? 'Correct!' : `Wrong — correct answer is (${q.correctAnswer})`}
          </div>
          <button
            onClick={() => setRevealed(v => !v)}
            className="mt-2 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {revealed ? 'Hide solution' : 'View solution'}
          </button>
          {revealed && (
            <div className="mt-2 p-3 bg-gray-800/60 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-medium mb-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> Explanation
              </div>
              <p className="text-sm text-gray-300 mb-2">{q.explanation}</p>
              {(q.solutionSteps || []).length > 0 && (
                <ol className="list-decimal list-inside space-y-0.5">
                  {q.solutionSteps.map((s, i) => (
                    <li key={i} className="text-xs text-gray-400">{s}</li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}