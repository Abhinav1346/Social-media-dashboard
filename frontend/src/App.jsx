import React, { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
import Profile from './components/Profile';
import Chat from './components/Chat';
import Analytics from './components/Analytics';
import Notifications from './components/Notifications';
import { Sparkles } from 'lucide-react';

function DashboardContent() {
  const { user, loading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('feed');
  const [targetProfileUsername, setTargetProfileUsername] = useState(null);

  const handleSelectUserProfile = (username) => {
    setTargetProfileUsername(username);
    setActiveTab('profile');
  };

  // 1. Loading Screen
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0b0c10',
        color: '#fff'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '50px',
          height: '50px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          color: '#0b0c10',
          marginBottom: '1rem',
          animation: 'pulseGlow 2s infinite'
        }}>
          <Sparkles size={24} />
        </div>
        <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Aligning cosmic details...</p>
      </div>
    );
  }

  // 2. Auth Page (Not logged in)
  if (!user) {
    return <Auth />;
  }

  // 3. Fully Authenticated Dashboard Layout
  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'profile') {
            setTargetProfileUsername(null); // Reset target when navigating away
          }
        }}
      />
      
      <main className="main-content">
        {activeTab === 'feed' && <Feed onSelectUser={handleSelectUserProfile} />}
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'notifications' && <Notifications onSelectUser={handleSelectUserProfile} />}
        {activeTab === 'profile' && <Profile targetUsername={targetProfileUsername} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <DashboardContent />
      </SocketProvider>
    </AuthProvider>
  );
}
