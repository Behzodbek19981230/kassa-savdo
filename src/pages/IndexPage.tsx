import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Clock, DollarSign, LogOut, User, Building2, Plus } from 'lucide-react';
import { Dashboard } from '../components/Kassa/Dashboard';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';

export function IndexPage() {
	const navigate = useNavigate();
	const { kassir, user, logout } = useAuth();
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
		<>
			<main className='flex-1 container mx-auto py-8'>
				<Dashboard onNewSale={() => navigate('/order')} />
			</main>
		</>
	);
}
