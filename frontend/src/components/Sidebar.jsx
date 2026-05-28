import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { MEDIA_URL } from '../config';
import {
  Rss,
  MessageSquare,
  BarChart3,
  User,
  Bell,
  LogOut,
  Moon,
  Sun,
  Sparkles,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useContext(AuthContext);
  const { unreadNotifications } = useContext(SocketContext);
  const [isLight, setIsLight] = useState(false);

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.toggle('light');
    setIsLight(!isLight);
  };

  const navItems = [
    { id: 'feed', name: 'Home Feed', icon: Rss },
    { id: 'chat', name: 'Messages', icon: MessageSquare },
    { id: 'analytics', name: 'Engagement', icon: BarChart3 },
    { id: 'notifications', name: 'Notifications', icon: Bell, badge: unreadNotifications },
    { id: 'profile', name: 'My Profile', icon: User },
  ];

  return (
    <div className="sidebar">
      <div>
        <div className="sidebar-logo">
          <Sparkles size={24} />
          <span>Aura</span>
        </div>

        <ul className="sidebar-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.id}
                className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={20} />
                <span style={{ flex: 1 }}>{item.name}</span>
                {item.badge > 0 && (
                  <span style={{
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: '0.75rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '99px',
                    fontWeight: '800'
                  }}>
                    {item.badge}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Theme Toggle Element */}
        <div
          className="sidebar-item"
          onClick={toggleTheme}
          style={{ cursor: 'pointer' }}
        >
          {isLight ? (
            <>
              <Moon size={20} />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun size={20} />
              <span>Light Mode</span>
            </>
          )}
        </div>

        {/* User profile footer block */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0.25rem',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.25rem'
          }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden' }}>
              <img
                src={user.profilePic ? `${MEDIA_URL}${user.profilePic}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.username}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
              title="Logout"
            >
              <LogOut size={18} className="sidebar-logout-icon" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
