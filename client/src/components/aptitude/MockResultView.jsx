import { Trophy, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { BUTTON_CLASSES } from '../../utils/ui';

// Mock test result view: score header + per-question solutions.
export default function MockResultView({ mockName, result, details, onBack }) {
  const verdictColor = result.verdict === 'Excellent' ? 'text-green-400'
    : result.verdict === 'Good' ? 'text-blue-400'
    : result.verdict === 'Average' ? 'text-yellow-400' : 'text-red-400';
  const labels = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center mb-6">
        <Trophy className={`w-12 h-12 mx-auto mb-3 ${result.passed ? 'text-yellow-400' : 'text-gray-500'}`} />
        <h1 className="text-2xl font-bold text-white mb-1">{mockName} — Result</h1>
        <p className={`text-lg font-semibold ${verdictColor} mb-4`}>
          {result.score}% · {result.verdict} · {result.passed ? 'PASSED' : 'NOT PASSED'}
        </p>
        <p className="text-gray-400 text-sm mb-4">You got {result.correctCount} out of {result.totalCount} correct.</p>
        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden mb-6">
          <div className={`h-full rounded-full ${result.score >= 70 ? 'bg-green-500' : result.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${result.score}%` }} />
        </div>
        <button onClick={onBack} className={BUTTON_CLASSES.primary}>
          <Trophy className="w-4 h-4" /> Back to aptitude
        </button>
      </div>

      {details && (
        <div className="space-y-3">
          {details.answers.map((a, i) => (
            <div key={i} className={`bg-gray-900 border rounded-xl p-5 ${a.isCorrect ? 'border-green-500/30' : 'border-red-500/30'}`}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {a.isCorrect ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                <span className="text-xs text-gray-500">Q{i + 1}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${a.isCorrect ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30'}`}>
                  Your answer: {a.selectedAnswer}{!a.isCorrect && a.question ? ` · Correct: ${a.question.correctAnswer}` : ''}
                </span>
              </div>
              <p className="text-white whitespace-pre-line mb-2 text-sm">{a.question?.questionText}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                {(a.question?.options || []).map((o, oi) => {
                  const label = o.label || labels[oi];
                  const good = label === a.question.correctAnswer;
                  return (
                    <div key={label} className={`text-xs px-2.5 py-1.5 rounded border ${good ? 'border-green-600/50 bg-green-900/20 text-green-300' : 'border-gray-800 text-gray-400'}`}>
                      <b>{label}.</b> {o.text}
                    </div>
                  );
                })}
              </div>
              {a.question?.explanation && (
                <p className="text-xs text-gray-400"><span className="text-yellow-400 font-medium">Why:</span> {a.question.explanation}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}