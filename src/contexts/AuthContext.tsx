import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Kassir {
  id: string;
  firstName: string;
  lastName: string;
  login: string;
}

interface AuthContextType {
  token: string | null;
  kassir: Kassir | null;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [kassir, setKassir] = useState<Kassir | null>(null);

  useEffect(() => {
    // localStorage dan token va kassir ma'lumotlarini yuklash
    const savedToken = localStorage.getItem('auth_token');
    const savedKassir = localStorage.getItem('kassir');
    
    if (savedToken && savedKassir) {
      setToken(savedToken);
      setKassir(JSON.parse(savedKassir));
    }
  }, []);

  const login = async (login: string, password: string): Promise<boolean> => {
    // Mock login - haqiqiy loyihada API ga so'rov yuboriladi
    // Bu yerda oddiy tekshirish qilamiz
    if (login && password) {
      // Mock kassir ma'lumotlari
      const mockKassir: Kassir = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        login: login
      };
      
      const mockToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setToken(mockToken);
      setKassir(mockKassir);
      
      // localStorage ga saqlash
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('kassir', JSON.stringify(mockKassir));
      
      return true;
    }
    return false;
  };

  const logout = () => {
    setToken(null);
    setKassir(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('kassir');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        kassir,
        login,
        logout,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
