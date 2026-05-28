import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Send, Smile, User, AlertCircle } from 'lucide-react';
import { MEDIA_URL } from '../config';

export default function Chat() {
  const { user: currentUser, apiCall } = useContext(AuthContext);
  const {
    onlineUsers,
    typingUsers,
    activeChatMessages,
    sendMessage,
    emitTyping,
    fetchChatHistory,
    chatPartnerId,
    setChatPartnerId,
  } = useContext(SocketContext);

  const [chats, setChats] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [activePartner, setActivePartner] = useState(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load chat threads list
  const loadChatList = async () => {
    try {
      const res = await apiCall('/chat/list');
      if (res.success) {
        setChats(res.data);
      }
    } catch (err) {
      console.error('Failed to load chat list:', err.message);
    }
  };

  useEffect(() => {
    loadChatList();
    
    return () => {
      setChatPartnerId(null);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Sync active partner details on list reload
  useEffect(() => {
    if (chatPartnerId && chats.length > 0) {
      const current = chats.find(c => c.contact._id === chatPartnerId);
      if (current) {
        setActivePartner(current.contact);
      }
    }
  }, [chats, chatPartnerId]);

  // Auto Scroll Chat Window to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatMessages]);

  const handleSelectContact = async (contact) => {
    setActivePartner(contact);
    await fetchChatHistory(contact._id);
    // Reload chat list to clear unread states
    loadChatList();
  };

  const handleInputChange = (e) => {
    setTypedMessage(e.target.value);
    if (!activePartner) return;

    // Send typing notification
    emitTyping(activePartner._id, true);

    // Debounce resetting typing status
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(activePartner._id, false);
    }, 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activePartner) return;

    sendMessage(activePartner._id, typedMessage.trim());
    emitTyping(activePartner._id, false);
    setTypedMessage('');
    
    // Optimistically update chats list last message preview
    setChats((prev) => {
      const filtered = prev.filter((c) => c.contact._id !== activePartner._id);
      return [
        {
          contact: activePartner,
          lastMessage: typedMessage.trim(),
          lastSender: currentUser._id,
          unread: false,
          updatedAt: new Date().toISOString(),
        },
        ...filtered,
      ];
    });
  };

  return (
    <div className="chat-layout glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      
      {/* Sidebar - Contacts list */}
      <div className="chat-sidebar" style={{ padding: '1.5rem', borderRight: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Private Chats</h3>
        
        <div className="chat-contacts">
          {chats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <AlertCircle size={20} style={{ margin: '0 auto 0.5rem', color: 'var(--text-muted)' }} />
              <p>No active conversations yet.</p>
              <p style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>Interact on home feed posts to start chatting!</p>
            </div>
          ) : (
            chats.map((chat) => {
              const contact = chat.contact;
              const isOnline = onlineUsers.includes(contact._id);
              const isActive = activePartner?._id === contact._id;

              return (
                <div
                  key={contact._id}
                  className={`contact-card ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectContact(contact)}
                >
                  <div className="avatar-wrapper">
                    <img
                      src={contact.profilePic ? `${MEDIA_URL}${contact.profilePic}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${contact.username}`}
                      alt={contact.username}
                      className="avatar"
                    />
                    <span className={`status-dot ${isOnline ? 'online' : ''}`} />
                  </div>

                  <div className="contact-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="contact-name">{contact.username}</span>
                      {chat.unread && (
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          display: 'inline-block'
                        }} />
                      )}
                    </div>
                    <p className="contact-preview" style={{ fontWeight: chat.unread ? '700' : '400', color: chat.unread ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {chat.lastSender === currentUser._id ? 'You: ' : ''}
                      {chat.lastMessage}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Panel - Active chat thread */}
      <div className="chat-window" style={{ background: 'rgba(0, 0, 0, 0.05)' }}>
        {activePartner ? (
          <>
            {/* Header */}
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="avatar-wrapper" style={{ width: '42px', height: '42px' }}>
                  <img
                    src={activePartner.profilePic ? `${MEDIA_URL}${activePartner.profilePic}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${activePartner.username}`}
                    alt={activePartner.username}
                    className="avatar"
                  />
                  <span className={`status-dot ${onlineUsers.includes(activePartner._id) ? 'online' : ''}`} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>{activePartner.username}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {onlineUsers.includes(activePartner._id) ? 'Active Now' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Message History */}
            <div className="chat-messages" style={{ margin: '1rem 1.5rem', background: 'transparent' }}>
              {activeChatMessages.map((msg) => {
                const isSentByMe = msg.sender === currentUser._id || msg.sender._id === currentUser._id;
                return (
                  <div
                    key={msg._id}
                    className={`message-bubble ${isSentByMe ? 'sent' : 'received'}`}
                  >
                    <p>{msg.content}</p>
                    <div className="message-meta" style={{ color: isSentByMe ? 'rgba(11, 12, 16, 0.6)' : 'var(--text-muted)' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
              
              {/* Active Typing Indicator */}
              {typingUsers[activePartner._id] && (
                <div className="typing-indicator">
                  {activePartner.username} is typing...
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Send Area */}
            <form onSubmit={handleSend} className="chat-input-area" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Type a secure message..."
                value={typedMessage}
                onChange={handleInputChange}
                onBlur={() => emitTyping(activePartner._id, false)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="glowing-btn" style={{ padding: '0.75rem' }} disabled={!typedMessage.trim()}>
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <Smile size={48} style={{ strokeWidth: 1.5, color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h4 style={{ fontWeight: '600' }}>Select a conversation</h4>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Open a contact from the panel to start real-time messaging.</p>
          </div>
        )}
      </div>

    </div>
  );
}
