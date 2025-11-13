import React, { createContext, useContext, useEffect, useState } from 'react';

type User = {
  id?: string;
  name?: string;
  role?: string;
  email?: string;
  [key: string]: any;
};

type Credentials = { email: string; password: string };

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: string | Credentials) => Promise<void>;
  logout: () => void;
};

const LOCAL_TOKEN_KEY = 'token';
const LOCAL_USER_KEY = 'user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(LOCAL_TOKEN_KEY);
    const storedUser = localStorage.getItem(LOCAL_USER_KEY);

    if (!token) {
      setIsLoading(false);
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser({ name: storedUser });
      }
      setIsLoading(false);
      return;
    }

    if (token.startsWith('local:')) {
      const email = (() => {
        try {
          return atob(token.split(':', 2)[1] || '');
        } catch {
          return '';
        }
      })();
      const u = { name: email || 'user', email };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
      setUser(u);
    } else {
      setUser({ name: token });
    }

    setIsLoading(false);
  }, []);

  const login = async (payload: string | Credentials) => {
    if (typeof payload === 'string') {
      const token = payload;
      localStorage.setItem(LOCAL_TOKEN_KEY, token);

      if (token.startsWith('local:')) {
        const email = (() => {
          try {
            return atob(token.split(':', 2)[1] || '');
          } catch {
            return '';
          }
        })();
        const u = { name: email || 'user', email };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
        setUser(u);
      } else {
        const u = { name: token };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
        setUser(u);
      }
      return;
    }

    const email = payload.email || 'user';
    const token = 'local:' + btoa(email);
    const u = { name: email, email };
    localStorage.setItem(LOCAL_TOKEN_KEY, token);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_TOKEN_KEY);
    localStorage.removeItem(LOCAL_USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
