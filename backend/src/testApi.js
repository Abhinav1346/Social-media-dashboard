const fetch = globalThis.fetch || require('node-fetch');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Test Data
const userA = {
  username: `alice_${Math.floor(Math.random() * 10000)}`,
  email: `alice_${Math.floor(Math.random() * 10000)}@test.com`,
  password: 'password123',
};

const userB = {
  username: `bob_${Math.floor(Math.random() * 10000)}`,
  email: `bob_${Math.floor(Math.random() * 10000)}@test.com`,
  password: 'password123',
};

async function runTests() {
  console.log('==================================================');
  console.log('🧪 STARTING SOCIAL MEDIA DASHBOARD INTEGRATION TESTS');
  console.log('==================================================\n');

  let tokenA, tokenB, idA, idB, postId, commentId;

  try {
    // 1. Register User A (Alice)
    console.log(`[1/9] Registering User A (${userA.username})...`);
    const regResA = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userA),
    });
    const regDataA = await regResA.json();
    if (!regDataA.success) throw new Error(`Registration A failed: ${regDataA.message}`);
    tokenA = regDataA.data.token;
    idA = regDataA.data._id;
    console.log(`✨ User A registered successfully! ID: ${idA}`);

    // 2. Register User B (Bob)
    console.log(`\n[2/9] Registering User B (${userB.username})...`);
    const regResB = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userB),
    });
    const regDataB = await regResB.json();
    if (!regDataB.success) throw new Error(`Registration B failed: ${regDataB.message}`);
    tokenB = regDataB.data.token;
    idB = regDataB.data._id;
    console.log(`✨ User B registered successfully! ID: ${idB}`);

    // 3. User A profile check
    console.log(`\n[3/9] Fetching profile of User A...`);
    const meRes = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    const meData = await meRes.json();
    if (!meData.success) throw new Error(`GetMe failed: ${meData.message}`);
    console.log(`✨ Fetched profile for: ${meData.data.username}`);

    // 4. User A Creates a Post
    console.log(`\n[4/9] User A creating a new post...`);
    const postRes = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ content: 'Hello World! Aura dashboard integration test post.' }),
    });
    const postData = await postRes.json();
    if (!postData.success) throw new Error(`Post creation failed: ${postData.message}`);
    postId = postData.data._id;
    console.log(`✨ Post created successfully! Post ID: ${postId}`);

    // 5. User B Follows User A
    console.log(`\n[5/9] User B following User A...`);
    const followRes = await fetch(`${API_URL}/users/follow/${idA}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenB}` },
    });
    const followData = await followRes.json();
    if (!followData.success) throw new Error(`Following user failed: ${followData.message}`);
    console.log(`✨ Success: User B is now following User A! Response: "${followData.message}"`);

    // 6. User B Likes User A's Post
    console.log(`\n[6/9] User B liking User A's post...`);
    const likeRes = await fetch(`${API_URL}/posts/${postId}/like`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${tokenB}` },
    });
    const likeData = await likeRes.json();
    if (!likeData.success) throw new Error(`Liking post failed: ${likeData.message}`);
    console.log(`✨ Success: Post liked! Total Likes now: ${likeData.likes.length}`);

    // 7. User B Comments on User A's Post
    console.log(`\n[7/9] User B commenting on User A's post...`);
    const commentRes = await fetch(`${API_URL}/posts/${postId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ content: 'Outstanding work! Excited to see this.' }),
    });
    const commentData = await commentRes.json();
    if (!commentData.success) throw new Error(`Commenting failed: ${commentData.message}`);
    commentId = commentData.data._id;
    console.log(`✨ Success: Comment added! Comment content: "${commentData.data.content}"`);

    // 8. User A Checks Notifications (delivered via Redis/WebSocket pub-sub triggers)
    console.log(`\n[8/9] User A fetching notifications inbox...`);
    const notifyRes = await fetch(`${API_URL}/notifications`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    const notifyData = await notifyRes.json();
    if (!notifyData.success) throw new Error(`Fetching notifications failed: ${notifyData.message}`);
    console.log(`✨ Successfully retrieved ${notifyData.data.length} notifications!`);
    notifyData.data.forEach((notif, idx) => {
      console.log(`   👉 Notification ${idx + 1}: [Type: ${notif.type}] sender "${notif.sender.username}"`);
    });

    // 9. User A Fetches Engagement Analytics Data
    console.log(`\n[9/9] User A fetching engagement analytics...`);
    const analyticsRes = await fetch(`${API_URL}/analytics`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    const analyticsData = await analyticsRes.json();
    if (!analyticsData.success) throw new Error(`Fetching analytics failed: ${analyticsData.message}`);

    const summary = analyticsData.data.summary;
    console.log(`✨ Analytics Summary Retrieved:`);
    console.log(`   📈 Total Followers: ${summary.followers}`);
    console.log(`   📝 Total Posts: ${summary.posts}`);
    console.log(`   ❤️ Total Likes Received: ${summary.likes}`);
    console.log(`   💬 Total Comments Received: ${summary.comments}`);
    console.log(`   📊 Calculated Engagement Rate: ${summary.engagementRate}`);
    console.log(`   👀 Profile Views Counter: ${summary.profileViews}`);

    console.log('\n==================================================');
    console.log('✅ ALL INTEGRATION TESTS PASSED TRIUMPHANTLY!');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILURE:');
    console.error(error.message);
  } finally {
    // Database cleanup: connect to DB and delete created records to keep environment pristine
    console.log('\n🧹 Cleaning up generated test database entries...');
    try {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/social_dashboard');
      const User = require('./models/User');
      const Post = require('./models/Post');
      const Comment = require('./models/Comment');
      const Notification = require('./models/Notification');

      if (idA) await User.findByIdAndDelete(idA);
      if (idB) await User.findByIdAndDelete(idB);
      if (postId) {
        await Post.findByIdAndDelete(postId);
        await Comment.deleteMany({ post: postId });
      }
      await Notification.deleteMany({ $or: [{ receiver: idA }, { receiver: idB }] });

      console.log('✨ Cleanup complete! Test records successfully removed.');
    } catch (cleanError) {
      console.error('Warning: Failed to clean up database records:', cleanError.message);
    } finally {
      await mongoose.disconnect();
    }
  }
}

runTests();
