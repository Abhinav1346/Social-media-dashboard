const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { getPubClient } = require('../config/redis');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let mediaUrl = '';

    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    }

    if (!content && !mediaUrl) {
      return res.status(400).json({ success: false, message: 'Post content or media is required' });
    }

    const post = await Post.create({
      user: req.user.id,
      content,
      mediaUrl,
    });

    const populatedPost = await Post.findById(post._id).populate('user', 'username profilePic');

    res.status(201).json({ success: true, data: populatedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get feed posts (followed users + recommended)
// @route   GET /api/posts/feed
// @access  Private
exports.getFeed = async (req, res) => {
  try {
    const followedUserIds = req.user.following || [];
    // Include user's own posts and followed posts
    const queryIds = [...followedUserIds, req.user.id];

    const posts = await Post.find({ user: { $in: queryIds } })
      .populate('user', 'username profilePic')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'username profilePic' },
        options: { sort: { createdAt: -1 } }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: posts.length, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Like / Unlike a post
// @route   PUT /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user.id);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== req.user.id.toString());
      await post.save();
      res.status(200).json({ success: true, message: 'Post unliked', likes: post.likes });
    } else {
      // Like
      post.likes.push(req.user.id);
      await post.save();

      // Trigger notification if not liking own post
      if (post.user.toString() !== req.user.id.toString()) {
        const notification = await Notification.create({
          receiver: post.user,
          sender: req.user.id,
          type: 'like',
          post: post._id,
        });

        // Populate details
        const populatedNotification = await Notification.findById(notification._id)
          .populate('sender', 'username profilePic');

        // Redis Publish
        const pubClient = getPubClient();
        if (pubClient) {
          await pubClient.publish('notifications', JSON.stringify(populatedNotification));
        }
      }

      res.status(200).json({ success: true, message: 'Post liked', likes: post.likes });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Comment on a post
// @route   POST /api/posts/:id/comment
// @access  Private
exports.commentPost = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: post._id,
      user: req.user.id,
      content,
    });

    const populatedComment = await Comment.findById(comment._id).populate('user', 'username profilePic');

    // Trigger notification if not commenting on own post
    if (post.user.toString() !== req.user.id.toString()) {
      const notification = await Notification.create({
        receiver: post.user,
        sender: req.user.id,
        type: 'comment',
        post: post._id,
      });

      // Populate details
      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'username profilePic');

      // Redis Publish
      const pubClient = getPubClient();
      if (pubClient) {
        await pubClient.publish('notifications', JSON.stringify(populatedNotification));
      }
    }

    res.status(201).json({ success: true, data: populatedComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check post ownership
    if (post.user.toString() !== req.user.id.toString()) {
      return res.status(401).json({ success: false, message: 'User not authorized to delete this post' });
    }

    await post.deleteOne();
    // Delete associated comments
    await Comment.deleteMany({ post: post._id });

    res.status(200).json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
