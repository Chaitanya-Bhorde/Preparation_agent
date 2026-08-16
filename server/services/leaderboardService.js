const { UserStats, Leaderboard, User, UserFriends } = require('../models');

async function computeGlobalLeaderboard() {
  try {
    const rankings = await UserStats.aggregate([
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'userDoc' } },
      { $unwind: '$userDoc' },
      { $sort: { totalProblems: -1, acceptanceRate: -1 } },
      { $project: {
        userId: 1, username: '$userDoc.username', email: '$userDoc.email',
        totalProblems: 1, acceptanceRate: 1, rankingTier: 1,
        easyCount: 1, mediumCount: 1, hardCount: 1, currentStreak: 1, _id: 0
      } }
    ]);

    await Leaderboard.deleteMany({ leaderboardType: 'Global' });

    const leaderboardDocs = rankings.map((user, index) => ({
      userId: user.userId, username: user.username, email: user.email,
      rank: index + 1, totalProblems: user.totalProblems, acceptanceRate: user.acceptanceRate,
      rankingTier: user.rankingTier, easyCount: user.easyCount, mediumCount: user.mediumCount,
      hardCount: user.hardCount, currentStreak: user.currentStreak,
      leaderboardType: 'Global', snapshotDate: new Date()
    }));

    if (leaderboardDocs.length > 0) {
      await Leaderboard.insertMany(leaderboardDocs);
      console.log(`✅ Global leaderboard computed: ${leaderboardDocs.length} users ranked`);
    }

        return { type: 'Global', count: leaderboardDocs.length };
  } catch (err) {
    console.error('❌ Error computing global leaderboard:', err.message);
    throw err;
  }
}

/**
 * Compute and persist college-specific leaderboards
 * Ranks users within each college by totalProblems (desc), then acceptanceRate (desc)
 */
async function computeCollegeLeaderboards() {
  try {
    const colleges = await User.distinct('collegeId', { collegeId: { $ne: null } });

    if (colleges.length === 0) {
      console.log('⚠️ No colleges found, skipping college leaderboard computation');
      return { type: 'College', count: 0 };
    }

    let totalUsersRanked = 0;

    for (const collegeId of colleges) {
      const rankings = await UserStats.aggregate([
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'userDoc' } },
        { $unwind: '$userDoc' },
        { $match: { 'userDoc.collegeId': collegeId } },
        { $sort: { totalProblems: -1, acceptanceRate: -1 } },
        { $project: {
          userId: 1, username: '$userDoc.username', email: '$userDoc.email',
          totalProblems: 1, acceptanceRate: 1, rankingTier: 1,
          easyCount: 1, mediumCount: 1, hardCount: 1, currentStreak: 1, _id: 0
        } }
      ]);

      const leaderboardDocs = rankings.map((user, index) => ({
        userId: user.userId, username: user.username, email: user.email,
        rank: index + 1, totalProblems: user.totalProblems, acceptanceRate: user.acceptanceRate,
        rankingTier: user.rankingTier, easyCount: user.easyCount, mediumCount: user.mediumCount,
        hardCount: user.hardCount, currentStreak: user.currentStreak,
        leaderboardType: 'College', collegeId, snapshotDate: new Date()
      }));

      if (leaderboardDocs.length > 0) {
        await Leaderboard.deleteMany({ leaderboardType: 'College', collegeId });
        await Leaderboard.insertMany(leaderboardDocs);
        totalUsersRanked += leaderboardDocs.length;
        console.log(`✅ College leaderboard computed for ${collegeId}: ${leaderboardDocs.length} users ranked`);
      }
    }

    return { type: 'College', count: totalUsersRanked };
  } catch (err) {
    console.error('❌ Error computing college leaderboards:', err.message);
    throw err;
  }
}

/**
 * Compute and persist friend leaderboards for a specific user
 * Ranks the user's friends by totalProblems (desc), then acceptanceRate (desc)
 */
async function computeFriendLeaderboard(userId) {
  try {
    const userFriends = await UserFriends.findOne({ userId });

    if (!userFriends || userFriends.friends.length === 0) {
      console.log(`⚠️ User ${userId} has no friends, skipping friend leaderboard`);
      return { type: 'Friend', userId, count: 0 };
    }

    const friendIds = userFriends.friends.map(f => f.friendId);

    const rankings = await UserStats.aggregate([
      { $match: { userId: { $in: friendIds } } },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'userDoc' } },
      { $unwind: '$userDoc' },
      { $sort: { totalProblems: -1, acceptanceRate: -1 } },
      { $project: {
        userId: 1, username: '$userDoc.username', email: '$userDoc.email',
        totalProblems: 1, acceptanceRate: 1, rankingTier: 1,
        easyCount: 1, mediumCount: 1, hardCount: 1, currentStreak: 1, _id: 0
      } }
    ]);

    const leaderboardDocs = rankings.map((user, index) => ({
      userId: user.userId, username: user.username, email: user.email,
      rank: index + 1, totalProblems: user.totalProblems, acceptanceRate: user.acceptanceRate,
      rankingTier: user.rankingTier, easyCount: user.easyCount, mediumCount: user.mediumCount,
      hardCount: user.hardCount, currentStreak: user.currentStreak,
      leaderboardType: 'Friend', snapshotDate: new Date()
    }));

    if (leaderboardDocs.length > 0) {
      await Leaderboard.deleteMany({ leaderboardType: 'Friend', userId });
      await Leaderboard.insertMany(leaderboardDocs);
      console.log(`✅ Friend leaderboard computed for user ${userId}: ${leaderboardDocs.length} friends ranked`);
    }

    return { type: 'Friend', userId, count: leaderboardDocs.length };
  } catch (err) {
        throw err;
  }
}

/**
 * Fetch leaderboard by type (Global, College, Friend)
 * Supports pagination
 */
async function getLeaderboard(type, options = {}) {
  try {
    const { collegeId = null, limit = 50, page = 1 } = options;

    const query = { leaderboardType: type };
    if (collegeId) {
      query.collegeId = collegeId;
    }

    const leaderboard = await Leaderboard.find(query)
      .sort({ rank: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-__v -leaderboardType -snapshotDate');

    const total = await Leaderboard.countDocuments(query);

    return {
      type,
      leaderboard,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  } catch (err) {
    console.error(`❌ Error fetching ${type} leaderboard:`, err.message);
    throw err;
  }
}

/**
 * Fetch user's rank in global leaderboard
 */
async function getUserGlobalRank(userId) {
  try {
    const rank = await Leaderboard.findOne(
      { userId, leaderboardType: 'Global' },
      { rank: 1 }
    );
    return rank ? rank.rank : null;
  } catch (err) {
    console.error(`❌ Error fetching global rank for user ${userId}:`, err.message);
    throw err;
  }
}

module.exports = {
  computeGlobalLeaderboard,
  computeCollegeLeaderboards,
  computeFriendLeaderboard,
  getLeaderboard,
  getUserGlobalRank
};