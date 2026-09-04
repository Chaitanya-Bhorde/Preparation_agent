import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Eye, EyeOff, Lightbulb, Target, ListOrdered } from 'lucide-react';

const STEP_STYLES = [
  'bg-blue-900/50 border-blue-500/60 text-blue-300',
  'bg-purple-900/50 border-purple-500/60 text-purple-300',
  'bg-cyan-900/50 border-cyan-500/60 text-cyan-300',
  'bg-emerald-900/50 border-emerald-500/60 text-emerald-300',
  'bg-amber-900/50 border-amber-500/60 text-amber-300',
];
const LABELS = ['A', 'B', 'C', 'D'];

// Single MCQ card: click an option -> instant green/red feedback (auto-clears after
// autoClearMs in practice mode so the user can retry) + step-by-step solution toggle.
export default function QuestionCard({ q, index, total, selected, onSelect, onAutoClear, autoClearMs = 0, correctAnswer }) {
  const [revealed, setRevealed] = useState(false);
  const answered = selected !== null && selected !== undefined;
  // Use the correctAnswer from submit-answer response (prop), not from q (which is undefined)
  const effectiveCorrect = correctAnswer || q.correctAnswer;
  const isRight = answered && selected === effectiveCorrect;

  // Hide "View solution" whenever the answer resets (auto-clear / retry).
  useEffect(() => {
    if (!answered) setRevealed(false);
  }, [answered]);

  // Auto-clear green/red feedback after autoClearMs so the user can retry.
  useEffect(() => {
    if (!answered || autoClearMs <= 0) return undefined;
    const t = setTimeout(() => {
      if (onAutoClear) onAutoClear(q._id);
    }, autoClearMs);
    return () => clearTimeout(t);
  }, [answered, autoClearMs, q._id, onAutoClear]);

  const corrOpt = (q.options || []).find(o => o.label === effectiveCorrect);
  // Guarantee a step-by-step breakdown on every question (fallback from explanation).
  const steps = (q.solutionSteps && q.solutionSteps.filter(s => String(s).trim()).length >= 2)
    ? q.solutionSteps
    : (q.explanation ? q.explanation.split(/[.;]\s*/).filter(s => s.trim()) : []);

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
          const label = opt.label || LABELS[i];
          const chosen = selected === label;
          let cls = 'border-gray-700 hover:border-gray-500 bg-gray-800/40';
          if (answered) {
            if (label === effectiveCorrect) cls = 'border-green-500/60 bg-green-900/20';
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
              {answered && label === effectiveCorrect && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
              {answered && chosen && label !== effectiveCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-3">
          <div className={`flex items-center gap-2 text-sm font-medium ${isRight ? 'text-green-400' : 'text-red-400'}`}>
            {isRight ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {isRight ? 'Correct!' : `Wrong — correct answer is (${effectiveCorrect})`}
          </div>
          <div className="mt-2 flex items-center">
            <button
              onClick={() => setRevealed(v => !v)}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {revealed ? 'Hide solution' : 'View solution'}
            </button>
            {autoClearMs > 0 && (
              <span className="text-[10px] text-gray-600 ml-3">(feedback resets in ~{Math.round(autoClearMs / 1000)}s so you can retry)</span>
            )}
          </div>

          {revealed && (
            <div className="mt-3 space-y-3">
              {corrOpt && (
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800/70 border border-gray-700 rounded-lg px-3 py-2">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  Correct Answer: <span className="text-green-300 font-semibold">({effectiveCorrect}) {corrOpt.text}</span>
                </div>
              )}
              {q.explanation && (
                <div className="p-3 bg-gray-800/60 border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-medium mb-1.5">
                    <Lightbulb className="w-3.5 h-3.5" /> Explanation
                  </div>
                  <p className="text-sm text-gray-300">{q.explanation}</p>
                </div>
              )}
              {steps.length > 0 && (
                <div className="p-3 bg-gray-800/60 border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium mb-2">
                    <ListOrdered className="w-3.5 h-3.5" /> Step-by-step solution
                  </div>
                  <ol className="space-y-2">
                    {steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`shrink-0 w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center ${STEP_STYLES[i % STEP_STYLES.length]}`}>
                          {i + 1}
                        </span>
                        <span className="text-xs text-gray-300 leading-relaxed">{String(s).trim()}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}