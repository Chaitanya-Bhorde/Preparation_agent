import { Link } from 'react-router-dom';
import { getPracticeRecent } from '../../api';
import { CARD_CLASSES, DIFFICULTY_COLORS } from '../../utils/ui';

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

export default function RecentSubmissions({ userId }) {
  return (
    <div className={CARD_CLASSES}>
      <h3 className="text-lg font-semibold text-white mb-4">Recent Accepted</h3>
      <RecentSubmissionsList userId={userId} />
    </div>
  );
}

function RecentSubmissionsList({ userId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecent();
  }, [userId]);

  const loadRecent = async () => {
    try {
      setLoading(true);
      const { data: res } = await getPracticeRecent(userId, 10);
      setData(res.data || []);
    } catch (error) {
      console.error('Failed to load recent:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return <p className="text-gray-500 text-sm">No recent accepted submissions</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((submission, idx) => (
        <Link
          key={idx}
          to={submission.problemUrl}
          className="block p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-white truncate flex-1">{submission.problemTitle}</span>
            <span className={`text-xs px-2 py-0.5 rounded ml-2 ${DIFFICULTY_COLORS[submission.difficulty] || 'text-gray-400 bg-gray-800'}`}>
              {submission.difficulty}
            </span>
          </div>
          <span className="text-xs text-gray-500">{timeAgo(submission.submittedAt)}</span>
        </Link>
      ))}
    </div>
  );
}
