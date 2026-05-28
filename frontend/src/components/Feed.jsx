import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Heart, MessageSquare, Image, Send, X, Plus, Check } from 'lucide-react';

export default function Feed({ onSelectUser }) {
  const { user, apiCall, API_URL } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Load Feed Posts and Follow Suggestions
  const loadFeedData = async () => {
    try {
      const postsRes = await apiCall('/posts/feed');
      if (postsRes.success) {
        setPosts(postsRes.data);
      }

      const usersRes = await apiCall('/users');
      if (usersRes.success) {
        setSuggestions(usersRes.data);
      }
    } catch (err) {
      console.error('Failed to load feed data:', err.message);
    }
  };

  useEffect(() => {
    loadFeedData();
  }, []);

  // Handle post media attachment
  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
  };

  // Submit new Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content && !mediaFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('content', content);
    if (mediaFile) {
      formData.append('media', mediaFile);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create post');
      }

      if (data.success) {
        setPosts([data.data, ...posts]);
        setContent('');
        setMediaFile(null);
        setMediaPreview('');
      }
    } catch (err) {
      console.error('Error creating post:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Like a post
  const handleLikePost = async (postId) => {
    try {
      const res = await apiCall(`/posts/${postId}/like`, { method: 'PUT' });
      if (res.success) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId ? { ...post, likes: res.likes } : post
          )
        );
      }
    } catch (err) {
      console.error('Error liking post:', err.message);
    }
  };

  // Toggle comments expand drawer
  const handleToggleComments = (postId) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
    } else {
      setActiveCommentsPostId(postId);
    }
  };

  // Submit comment
  const handleAddComment = async (postId) => {
    if (!commentContent.trim()) return;

    try {
      const res = await apiCall(`/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentContent }),
      });

      if (res.success) {
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post._id === postId) {
              const currentComments = post.comments || [];
              return {
                ...post,
                comments: [...currentComments, res.data],
              };
            }
            return post;
          })
        );
        setCommentContent('');
      }
    } catch (err) {
      console.error('Error adding comment:', err.message);
    }
  };

  // Follow/Unfollow Suggestion
  const handleFollowUser = async (userId) => {
    try {
      const res = await apiCall(`/users/follow/${userId}`, { method: 'POST' });
      if (res.success) {
        // Reload suggestions and feed posts
        loadFeedData();
      }
    } catch (err) {
      console.error('Error following user:', err.message);
    }
  };

  const formatPostTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
      
      {/* Feed Column */}
      <div>
        {/* Create Post Card */}
        <div className="glass-card create-post-box">
          <form onSubmit={handleCreatePost}>
            <textarea
              className="post-textarea"
              placeholder="What is on your mind? Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {mediaPreview && (
              <div className="post-media-preview-container">
                <img src={mediaPreview} alt="Preview" className="post-media-preview" />
                <button type="button" className="remove-media-btn" onClick={handleRemoveMedia}>
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="post-actions-bar">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Image size={18} className="media-upload-icon" />
                <span>Add Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMediaChange}
                  style={{ display: 'none' }}
                />
              </label>

              <button type="submit" className="glowing-btn" disabled={loading || (!content && !mediaFile)}>
                {loading ? 'Posting...' : (
                  <>
                    <span>Share Post</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <h4>No posts on your feed yet!</h4>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Follow people from suggestions to populate your timeline.</p>
          </div>
        ) : (
          posts.map((post) => {
            const hasLiked = post.likes.includes(user?._id);
            const isCommentsOpen = activeCommentsPostId === post._id;
            const commentsList = post.comments || [];

            return (
              <div key={post._id} className="glass-card post-card">
                
                {/* Header */}
                <div className="post-header">
                  <div className="post-author" onClick={() => onSelectUser(post.user.username)}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden' }}>
                      <img
                        src={post.user.profilePic ? `http://localhost:5000${post.user.profilePic}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${post.user.username}`}
                        alt={post.user.username}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <div className="post-author-name">{post.user.username}</div>
                      <div className="post-time">{formatPostTime(post.createdAt)}</div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                {post.content && <p className="post-content">{post.content}</p>}
                
                {/* Media Attachment */}
                {post.mediaUrl && (
                  <img src={`http://localhost:5000${post.mediaUrl}`} alt="Post content" className="post-media" />
                )}

                {/* Interaction Actions */}
                <div className="post-actions">
                  <button
                    className={`post-action-btn ${hasLiked ? 'liked' : ''}`}
                    onClick={() => handleLikePost(post._id)}
                  >
                    <Heart size={18} fill={hasLiked ? 'currentColor' : 'none'} />
                    <span>{post.likes.length} Likes</span>
                  </button>

                  <button className="post-action-btn" onClick={() => handleToggleComments(post._id)}>
                    <MessageSquare size={18} />
                    <span>{commentsList.length} Comments</span>
                  </button>
                </div>

                {/* Comment Section Drawer */}
                {isCommentsOpen && (
                  <div className="comments-section">
                    <div className="comments-list">
                      {commentsList.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                          Be the first to comment on this post!
                        </p>
                      ) : (
                        commentsList.map((comment) => (
                          <div key={comment._id} className="comment-item">
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden' }}>
                              <img
                                src={comment.user.profilePic ? `http://localhost:5000${comment.user.profilePic}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${comment.user.username}`}
                                alt={comment.user.username}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                            <div className="comment-bubble">
                              <div className="comment-header">
                                <span className="comment-user" onClick={() => onSelectUser(comment.user.username)} style={{ cursor: 'pointer' }}>{comment.user.username}</span>
                                <span className="comment-time">{formatPostTime(comment.createdAt)}</span>
                              </div>
                              <p style={{ color: 'var(--text-secondary)' }}>{comment.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="comment-input-bar">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Write a comment..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post._id)}
                      />
                      <button
                        className="glowing-btn"
                        style={{ padding: '0.5rem 1rem' }}
                        onClick={() => handleAddComment(post._id)}
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Right Column (Follow Suggestions) */}
      <div>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Who to Follow</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {suggestions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No suggestions available</p>
            ) : (
              suggestions.map((suggestion) => {
                const isUserFollowing = suggestion.followers.includes(user?._id);
                return (
                  <div key={suggestion._id} className="suggestion-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => onSelectUser(suggestion.username)}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden' }}>
                        <img
                          src={suggestion.profilePic ? `http://localhost:5000${suggestion.profilePic}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${suggestion.username}`}
                          alt={suggestion.username}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{suggestion.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '130px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {suggestion.bio || 'Hello, I am using Aura'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleFollowUser(suggestion._id)}
                      className={`glowing-btn ${isUserFollowing ? 'btn-outline' : ''}`}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '8px' }}
                    >
                      {isUserFollowing ? (
                        <Check size={12} />
                      ) : (
                        <Plus size={12} />
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
