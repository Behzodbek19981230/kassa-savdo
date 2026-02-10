import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { userService, User } from '../services/userService';
import { showSuccess, showError } from '../lib/toast';

export interface Kassir {
    id: number;
    username: string;
    full_name: string;
    email: string;
    phone_number: string;
    avatar: string | null;
}

interface AuthContextType {
    token: string | null;
    kassir: Kassir | null;
    user: User | null;
    login: (login: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    setAuthData: (token: string, kassir: Kassir | null) => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [kassir, setKassir] = useState<Kassir | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const logout = () => {
        authService.logout();
        setToken(null);
        setKassir(null);
        setUser(null);
        showSuccess('Muvaffaqiyatli chiqildi');
    };

    useEffect(() => {
        // localStorage dan token va kassir ma'lumotlarini yuklash
        const savedToken = localStorage.getItem('auth_token');
        const savedKassir = localStorage.getItem('kassir');

        if (savedToken) {
            setToken(savedToken);
            if (savedKassir) {
                setKassir(JSON.parse(savedKassir));
            }
            // Token mavjud bo'lsa, user ma'lumotlarini yuklash
            loadUserData().finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const loadUserData = async () => {
        try {
            const userData = await userService.getCurrentUser();

            // order_filial tekshiruvi
            if (!userData.order_filial) {
                // order_filial yo'q bo'lsa, logout qilish va login ga yo'naltirish
                logout();
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                showError('Sizda kassaga kirish huquqi yo\'q');
                return;
            }

            setUser(userData);

            // Kassir ma'lumotlarini user dan olish
            const kassirData: Kassir = {
                id: userData.id,
                username: userData.username,
                full_name: userData.full_name,
                email: userData.email,
                phone_number: userData.phone_number,
                avatar: userData.avatar,
            };
            setKassir(kassirData);
            localStorage.setItem('kassir', JSON.stringify(kassirData));
        } catch (error) {
            console.error('Failed to load user data:', error);
            // Faqat login sahifasida bo'lmasa error ko'rsatish
            if (window.location.pathname !== '/login') {
                showError('Foydalanuvchi ma\'lumotlarini yuklashda xatolik');
            }
        }
    };

    const setAuthData = (newToken: string, newKassir: Kassir | null) => {
        setToken(newToken);
        setKassir(newKassir);
    };

    const refreshUser = async () => {
        await loadUserData();
    };

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const response = await authService.login(username, password);

            // Access va refresh tokenlarni saqlash
            setToken(response.access);
            localStorage.setItem('auth_token', response.access);
            localStorage.setItem('refresh_token', response.refresh);

            // Login dan keyin user ma'lumotlarini yuklash va order_filial tekshiruvi
            const userData = await userService.getCurrentUser();

            // order_filial tekshiruvi - agar yo'q bo'lsa, login muvaffaqiyatsiz
            if (!userData.order_filial) {
                logout();
                showError('Sizda kassaga kirish huquqi yo\'q');
                return false;
            }

            // order_filial mavjud bo'lsa, user ma'lumotlarini set qilish
            setUser(userData);
            const kassirData: Kassir = {
                id: userData.id,
                username: userData.username,
                full_name: userData.full_name,
                email: userData.email,
                phone_number: userData.phone_number,
                avatar: userData.avatar,
            };
            setKassir(kassirData);
            localStorage.setItem('kassir', JSON.stringify(kassirData));

            showSuccess('Muvaffaqiyatli kirildi');
            return true;
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessage = error?.response?.data?.detail || error?.message || 'Login yoki parol noto\'g\'ri';
            showError(errorMessage);
            return false;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                kassir,
                user,
                login,
                logout,
                isAuthenticated: !!token,
                isLoading,
                setAuthData,
                refreshUser,
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
