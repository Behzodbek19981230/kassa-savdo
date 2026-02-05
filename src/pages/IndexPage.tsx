import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Clock, DollarSign, LogOut, User } from 'lucide-react';
import { Dashboard } from '../components/Kassa/Dashboard';
import { useAuth } from '../contexts/AuthContext';

export function IndexPage() {
	const navigate = useNavigate();
	const { kassir, logout } = useAuth();
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

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex flex-col'>
			<header className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white p-5 shadow-xl'>
				<div className='container mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3'>
					<button
						onClick={() => navigate('/')}
						className='text-2xl font-bold tracking-tight text-left hover:opacity-90 transition-opacity'
					>
						Bosh sahifa
					</button>
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
							onClick={() => navigate('/statistika')}
							className='flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-xl font-semibold transition-all duration-200'
							title='Statistika'
						>
							<BarChart2 className='w-5 h-5' />
							<span className='hidden sm:inline'>Statistika</span>
						</button>
						<button
							onClick={() => navigate('/order')}
							className='bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]'
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
				<Dashboard onNewSale={() => navigate('/order')} />
			</main>
		</div>
	);
}
