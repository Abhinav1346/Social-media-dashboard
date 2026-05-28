const express = require('express');
const router = express.Router();
const { getUserProfile, updateProfile, followUser, getAllUsers } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Handle double media uploads for profile customization
const profileUpload = upload.fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'bannerPic', maxCount: 1 },
]);

router.get('/profile/:username', protect, getUserProfile);
router.put('/profile', protect, profileUpload, updateProfile);
router.post('/follow/:id', protect, followUser);
router.get('/', protect, getAllUsers);

module.exports = router;
