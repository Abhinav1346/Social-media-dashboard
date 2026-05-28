import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { SOCKET_URL } from '../config';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token, apiCall } = useContext(AuthContext);
  
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [typingUsers, setTypingUsers] = useState({});
  const [activeChatMessages, setActiveChatMessages] = useState([]);
  const [chatPartnerId, setChatPartnerId] = useState(null);

  // 1. Establish WebSocket Connection
  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {

      auth: { token },
    });

    setSocket(newSocket);

    // Initial load of historical notifications
    const loadNotifications = async () => {
      try {
        const res = await apiCall('/notifications');
        if (res.success) {
          setNotifications(res.data);
          setUnreadNotifications(res.data.filter(n => !n.read).length);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err.message);
      }
    };
    loadNotifications();

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  // 2. Setup Socket Listeners
  useEffect(() => {
    if (!socket) return;

    // Handle online users list
    socket.on('onlineUsersList', (users) => {
      setOnlineUsers(users);
    });

    // Handle single user online/offline updates
    socket.on('userStatusChange', ({ userId, status }) => {
      setOnlineUsers((prev) => {
        if (status === 'online') {
          return prev.includes(userId) ? prev : [...prev, userId];
        } else {
          return prev.filter((id) => id !== userId);
        }
      });
    });

    // Handle incoming private messages
    socket.on('receiveMessage', (message) => {
      // If the incoming message belongs to our current active chat Partner, display it
      if (chatPartnerId && message.sender._id === chatPartnerId) {
        setActiveChatMessages((prev) => [...prev, message]);
      }
    });

    // Handle local confirmation of sent messages
    socket.on('messageSent', (message) => {
      setActiveChatMessages((prev) => [...prev, message]);
    });

    // Handle typing status changes
    socket.on('typingStatus', ({ senderId, isTyping }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [senderId]: isTyping,
      }));
    });

    // Handle incoming push notifications (like/comment/follow)
    socket.on('receiveNotification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      
      // Skip incrementing unread if it is a quiet message notification and user is chatting with them
      if (notification.type === 'message' && chatPartnerId && notification.sender._id === chatPartnerId) {
        return;
      }
      
      setUnreadNotifications((prev) => prev + 1);
    });

    return () => {
      socket.off('onlineUsersList');
      socket.off('userStatusChange');
      socket.off('receiveMessage');
      socket.off('messageSent');
      socket.off('typingStatus');
      socket.off('receiveNotification');
    };
  }, [socket, chatPartnerId]);

  // 3. API & WebSockets Actions
  const sendMessage = (receiverId, content) => {
    if (socket && content && receiverId) {
      socket.emit('sendMessage', { receiverId, content });
    }
  };

  const emitTyping = (receiverId, isTyping) => {
    if (socket && receiverId) {
      socket.emit('typing', { receiverId, isTyping });
    }
  };

  const fetchChatHistory = async (partnerId) => {
    setChatPartnerId(partnerId);
    try {
      const res = await apiCall(`/chat/messages/${partnerId}`);
      if (res.success) {
        setActiveChatMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to load chat messages:', err.message);
    }
  };

  const markNotificationsRead = async () => {
    try {
      const res = await apiCall('/notifications/read', { method: 'PUT' });
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadNotifications(0);
      }
    } catch (err) {
      console.error('Failed to mark notifications read:', err.message);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        notifications,
        unreadNotifications,
        typingUsers,
        activeChatMessages,
        setActiveChatMessages,
        sendMessage,
        emitTyping,
        fetchChatHistory,
        markNotificationsRead,
        chatPartnerId,
        setChatPartnerId,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
export const useSocket = () => useContext(SocketContext);
