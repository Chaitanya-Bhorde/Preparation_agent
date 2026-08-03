import { useState, useEffect } from 'react';
import { getPracticeSkills } from '../../api';
import { CARD_CLASSES } from '../../utils/ui';

const TIER_COLORS = {
  Fundamental: { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-700' },
  Intermediate: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-700' },
  Advanced: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700' },
};

const TIER_ORDER = ['Fundamental', 'Intermediate', 'Advanced'];

export default function SkillsTags({ userId }) {
  const [data, setData] = useState({ Fundamental: [], Intermediate: [], Advanced: [] });
  const [loading, setLoading] = useState(true);
  const [expandedTiers, setExpandedTiers] = useState({});

  useEffect(() => {
    loadSkills();
  }, [userId]);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const { data: res } = await getPracticeSkills(userId);
      setData(res.data || { Fundamental: [], Intermediate: [], Advanced: [] });
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTier = (tier) => {
    setExpandedTiers((prev) => ({ ...prev, [tier]: !prev[tier] }));
  };

  if (loading) {
    return (
      <div className={CARD_CLASSES}>
        <h3 className="text-lg font-semibold text-white mb-4">Skills & Tags</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const hasAnyData = TIER_ORDER.some((tier) => data[tier] && data[tier].length > 0);

  if (!hasAnyData) {
    return (
      <div className={CARD_CLASSES}>
        <h3 className="text-lg font-semibold text-white mb-4">Skills & Tags</h3>
        <p className="text-gray-500 text-sm">No data yet</p>
      </div>
    );
  }

  return (
    <div className={CARD_CLASSES}>
      <h3 className="text-lg font-semibold text-white mb-4">Skills & Tags</h3>
      <div className="space-y-4">
        {TIER_ORDER.map((tier) => {
          const tags = data[tier] || [];
          if (tags.length === 0) return null;
          const colors = TIER_COLORS[tier];
          const isExpanded = expandedTiers[tier];
          const visibleTags = isExpanded ? tags : tags.slice(0, 3);
          const hasMore = tags.length > 3;

          return (
            <div key={tier}>
              <h4 className={`text-xs font-medium uppercase tracking-wider mb-2 ${colors.text}`}>
                {tier} ({tags.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {visibleTags.map((tag) => (
                  <span
                    key={tag.tag}
                    className={`px-3 py-1 rounded-full text-xs ${colors.bg} ${colors.text} border ${colors.border}`}
                  >
                    {tag.tag} ({tag.solvedCount})
                  </span>
                ))}
                {hasMore && (
                  <button
                    onClick={() => toggleTier(tier)}
                    className="px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {isExpanded ? 'Show less' : `Show +${tags.length - 3} more`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
