import { useState } from 'react';
import { LogIn, User, Lock } from 'lucide-react';
import { Input, Label } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';

interface LoginPageProps {
	onSuccess?: () => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
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
			setError("Login yoki parol noto'g'ri");
		} else {
			onSuccess?.();
		}

		setLoading(false);
	};

	return (
		<div className='relative min-h-screen flex items-center justify-center p-4 overflow-hidden'>
			{/* Animated Gradient Background - More Blue */}
			<div className='absolute inset-0 z-0 animate-gradient-move bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 opacity-95' />
			{/* Animated Blobs - Blue tones */}
			<div className='absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500 opacity-25 rounded-full filter blur-3xl animate-blob1' />
			<div className='absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-500 opacity-25 rounded-full filter blur-3xl animate-blob2' />
			<div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-400 opacity-20 rounded-full filter blur-3xl animate-blob3' />
			
			{/* Glassmorphism Card with entrance animation */}
			<div className='w-full max-w-md z-10'>
				<div className='bg-white/40 backdrop-blur-3xl rounded-3xl shadow-2xl p-10 border border-white/50 animate-fade-in'>
					{/* Logo/Header */}
					<div className='text-center mb-10'>
						<div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl mb-6 shadow-xl animate-pop-in ring-4 ring-blue-200/50'>
							<LogIn className='w-10 h-10 text-white' />
						</div>
						<h1 className='text-4xl font-bold text-gray-900 mb-3 drop-shadow-lg'>Kassa Moduli</h1>
						<p className='text-gray-700/90 text-lg font-medium'>Tizimga kirish</p>
					</div>

					{/* Login Form */}
					<form onSubmit={handleSubmit} className='space-y-6'>
						{error && (
							<div className='bg-red-50/90 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-shake shadow-md'>
								{error}
							</div>
						)}

						<div className='space-y-3'>
							<Label htmlFor='login' className='text-gray-800 font-semibold text-base'>
								Login
							</Label>
							<div className='relative'>
								<div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
									<User className='h-5 w-5 text-blue-500' />
								</div>
								<Input
									id='login'
									type='text'
									placeholder='Loginni kiriting'
									value={login}
									onChange={(e) => setLogin(e.target.value)}
									className='pl-12 bg-white/80 focus:bg-white focus:ring-2 focus:ring-blue-400 border-gray-200 h-12 text-base transition-all'
									required
								/>
							</div>
						</div>

						<div className='space-y-3'>
							<Label htmlFor='password' className='text-gray-800 font-semibold text-base'>
								Parol
							</Label>
							<div className='relative'>
								<div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
									<Lock className='h-5 w-5 text-blue-500' />
								</div>
								<Input
									id='password'
									type='password'
									placeholder='Parolni kiriting'
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className='pl-12 bg-white/80 focus:bg-white focus:ring-2 focus:ring-blue-400 border-gray-200 h-12 text-base transition-all'
									required
								/>
							</div>
						</div>

						<button
							type='submit'
							disabled={loading}
							className='w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3 animate-pop-in ring-2 ring-blue-300/50'
						>
							{loading ? (
								<>
									<div className='w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin' />
									<span>Kirilmoqda...</span>
								</>
							) : (
								<>
									<LogIn className='w-6 h-6' />
									<span>Kirish</span>
								</>
							)}
						</button>
					</form>

					{/* Footer */}
					<div className='mt-8 text-center'>
						<p className='text-gray-600/90 text-sm font-medium'>Kassa tizimi v1.0</p>
					</div>
				</div>
			</div>
			{/* Custom Animations */}
			<style>{`
                @keyframes gradient-move {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient-move {
                    background-size: 200% 200%;
                    animation: gradient-move 10s ease-in-out infinite;
                }
                @keyframes blob1 {
                    0%,100% { transform: scale(1) translate(0,0); }
                    33% { transform: scale(1.15) translate(40px, -30px); }
                    66% { transform: scale(0.9) translate(-30px, 30px); }
                }
                .animate-blob1 { animation: blob1 15s infinite ease-in-out; }
                @keyframes blob2 {
                    0%,100% { transform: scale(1) translate(0,0); }
                    33% { transform: scale(1.12) translate(-40px, 30px); }
                    66% { transform: scale(0.88) translate(30px, -30px); }
                }
                .animate-blob2 { animation: blob2 18s infinite ease-in-out; }
                @keyframes blob3 {
                    0%,100% { transform: scale(1) translate(-50%, -50%); }
                    33% { transform: scale(1.1) translate(-45%, -55%); }
                    66% { transform: scale(0.95) translate(-55%, -45%); }
                }
                .animate-blob3 { animation: blob3 20s infinite ease-in-out; }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(40px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in { animation: fade-in 1s cubic-bezier(.4,0,.2,1) both; }
                @keyframes pop-in {
                    0% { opacity: 0; transform: scale(0.6); }
                    80% { opacity: 1; transform: scale(1.08); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .animate-pop-in { animation: pop-in 0.8s cubic-bezier(.4,0,.2,1) both; }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-10px); }
                    40%, 80% { transform: translateX(10px); }
                }
                .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
            `}</style>
		</div>
	);
}
