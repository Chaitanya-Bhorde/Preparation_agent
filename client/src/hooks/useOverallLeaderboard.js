import { useState, useEffect, useCallback } from 'react';
import { getOverallLeaderboard } from '../api';

/**
 * useOverallLeaderboard
 * ---------------------------------------------------------------------------
 * Fetches the REAL performance board (Rank | Name | DSA | Aptitude | SQL |
 * Mock Interview | Overall) from GET /api/leaderboard/overall.
 *
 * The three states are kept strictly separate, as required:
 *   loading -> `loading === true`   (never a placeholder row of zeros)
 *   error   -> `error !== null`     (a failed request is NEVER papered over
 *                                    with previously cached or invented data)
 *   empty   -> `data` is [] and `error`/`loading` are falsy
 *
 * `currentUser` comes from the response, so the highlighted row and the caller's
 * rank are the server's own numbers — never a client-side guess.
 */
const useOverallLeaderboard = ({ limit = 50 } = {}) => {
  const [data, setData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [scoring, setScoring] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, pages: 1 });

  const fetchLeaderboard = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getOverallLeaderboard({ page: pageNum, limit });
        const body = res.data || {};
        setData(Array.isArray(body.leaderboard) ? body.leaderboard : []);
        setCurrentUser(body.currentUser || null);
        setScoring(body.scoring || null);
        setPagination(body.pagination || { page: pageNum, limit, total: 0, pages: 1 });
      } catch (err) {
        // Keep the error explicit and drop any stale rows so the UI cannot show
        // an old board as if it were fresh.
        setError(err.response?.data?.error || 'Unable to load leaderboard. Please try again.');
        setData([]);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchLeaderboard(page);
  }, [page, fetchLeaderboard]);

  const goToPage = useCallback(
    (pageNum) => {
      if (pageNum >= 1 && pageNum <= pagination.pages) setPage(pageNum);
    },
    [pagination.pages]
  );

  const refresh = useCallback(() => fetchLeaderboard(page), [fetchLeaderboard, page]);

  return { data, currentUser, scoring, loading, error, pagination, page, goToPage, refresh };
};

export default useOverallLeaderboard;