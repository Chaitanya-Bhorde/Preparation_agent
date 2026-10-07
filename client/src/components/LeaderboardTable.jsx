import React from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import LeaderboardRow from './LeaderboardRow';
import './LeaderboardTable.css';

/**
 * The real performance leaderboard:
 *
 *   Rank | Name | DSA | Aptitude | SQL | Mock Interview | Overall
 *
 * The old Problems/Easy/Medium/Hard/Acceptance block is gone — those numbers
 * are per-section detail, not a ranking, and they could not represent Aptitude,
 * SQL or Mock Interview at all.
 *
 * States are kept distinct on purpose:
 *   - loading  -> a skeleton, never zeroed-out rows
 *   - error    -> the failure message with a Retry action, never fake data
 *   - empty    -> the "no leaderboard data yet" explanation
 */
const COLUMNS = ['Rank', 'Name', 'DSA', 'Aptitude', 'SQL', 'Mock Interview', 'Overall'];

const LeaderboardTable = ({ data, loading, error, currentUserId, onRetry }) => {
  if (loading) {
    return (
      <div className="leaderboard-table" aria-busy="true" aria-live="polite">
        <div className="table-header" aria-hidden="true">
          {COLUMNS.map((c) => (
            <div key={c} className="col">{c}</div>
          ))}
        </div>
        <div className="table-scroll">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="leaderboard-row leaderboard-row--skeleton" key={i} aria-hidden="true">
              {COLUMNS.map((c) => (
                <div key={c} className="skeleton-cell" />
              ))}
            </div>
          ))}
        </div>
        <div className="loading-caption">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading leaderboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" role="alert">
        <AlertCircle className="state-icon state-icon--error" />
        <p className="state-title">{error}</p>
        {onRetry && (
          <button type="button" className="state-action" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <Inbox className="state-icon" />
        <p className="state-title">No leaderboard data yet.</p>
        <p className="state-body">
          Complete DSA, Aptitude, SQL or Mock Interview activities to start
          building your performance profile.
        </p>
      </div>
    );
  }

  return (
    <div className="leaderboard-table">
      <div className="table-header">
        {COLUMNS.map((c) => (
          <div key={c} className="col">{c}</div>
        ))}
      </div>

      <div className="table-scroll">
        {data.map((user) => (
          <LeaderboardRow
            key={user.userId}
            user={user}
            isCurrentUser={Boolean(
              currentUserId && user.userId && String(user.userId) === String(currentUserId)
            )}
          />
        ))}
      </div>
    </div>
  );
};

export { COLUMNS };
export default LeaderboardTable;