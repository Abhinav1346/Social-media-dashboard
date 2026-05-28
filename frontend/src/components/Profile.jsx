import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Edit2, Camera, UserPlus, UserCheck, Heart, MessageSquare } from 'lucide-react';
import { MEDIA_URL } from '../config';

export default function Profile({ targetUsername }) {
  const { user: currentUser, updateProfile, apiCall } = useContext(AuthContext);
  const { unreadNotifications } = useContext(SocketContext);

  const [profileUser, setProfileUser] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [bannerPicFile, setBannerPicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState('');
  const [bannerPicPreview, setBannerPicPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const isOwnProfile = !targetUsername || targetUsername === currentUser?.username;

  const loadProfile = async () => {
    try {
      const usernameToFetch = targetUsername || currentUser?.username;
      if (!usernameToFetch) return;

      const profileRes = await apiCall(`/users/profile/${usernameToFetch}`);
      if (profileRes.success) {
        setProfileUser(profileRes.data);
        setBio(profileRes.data.bio || '');
        
        // Fetch posts by this user from feed
        const postsRes = await apiCall('/posts/feed');
        if (postsRes.success) {
          const userPosts = postsRes.data.filter(
            (post) => post.user.username === usernameToFetch
          );
          setProfilePosts(userPosts);
        }
      }
    } catch (err) {
      console.error('Failed to load profile details:', err.message);
    }
  };

  useEffect(() => {
    loadProfile();
    setIsEditing(false);
    setProfilePicFile(null);
    setBannerPicFile(null);
    setProfilePicPreview('');
    setBannerPicPreview('');
  }, [targetUsername, currentUser]);

  const handleFollowToggle = async () => {
    if (!profileUser) return;
    try {
      const res = await apiCall(`/users/follow/${profileUser._id}`, { method: 'POST' });
      if (res.success) {
        // Toggle follow locally in profile view
        loadProfile();
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err.message);
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerPicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerPicFile(file);
      setBannerPicPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(bio, profilePicFile, bannerPicFile);
      setIsEditing(false);
      // Reload profile data
      loadProfile();
    } catch (err) {
      console.error('Error updating profile:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profileUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading profile information...</p>
      </div>
    );
  }

  const isFollowing = profileUser.followers.some((f) => f._id === currentUser?._id);

  return (
    <div>
      {/* Banner & Avatar Area */}
      <div className="profile-banner-container">
        <img
          src={bannerPicPreview || (profileUser.bannerPic ? `${MEDIA_URL}${profileUser.bannerPic}` : `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop`)}
          alt="Banner"
          className="profile-banner"
        />
        
        {isEditing && (
          <label style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Camera size={14} />
            <span>Change Banner</span>
            <input type="file" accept="image/*" onChange={handleBannerPicChange} style={{ display: 'none' }} />
          </label>
        )}

        <div className="profile-avatar-container">
          <img
            src={profilePicPreview || (profileUser.profilePic ? `${MEDIA_URL}${profileUser.profilePic}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUser.username}`)}
            alt={profileUser.username}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {isEditing && (
            <label style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer'
            }}>
              <Camera size={20} />
              <input type="file" accept="image/*" onChange={handleProfilePicChange} style={{ display: 'none' }} />
            </label>
          )}
        </div>
      </div>

      {/* Profile Overview */}
      <div className="profile-info-grid" style={{ marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '2.2rem' }}>{profileUser.username}</h1>
            
            {isOwnProfile ? (
              !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="glowing-btn btn-outline"
                  style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', gap: '0.4rem' }}
                >
                  <Edit2 size={14} />
                  <span>Edit Profile</span>
                </button>
              )
            ) : (
              <button
                onClick={handleFollowToggle}
                className={`glowing-btn ${isFollowing ? 'btn-outline' : ''}`}
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', gap: '0.4rem' }}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={14} />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>

          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0', fontStyle: profileUser.bio ? 'normal' : 'italic' }}>
            {profileUser.bio || 'This user has not written a bio yet.'}
          </p>

          <div className="profile-stats-row">
            <div className="profile-stat-box">
              <div className="profile-stat-val">{profilePosts.length}</div>
              <div className="profile-stat-lbl">Posts</div>
            </div>
            <div className="profile-stat-box">
              <div className="profile-stat-val">{profileUser.followers.length}</div>
              <div className="profile-stat-lbl">Followers</div>
            </div>
            <div className="profile-stat-box">
              <div className="profile-stat-val">{profileUser.following.length}</div>
              <div className="profile-stat-lbl">Following</div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Edit Bio Details</h3>
            <form onSubmit={handleSaveChanges}>
              <div className="form-group">
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="glowing-btn" style={{ flex: 1, padding: '0.5rem' }} disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="glowing-btn btn-outline"
                  style={{ flex: 1, padding: '0.5rem' }}
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="profile-tabs">
        <div
          className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts ({profilePosts.length})
        </div>
        <div
          className={`profile-tab ${activeTab === 'followers' ? 'active' : ''}`}
          onClick={() => setActiveTab('followers')}
        >
          Followers ({profileUser.followers.length})
        </div>
        <div
          className={`profile-tab ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => setActiveTab('following')}
        >
          Following ({profileUser.following.length})
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {profilePosts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>This user hasn't posted anything yet.</p>
          ) : (
            profilePosts.map((post) => (
              <div key={post._id} className="glass-card post-card" style={{ maxWidth: '750px' }}>
                <div className="post-header">
                  <div className="post-author">
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden' }}>
                      <img
                        src={profileUser.profilePic ? `${MEDIA_URL}${profileUser.profilePic}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${profileUser.username}`}
                        alt={profileUser.username}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <div className="post-author-name">{profileUser.username}</div>
                      <div className="post-time">{new Date(post.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>

                {post.content && <p className="post-content">{post.content}</p>}
                
                {post.mediaUrl && (
                  <img src={`${MEDIA_URL}${post.mediaUrl}`} alt="Post content" className="post-media" />
                )}

                <div className="post-actions" style={{ border: 'none', paddingTop: 0 }}>
                  <div className="post-action-btn">
                    <Heart size={18} />
                    <span>{post.likes.length} Likes</span>
                  </div>
                  <div className="post-action-btn">
                    <MessageSquare size={18} />
                    <span>{post.comments ? post.comments.length : 0} Comments</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'followers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {profileUser.followers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No followers yet.</p>
          ) : (
            profileUser.followers.map((f) => (
              <div key={f._id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden' }}>
                  <img
                    src={f.profilePic ? `${MEDIA_URL}${f.profilePic}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${f.username}`}
                    alt={f.username}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: '600' }}>{f.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.bio || 'Hello World'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'following' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {profileUser.following.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not following anyone yet.</p>
          ) : (
            profileUser.following.map((f) => (
              <div key={f._id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden' }}>
                  <img
                    src={f.profilePic ? `${MEDIA_URL}${f.profilePic}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${f.username}`}
                    alt={f.username}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: '600' }}>{f.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.bio || 'Hello World'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
