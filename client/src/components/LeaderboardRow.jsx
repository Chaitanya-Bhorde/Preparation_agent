import React from 'react';
import './LeaderboardRow.css';

const LeaderboardRow = ({ rank, user, isCurrentUser }) => {
  const getTierColor = (tier) => {
    const tierColors = {
      Bronze: '#CD7F32',
      Silver: '#C0C0C0',
      Gold: '#FFD700',
      Platinum: '#E5E4E2',
      Diamond: '#B9F2FF'
    };
    return tierColors[tier] || '#999';
  };

  return (
    <div className={`leaderboard-row ${isCurrentUser ? 'current-user' : ''}`}>
      <div className="rank-cell">
        <span className="rank-badge">{rank}</span>
      </div>

      <div className="user-info">
        <p className="username">{user.username}</p>
        <span
          className="tier-badge"
          style={{ backgroundColor: getTierColor(user.rankingTier) }}
        >
          {user.rankingTier}
        </span>
      </div>

      <div className="stats-cell">
        <div className="stat">
          <span className="stat-label">Problems</span>
          <span className="stat-value">{user.totalProblems}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Easy</span>
          <span className="stat-value easy">{user.easyCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Medium</span>
          <span className="stat-value medium">{user.mediumCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Hard</span>
          <span className="stat-value hard">{user.hardCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Acceptance</span>
          <span className="stat-value">{user.acceptanceRate}%</span>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardRow;