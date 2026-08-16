import React, { useContext } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useState } from 'react';
import LeaderboardTable from '../components/LeaderboardTable';
import { Link } from 'react-router-dom';
import '../components/LeaderboardRow.css';
import '../components/LeaderboardTable.css';

const GlobalLeaderboardPage = () => {
  const { data, loading, error, pagination, goToPage } = useLeaderboard('global', {
    limit: 50
  });

  const [page, setPage] = useState(1);

  const handlePageChange = (pageNum) => {
    setPage(pageNum);
    goToPage(pageNum);
  };

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1>🌍 Global Leaderboard</h1>
        <p className="subtitle">Ranked by total problems solved, then acceptance rate</p>
      </div>

      <div className="info-box">
        <span>{pagination.total} users ranked</span>
      </div>

      <LeaderboardTable
        data={data}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        currentUserId={null}
      />

      <div className="pagination-control">
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            {pagination.page > 1 && (
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                className="pagination-btn"
                style={{
                  background: 'transparent',
                  border: '1px solid #3a3a3a',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 14
                }}
                disabled={pagination.page <= 1}
              >
                Prev
              </button>
            )}
            {pagination.page < pagination.pages && (
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                className="pagination-btn"
                style={{
                  background: 'transparent',
                  border: '1px solid #3a3a3a',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Next
              </button>
            )}
          </div>
        )}
      </pagination-control>
    </div>
  );
};

export default GlobalLeaderboardPage;