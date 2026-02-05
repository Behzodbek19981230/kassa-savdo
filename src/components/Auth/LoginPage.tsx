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
			setError("Login yoki parol noto'g'ri");
		}

		setLoading(false);
	};

	return (
		<div className='relative min-h-screen flex items-center justify-center p-4 overflow-hidden'>
			{/* Animated Gradient Background */}
			<div className='absolute inset-0 z-0 animate-gradient-move bg-gradient-to-br from-blue-700 via-indigo-600 to-cyan-500 opacity-90' />
			{/* Animated Blobs */}
			<div className='absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-cyan-400 opacity-30 rounded-full filter blur-3xl animate-blob1' />
			<div className='absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-blue-400 opacity-30 rounded-full filter blur-3xl animate-blob2' />
			{/* Glassmorphism Card with entrance animation */}
			<div className='w-full max-w-md z-10'>
				<div className='bg-white/30 backdrop-blur-2xl rounded-2xl shadow-2xl p-8 border-2 border-white/30 animate-fade-in'>
					{/* Logo/Header */}
					<div className='text-center mb-8'>
						<div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg animate-pop-in'>
							<LogIn className='w-8 h-8 text-white' />
						</div>
						<h1 className='text-3xl font-bold text-gray-900 mb-2 drop-shadow'>Kassa Moduli</h1>
						<p className='text-gray-700/80'>Tizimga kirish</p>
					</div>

					{/* Login Form */}
					<form onSubmit={handleSubmit} className='space-y-6'>
						{error && (
							<div className='bg-rose-50/80 border-2 border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm animate-shake'>
								{error}
							</div>
						)}

						<div className='space-y-2'>
							<Label htmlFor='login' className='text-gray-700 font-semibold'>
								Login
							</Label>
							<div className='relative'>
								<div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
									<User className='h-5 w-5 text-indigo-400' />
								</div>
								<Input
									id='login'
									type='text'
									placeholder='Loginni kiriting'
									value={login}
									onChange={(e) => setLogin(e.target.value)}
									className='pl-12 bg-white/70 focus:bg-white/90 transition'
									required
								/>
							</div>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='password' className='text-gray-700 font-semibold'>
								Parol
							</Label>
							<div className='relative'>
								<div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
									<Lock className='h-5 w-5 text-indigo-400' />
								</div>
								<Input
									id='password'
									type='password'
									placeholder='Parolni kiriting'
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className='pl-12 bg-white/70 focus:bg-white/90 transition'
									required
								/>
							</div>
						</div>

						<button
							type='submit'
							disabled={loading}
							className='w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 animate-pop-in'
						>
							{loading ? (
								<>
									<div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
									<span>Kirilmoqda...</span>
								</>
							) : (
								<>
									<LogIn className='w-5 h-5' />
									<span>Kirish</span>
								</>
							)}
						</button>
					</form>

					{/* Footer */}
					<div className='mt-6 text-center text-sm text-gray-600/80'>
						<p>Kassa tizimi v1.0</p>
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
                    animation: gradient-move 8s ease-in-out infinite;
                }
                @keyframes blob1 {
                    0%,100% { transform: scale(1) translate(0,0); }
                    33% { transform: scale(1.1) translate(30px, -20px); }
                    66% { transform: scale(0.95) translate(-20px, 20px); }
                }
                .animate-blob1 { animation: blob1 12s infinite linear; }
                @keyframes blob2 {
                    0%,100% { transform: scale(1) translate(0,0); }
                    33% { transform: scale(1.08) translate(-30px, 20px); }
                    66% { transform: scale(0.92) translate(20px, -20px); }
                }
                .animate-blob2 { animation: blob2 14s infinite linear; }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(40px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.9s cubic-bezier(.4,0,.2,1) both; }
                @keyframes pop-in {
                    0% { opacity: 0; transform: scale(0.7); }
                    80% { opacity: 1; transform: scale(1.05); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .animate-pop-in { animation: pop-in 0.7s cubic-bezier(.4,0,.2,1) both; }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-8px); }
                    40%, 80% { transform: translateX(8px); }
                }
                .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
            `}</style>
		</div>
	);
}
