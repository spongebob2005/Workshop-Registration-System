import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'student';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, role?: 'admin' | 'student') => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('authToken');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        role: 'student' as const,
      };

      const response: any = await api.post('/users', newUser);

      if (response?.success && response.user) {
        return await login(email, password, 'student');
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const login = async (email: string, password: string, role: 'admin' | 'student' = 'student'): Promise<boolean> => {
    try {
      const response: any = await api.post('/login', { email, password, role });
      
      if (response?.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('authToken', response.token);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};