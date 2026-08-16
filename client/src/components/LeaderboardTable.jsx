import React from 'react';
import './LeaderboardTable.css';

const LeaderboardTable = ({ data, loading, error, pagination, onPageChange, currentUserId }) => {
  if (loading) {
    return (
      <div className="loading-state">
        <div></div>
        <div></div>
        <div></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <span>{error || 'Failed to load leaderboard'}</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <span>No data available</span>
      </div>
    );
  }

  return (
    <div className="leaderboard-table">
      <div className="table-header">
        <div className="col rank">Rank</div>
        <div className="col user">User</div>
        <div className="col stats">Stats</div>
      </div>

      <div className="table-scroll">
        {data.map((user, index) => (
          <LeaderboardRow
            key={user._id || user.userId}
            rank={index + 1}
            user={user}
            isCurrentUser={currentUserId && user._id && user._id.toString() === currentUserId.toString()}
          />
        ))}
      </table>
    </div>
  );
};

export default LeaderboardTable;