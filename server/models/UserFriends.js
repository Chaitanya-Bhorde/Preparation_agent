const mongoose = require('mongoose');

const UserFriendsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    friends: [
      {
        friendId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        addedAt: { type: Date, default: Date.now }
      }
    ],
    friendRequests: [
      {
        fromUserId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        requestedAt: { type: Date, default: Date.now }
      }
    ],
    blockedUsers: [
      {
        blockedUserId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        blockedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

// Index for fast friend lookups
UserFriendsSchema.index({ 'friends.friendId': 1 });

module.exports = mongoose.model('UserFriends', UserFriendsSchema);