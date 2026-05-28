const User = require('../models/User');
const Notification = require('../models/Notification');
const { getPubClient } = require('../config/redis');

// @desc    Get user profile by username
// @route   GET /api/users/profile/:username
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'username profilePic bio')
      .populate('following', 'username profilePic bio');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile (bio, avatar, banner)
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update bio if sent
    if (req.body.bio !== undefined) {
      user.bio = req.body.bio;
    }

    // Check for uploaded files
    if (req.files) {
      if (req.files.profilePic && req.files.profilePic[0]) {
        user.profilePic = `/uploads/${req.files.profilePic[0].filename}`;
      }
      if (req.files.bannerPic && req.files.bannerPic[0]) {
        user.bannerPic = `/uploads/${req.files.bannerPic[0].filename}`;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Follow / Unfollow a user
// @route   POST /api/users/follow/:id
// @access  Private
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (userToFollow._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const isFollowing = currentUser.following.includes(userToFollow._id);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== userToFollow._id.toString()
      );
      userToFollow.followers = userToFollow.followers.filter(
        (id) => id.toString() !== currentUser._id.toString()
      );

      await currentUser.save();
      await userToFollow.save();

      res.status(200).json({ success: true, message: `Unfollowed ${userToFollow.username}`, following: false });
    } else {
      // Follow
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);

      await currentUser.save();
      await userToFollow.save();

      // Create Bell Notification
      const notification = await Notification.create({
        receiver: userToFollow._id,
        sender: currentUser._id,
        type: 'follow',
      });

      // Populate sender details for real-time dispatch
      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'username profilePic');

      // Publish notification to Redis Pub/Sub
      const pubClient = getPubClient();
      if (pubClient) {
        await pubClient.publish('notifications', JSON.stringify(populatedNotification));
      }

      res.status(200).json({ success: true, message: `Followed ${userToFollow.username}`, following: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users for suggestions
// @route   GET /api/users
// @access  Private
exports.getAllUsers = async (req, res) => {
  try {
    // Get all users except current user
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('username profilePic bio followers')
      .limit(10);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
