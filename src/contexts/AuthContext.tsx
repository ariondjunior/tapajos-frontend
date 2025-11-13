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

const mockUsers: Array<{ email: string; password: string; name: string; role: string }> = [
  { email: 'felippe@tapajos.com', password: '123456', name: 'Felippe', role: 'user' },
  { email: 'admin@tapajos.com', password: '123456', name: 'Administrador', role: 'admin' },
];

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

      const found = mockUsers.find(u => u.email === email);
      if (found) {
        const u = { name: found.name, email: found.email, role: found.role };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
        setUser(u);
      } else {
        const u = { name: email || 'Felippe', email };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
        setUser(u);
      }
    } else {
      setUser({ name: 'Felippe' });
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
        const found = mockUsers.find(u => u.email === email);
        const u = found ? { name: found.name, email: found.email, role: found.role } : { name: email || 'Felippe', email };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
        setUser(u);
      } else {
        const u = { name: 'Felippe' };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
        setUser(u);
      }
      return;
    }

    const email = (payload.email || '').toLowerCase();
    const password = payload.password || '';

    const matched = mockUsers.find(u => u.email.toLowerCase() === email && u.password === password);

    if (!matched) {
      throw new Error('Credenciais inválidas');
    }

    const token = 'local:' + btoa(matched.email);
    const u = { name: matched.name, email: matched.email, role: matched.role };
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
