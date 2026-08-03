import { Link } from 'react-router-dom';
import { DIFFICULTY_COLORS } from '../../utils/ui';

export default function PracticeHistoryTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
        <p className="text-gray-500">No submissions found</p>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getVerdictColor = (verdict) => {
    if (verdict === 'Accepted') return 'text-green-400 bg-green-900/30';
    if (verdict === 'Wrong Answer') return 'text-red-400 bg-red-900/30';
    if (verdict === 'Runtime Error') return 'text-orange-400 bg-orange-900/30';
    if (verdict === 'Time Limit Exceeded') return 'text-yellow-400 bg-yellow-900/30';
    if (verdict === 'Memory Limit Exceeded') return 'text-purple-400 bg-purple-900/30';
    return 'text-gray-400 bg-gray-800';
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left py-3 px-4 font-medium">Date</th>
              <th className="text-left py-3 px-4 font-medium">Problem</th>
              <th className="text-left py-3 px-4 font-medium">Difficulty</th>
              <th className="text-left py-3 px-4 font-medium">Verdict</th>
              <th className="text-left py-3 px-4 font-medium">Language</th>
              <th className="text-left py-3 px-4 font-medium">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {data.map((submission, idx) => (
              <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                  {formatDate(submission.submittedAt)}
                </td>
                <td className="py-3 px-4">
                  <Link
                    to={submission.problemUrl}
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {submission.problemTitle}
                  </Link>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${DIFFICULTY_COLORS[submission.difficulty.toLowerCase()] || 'text-gray-400 bg-gray-800'}`}>
                    {submission.difficulty}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${getVerdictColor(submission.verdict)}`}>
                    {submission.verdict}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-400">{submission.language}</td>
                <td className="py-3 px-4 text-gray-400">{submission.attemptCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
