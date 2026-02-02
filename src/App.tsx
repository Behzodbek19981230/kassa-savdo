import { useEffect, useState } from 'react';
import { KassaPage } from './components/Kassa/KassaPage';
import { Dashboard } from './components/Kassa/Dashboard';
import { LoginPage } from './components/Auth/LoginPage';
import { useAuth } from './contexts/AuthContext';
import { Clock, DollarSign, LogOut, User } from 'lucide-react';

export function App() {
	const { isAuthenticated, kassir, logout } = useAuth();
	const [currentView, setCurrentView] = useState<'dashboard' | 'pos'>('dashboard');
	const [now, setNow] = useState(() => new Date());

	const USD_RATE = 12180;
	const dateTimeText = new Intl.DateTimeFormat('uz-UZ', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(now);
	const timeText = new Intl.DateTimeFormat('uz-UZ', {
		hour: '2-digit',
		minute: '2-digit',
	}).format(now);

	useEffect(() => {
		const id = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(id);
	}, []);

	// Agar token bo'lmasa, login page ko'rsatish
	if (!isAuthenticated) {
		return <LoginPage />;
	}

	if (currentView === 'pos') {
		return <KassaPage onBack={() => setCurrentView('dashboard')} />;
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col'>
			{/* Simple Dashboard Header */}
			<header className='bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white p-5 shadow-xl'>
				<div className='container mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3'>
					<h1 className='text-2xl font-bold tracking-tight'>Smart kassa</h1>
					<div className='flex items-center flex-wrap gap-2 sm:gap-4'>
						<div className='flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl backdrop-blur-sm'>
							<Clock className='w-4 h-4 text-white/90' />
							<span className='hidden md:inline text-sm font-semibold'>{dateTimeText}</span>
							<span className='md:hidden text-sm font-semibold'>{timeText}</span>
						</div>
						<div className='hidden md:flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl backdrop-blur-sm'>
							<DollarSign className='w-4 h-4 text-white/90' />
							<span className='text-sm font-semibold'>1 USD = {USD_RATE.toLocaleString()} UZS</span>
						</div>
						{/* Kassir Profili */}
						<div className='flex items-center space-x-3 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm'>
							<div className='w-10 h-10 bg-white/30 rounded-full flex items-center justify-center'>
								<User className='w-5 h-5' />
							</div>
							<div className='text-sm'>
								<div className='font-semibold'>
									{kassir?.firstName} {kassir?.lastName}
								</div>
								<div className='text-xs opacity-80'>{kassir?.login}</div>
							</div>
						</div>
						<button
							onClick={() => setCurrentView('pos')}
							className='bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]'
						>
							Kassaga kirish
						</button>
						<button
							onClick={logout}
							className='bg-white/20 hover:bg-white/30 px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2'
							title='Chiqish'
						>
							<LogOut className='w-5 h-5' />
						</button>
					</div>
				</div>
			</header>

			<main className='flex-1 container mx-auto py-8'>
				<Dashboard onNewSale={() => setCurrentView('pos')} />
			</main>
		</div>
	);
}
