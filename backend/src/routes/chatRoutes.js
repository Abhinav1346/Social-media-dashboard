const express = require('express');
const router = express.Router();
const { getMessages, getChatList } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/messages/:userId', protect, getMessages);
router.get('/list', protect, getChatList);

module.exports = router;
