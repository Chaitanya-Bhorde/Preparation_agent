import { useState, useEffect } from 'react';
import axios from 'axios';

const useLeaderboard = (type, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1
  });

  const fetchLeaderboard = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);

      let url = `/api/leaderboard/${type.toLowerCase()}`;
      const params = {
        page: pageNum,
        limit: options.limit || 50
      };

      if (type === 'college' && options.collegeId) {
        url = `/api/leaderboard/college/${options.collegeId}`;
      }

      const response = await axios.get(url, { params });
      setData(response.data.leaderboard);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(pagination.page);
  }, [type]);

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= pagination.pages) {
      fetchLeaderboard(pageNum);
    }
  };

  return { data, loading, error, pagination, goToPage };
};

export default useLeaderboard;