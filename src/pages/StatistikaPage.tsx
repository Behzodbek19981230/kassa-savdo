import { BarChart2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { StatisticsCards } from '../components/Kassa/StatisticsCards';

export function StatistikaPage() {
	return (
		<>
			<main className='flex-1 container mx-auto py-8'>
				<div className='p-6 min-h-full'>
					<h2 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2'>
						<BarChart2 className='w-7 h-7 text-blue-600' />
						Statistika
					</h2>
					<StatisticsCards />
				</div>
			</main>
		</>
	);
}
