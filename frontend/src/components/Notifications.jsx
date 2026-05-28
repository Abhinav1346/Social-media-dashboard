import React, { useEffect, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { Bell, Heart, MessageSquare, UserCheck, MessageCircle, RefreshCw } from 'lucide-react';

export default function Notifications({ onSelectUser }) {
  const { notifications, markNotificationsRead } = useContext(SocketContext);

  // Mark all notifications as read automatically when the user views the tab
  useEffect(() => {
    markNotificationsRead();
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return (
          <div className="notification-icon-wrapper like">
            <Heart size={18} fill="currentColor" />
          </div>
        );
      case 'comment':
        return (
          <div className="notification-icon-wrapper comment">
            <MessageSquare size={18} />
          </div>
        );
      case 'follow':
        return (
          <div className="notification-icon-wrapper follow">
            <UserCheck size={18} />
          </div>
        );
      case 'message':
        return (
          <div className="notification-icon-wrapper comment" style={{ background: 'rgba(0, 242, 254, 0.1)', color: 'var(--primary)' }}>
            <MessageCircle size={18} />
          </div>
        );
      default:
        return (
          <div className="notification-icon-wrapper comment">
            <Bell size={18} />
          </div>
        );
    }
  };

  const getNotificationText = (notification) => {
    const senderName = notification.sender?.username || 'Someone';
    
    switch (notification.type) {
      case 'like':
        return (
          <>
            <span onClick={() => onSelectUser(senderName)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>{senderName}</span>
            {' liked your post'}
          </>
        );
      case 'comment':
        return (
          <>
            <span onClick={() => onSelectUser(senderName)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>{senderName}</span>
            {' commented on your post'}
          </>
        );
      case 'follow':
        return (
          <>
            <span onClick={() => onSelectUser(senderName)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>{senderName}</span>
            {' started following you'}
          </>
        );
      case 'message':
        return (
          <>
            <span onClick={() => onSelectUser(senderName)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>{senderName}</span>
            {' sent you a private message'}
          </>
        );
      default:
        return 'New alert received';
    }
  };

  const formatNotificationTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Bell size={28} style={{ color: 'var(--primary)' }} />
        <span>Notifications Log</span>
      </h2>

      <div className="notifications-panel">
        {notifications.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            <Bell size={40} style={{ strokeWidth: 1.5, color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h4>Your alerts stream is clear!</h4>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Engagements, likes, and followers will trigger alerts in real-time.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
            >
              {getNotificationIcon(notification.type)}

              <div className="notification-text">
                <p style={{ color: 'var(--text-primary)' }}>{getNotificationText(notification)}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {formatNotificationTime(notification.createdAt)}
                </span>
              </div>

              {notification.post && notification.post.mediaUrl && (
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img
                    src={`http://localhost:5000${notification.post.mediaUrl}`}
                    alt="Post thumbnail"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
