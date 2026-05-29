import React, { createContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Check for cached token and user in localStorage
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Helper for REST requests
  const apiCall = async (endpoint, options = {}) => {
    const headers = options.headers || {};
    const authToken = token || localStorage.getItem('token');
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Backend did not respond. Please make sure the server is running on port 5000.');
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  // Register User
  const register = async (username, email, password) => {
    const res = await apiCall('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (res.success) {
      setUser(res.data);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
    }
    return res;
  };

  // Login User
  const login = async (email, password) => {
    const res = await apiCall('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.success) {
      setUser(res.data);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
    }
    return res;
  };

  // Logout User
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Update User Profile (handles File uploads for profile/banner)
  const updateProfile = async (bio, profilePicFile, bannerPicFile) => {
    const formData = new FormData();
    if (bio !== undefined) formData.append('bio', bio);
    if (profilePicFile) formData.append('profilePic', profilePicFile);
    if (bannerPicFile) formData.append('bannerPic', bannerPicFile);

    const authToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    if (data.success) {
      // Sync local state
      const updatedUser = {
        ...user,
        bio: data.data.bio,
        profilePic: data.data.profilePic,
        bannerPic: data.data.bannerPic,
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        register,
        login,
        logout,
        updateProfile,
        apiCall,
        API_URL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
