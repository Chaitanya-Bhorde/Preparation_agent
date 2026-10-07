import React, { useMemo } from 'react';
import { Trophy, Info, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useOverallLeaderboard from '../hooks/useOverallLeaderboard';
import LeaderboardTable from '../components/LeaderboardTable';
import { usePageTitle } from '../hooks/usePageTitle';
import { PAGE_CONTAINER, CARD_CLASSES } from '../utils/ui';
import '../components/LeaderboardRow.css';
import '../components/LeaderboardTable.css';

/**
 * Overall Ranking — the real application-wide performance leaderboard.
 *
 *   Rank | Name | DSA | Aptitude | SQL | Mock Interview | Overall
 *
 * Every value comes from GET /api/leaderboard/overall, which aggregates the
 * user's own persisted submissions and mock interviews. Ranks are computed by
 * the server on every request from the Overall score, so they move the moment
 * real activity changes — nothing here is hardcoded and no rows are invented.
 */
const GlobalLeaderboardPage = () => {
  usePageTitle('Leaderboard');
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;

  const {
    data,
    currentUser,
    scoring,
    loading,
    error,
    pagination,
    page,
    goToPage,
    refresh,
  } = useOverallLeaderboard({ limit: 50 });

  // The caller's row may live on another page, so it is surfaced separately
  // rather than being dropped when it is not in the current slice.
  const callerOnThisPage = useMemo(
    () => data.find((r) => String(r.userId) === String(currentUserId)) || null,
    [data, currentUserId]
  );
  const caller = callerOnThisPage || currentUser;

  // Which page the caller's own row lives on, so "Go to my rank" can jump there.
  const callerPage = caller && caller.rank
    ? Math.min(Math.ceil(caller.rank / (pagination.limit || 50)), pagination.pages)
    : 1;

  const notRanked =
    !loading && !error && pagination.total > 0 && Boolean(caller) && !caller.rank;

  return (
    <div className={PAGE_CONTAINER}>
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" /> Leaderboard
        </h1>
        <p className="text-sm text-gray-400">
          Overall Ranking — ranked by combined DSA, Aptitude, SQL and Mock Interview
          performance
        </p>
      </div>

      {!loading && !error && (
        <div className={`${CARD_CLASSES} mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm`}>
          <span className="text-white font-medium">{pagination.total} users ranked</span>
          {scoring && (
            <span className="text-xs text-gray-500">
              Overall = mean of the sections you have attempted. A section with no
              activity shows as &ldquo;&mdash;&rdquo;, never as 0.
            </span>
          )}
        </div>
      )}

      {/* Current-user highlight: the server's own row and rank, never a guess. */}
      {caller && caller.rank && !callerOnThisPage && (
        <div className={`${CARD_CLASSES} mb-4 flex flex-wrap items-center gap-3 text-sm border-amber-500/30`}>
          <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
          <span className="text-gray-300">
            You are ranked <strong className="text-white">#{caller.rank}</strong> of{' '}
            {pagination.total} with an overall score of{' '}
            <strong className="text-white">{caller.overall}</strong>.
          </span>
          <button
            type="button"
            onClick={() => goToPage(callerPage)}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-800"
          >
            Go to my rank
          </button>
        </div>
      )}

      {notRanked && (
        <div className={`${CARD_CLASSES} mb-4 flex items-start gap-3 text-sm`}>
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <span className="text-gray-300">
            You are not ranked yet because you have no completed DSA, Aptitude, SQL
            or Mock Interview activity. Complete one and you will appear here
            automatically.
          </span>
        </div>
      )}

      <div className={CARD_CLASSES}>
        <h2 className="text-lg font-semibold text-white mb-4">Overall Ranking</h2>
        <LeaderboardTable
          data={data}
          loading={loading}
          error={error}
          currentUserId={currentUserId}
          onRetry={refresh}
        />

        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= pagination.pages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-200 hover:bg-gray-800"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalLeaderboardPage;