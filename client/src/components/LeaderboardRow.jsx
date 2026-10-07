import React from 'react';
import './LeaderboardRow.css';

/**
 * One leaderboard row.
 *
 * `user.dsa | aptitude | sql | mockInterview | overall` are the server's real
 * section scores. A section with no activity arrives as `null` and is rendered
 * as an em dash — it is deliberately NEVER rendered as 0, because 0 means
 * "attempted and got everything wrong" and a blank means "not attempted".
 */
const NOT_ATTEMPTED = '—';

function SectionScore({ value }) {
  if (value === null || value === undefined) {
    return (
      <span className="score-cell score-cell--empty" title="Not Attempted">
        {NOT_ATTEMPTED}
      </span>
    );
  }
  return <span className="score-cell">{value}</span>;
}

function overallTone(overall) {
  if (overall === null || overall === undefined) return 'muted';
  if (overall >= 75) return 'strong';
  if (overall >= 45) return 'mid';
  return 'low';
}

const LeaderboardRow = ({ user, isCurrentUser }) => {
  const rankTone = !user.rank ? 'muted'
    : user.rank === 1 ? 'gold'
      : user.rank === 2 ? 'silver'
        : user.rank === 3 ? 'bronze'
          : 'default';

  return (
    <div
      className={`leaderboard-row ${isCurrentUser ? 'current-user' : ''}`}
      aria-current={isCurrentUser ? 'true' : undefined}
    >
      <div className="rank-cell">
        <span className={`rank-badge rank-badge--${rankTone}`}>{user.rank ?? NOT_ATTEMPTED}</span>
      </div>

      <div className="user-info">
        <p className="username" title={user.name}>{user.name}</p>
        {isCurrentUser && <span className="you-badge">You</span>}
      </div>

      <div className="score-cell"><SectionScore value={user.dsa} /></div>
      <div className="score-cell"><SectionScore value={user.aptitude} /></div>
      <div className="score-cell"><SectionScore value={user.sql} /></div>
      <div className="score-cell"><SectionScore value={user.mockInterview} /></div>

      <div className="score-cell score-cell--overall">
        {user.overall === null || user.overall === undefined ? (
          <span className="score-cell score-cell--empty" title="Not Attempted">
            {NOT_ATTEMPTED}
          </span>
        ) : (
          <span className={`overall-score overall-score--${overallTone(user.overall)}`}>
            {user.overall}
          </span>
        )}
      </div>
    </div>
  );
};

export default LeaderboardRow;