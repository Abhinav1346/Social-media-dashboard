const express = require('express');
const router = express.Router();
const { createPost, getFeed, likePost, commentPost, deletePost } = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, upload.single('media'), createPost);
router.get('/feed', protect, getFeed);
router.put('/:id/like', protect, likePost);
router.post('/:id/comment', protect, commentPost);
router.delete('/:id', protect, deletePost);

module.exports = router;
