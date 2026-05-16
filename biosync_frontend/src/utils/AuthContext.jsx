import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('biosync_auth') === 'true'
  );
  
  const [userRole, setUserRole] = useState(
    localStorage.getItem('biosync_role') || null
  );

  const login = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem('biosync_auth', 'true');
    localStorage.setItem('biosync_role', role);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('biosync_auth');
    localStorage.removeItem('biosync_role');
    localStorage.removeItem('biosync_department_user');
    localStorage.removeItem('biosync_parent_user');
    localStorage.removeItem('biosync_admin_user');
    // Clear any other potential stale keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('biosync_') && key !== 'biosync_theme') {
        localStorage.removeItem(key);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
