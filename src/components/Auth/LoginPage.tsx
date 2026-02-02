import { useState } from 'react';
import { LogIn, User, Lock } from 'lucide-react';
import { Input, Label } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login: handleLogin } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!login || !password) {
            setError('Login va parolni kiriting');
            setLoading(false);
            return;
        }

        const success = await handleLogin(login, password);

        if (!success) {
            setError('Login yoki parol noto\'g\'ri');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-white/20">
                    {/* Logo/Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                            <LogIn className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kassa Moduli</h1>
                        <p className="text-gray-600">Tizimga kirish</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="login" className="text-gray-700 font-semibold">
                                Login
                            </Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-indigo-400" />
                                </div>
                                <Input
                                    id="login"
                                    type="text"
                                    placeholder="Loginni kiriting"
                                    value={login}
                                    onChange={(e) => setLogin(e.target.value)}
                                    className="pl-12"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-700 font-semibold">
                                Parol
                            </Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-indigo-400" />
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Parolni kiriting"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-12"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Kirilmoqda...</span>
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    <span>Kirish</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>Kassa tizimi v1.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
