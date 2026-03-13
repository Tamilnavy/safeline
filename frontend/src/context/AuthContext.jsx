import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getSubdomain = useCallback(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    // Check if it's a subdomain on localhost
    if (parts.length > 1 && parts[parts.length - 1] === 'localhost') {
      return parts[0];
    }
    
    return 'default';
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const subdomain = getSubdomain();

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        localStorage.setItem('tenantDomain', parsedUser.tenantDomain || 'default');
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem('user');
      }
    } else {
      localStorage.setItem('tenantDomain', subdomain);
    }
    
    setLoading(false);
  }, [getSubdomain]);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    localStorage.setItem('tenantDomain', userData.tenantDomain || 'default');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.setItem('tenantDomain', getSubdomain());
    localStorage.removeItem('trackingToken');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
