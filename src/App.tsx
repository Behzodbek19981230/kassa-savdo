import { useState } from 'react';
import { KassaPage } from './components/Kassa/KassaPage';
import { Dashboard } from './components/Kassa/Dashboard';
import { LoginPage } from './components/Auth/LoginPage';
import { useAuth } from './contexts/AuthContext';
import { User, LogOut } from 'lucide-react';

export function App() {
    const { isAuthenticated, kassir, logout } = useAuth();
    const [currentView, setCurrentView] = useState<'dashboard' | 'pos'>(
        'dashboard'
    );

    // Agar token bo'lmasa, login page ko'rsatish
    if (!isAuthenticated) {
        return <LoginPage />;
    }

    if (currentView === 'pos') {
        return <KassaPage onBack={() => setCurrentView('dashboard')} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
            {/* Simple Dashboard Header */}
            <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-5 shadow-xl">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-tight">Kassa Moduli</h1>
                    <div className="flex items-center space-x-4">
                        {/* Kassir Profili */}
                        <div className="flex items-center space-x-3 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm">
                            <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="text-sm">
                                <div className="font-semibold">
                                    {kassir?.firstName} {kassir?.lastName}
                                </div>
                                <div className="text-xs opacity-80">{kassir?.login}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setCurrentView('pos')}
                            className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]">
                            Kassaga kirish
                        </button>
                        <button
                            onClick={logout}
                            className="bg-white/20 hover:bg-white/30 px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2"
                            title="Chiqish">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto py-8">
                <Dashboard onNewSale={() => setCurrentView('pos')} />
            </main>
        </div>);

}