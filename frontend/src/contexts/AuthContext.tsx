import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: 'Admin' | 'Teacher';
  is_active: boolean;
  account_status: 'Pending' | 'Approved' | 'Rejected';
}

export interface PanitiaItem {
  id: number;
  name: string;
  pivot?: { is_primary: boolean };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  activePanitia: PanitiaItem | null;
  panitiaList: PanitiaItem[];
  needsPanitiaSelection: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  selectPanitia: (panitiaId: number) => Promise<void>;
  switchPanitia: (panitiaId: number) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activePanitia, setActivePanitia] = useState<PanitiaItem | null>(null);
  const [panitiaList, setPanitiaList] = useState<PanitiaItem[]>([]);
  const [needsPanitiaSelection, setNeedsPanitiaSelection] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedPanitia = localStorage.getItem('activePanitia');
    const savedPanitiaList = localStorage.getItem('panitiaList');
    const savedNeedsSelection = localStorage.getItem('needsPanitiaSelection');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      if (savedPanitia) setActivePanitia(JSON.parse(savedPanitia));
      if (savedPanitiaList) setPanitiaList(JSON.parse(savedPanitiaList));
      if (savedNeedsSelection === 'true') setNeedsPanitiaSelection(true);
    }
    setLoading(false);
  }, []);

  const login = async (loginVal: string, password: string) => {
    const response = await api.post('/login', { login: loginVal, password });
    const { user, token, panitia_list, needs_panitia_selection, active_panitia } = response.data;
    setUser(user);
    setToken(token);
    setPanitiaList(panitia_list || []);
    setNeedsPanitiaSelection(needs_panitia_selection || false);

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('loginTime', new Date().toISOString());
    localStorage.setItem('panitiaList', JSON.stringify(panitia_list || []));
    localStorage.setItem('needsPanitiaSelection', String(needs_panitia_selection || false));

    if (active_panitia) {
      setActivePanitia(active_panitia);
      localStorage.setItem('activePanitia', JSON.stringify(active_panitia));
    }
  };

  const selectPanitia = async (panitiaId: number) => {
    const response = await api.post('/auth/select-panitia', { panitia_id: panitiaId });
    const { active_panitia } = response.data;
    setActivePanitia(active_panitia);
    setNeedsPanitiaSelection(false);
    localStorage.setItem('activePanitia', JSON.stringify(active_panitia));
    localStorage.setItem('needsPanitiaSelection', 'false');
  };

  const switchPanitia = async (panitiaId: number) => {
    const response = await api.post('/auth/switch-panitia', { panitia_id: panitiaId });
    const { active_panitia } = response.data;
    setActivePanitia(active_panitia);
    localStorage.setItem('activePanitia', JSON.stringify(active_panitia));
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setToken(null);
    setActivePanitia(null);
    setPanitiaList([]);
    setNeedsPanitiaSelection(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('activePanitia');
    localStorage.removeItem('panitiaList');
    localStorage.removeItem('needsPanitiaSelection');
  };

  return (
    <AuthContext.Provider value={{
      user, token, activePanitia, panitiaList, needsPanitiaSelection,
      login, logout, updateUser, selectPanitia, switchPanitia, loading,
    }}>
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
