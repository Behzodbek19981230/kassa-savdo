import { useState, useMemo } from 'react';
import {
	Plus,
	ShoppingCart,
	RotateCcw,
	TrendingUp,
	TrendingDown,
	ArrowUpRight,
	ArrowDownRight,
	ChevronDown,
	ChevronUp,
	BarChart,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { reportsService } from '../../services/reportsService';
import { FinancialSummary } from './FinancialSummary';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { useNavigate } from 'react-router-dom';
import { formatMoney } from '../../lib/utils';

const baseCards = [
	{
		key: 'sales',
		title: 'Savdo',
		icon: ShoppingCart,
		trend: 'up' as const,
		bgGradient: 'from-blue-500 via-blue-400 to-cyan-400',
		iconBg: 'bg-blue-100',
		iconColor: 'text-blue-600',
		href: '/order',
	},
	{
		key: 'returns',
		title: 'Qaytib olish',
		icon: RotateCcw,
		trend: 'down' as const,
		bgGradient: 'from-orange-500 via-amber-500 to-yellow-500',
		iconBg: 'bg-orange-100',
		iconColor: 'text-orange-600',
		href: '/tovar-qaytarish',
	},
	{
		key: 'income',
		title: 'Tushum',
		icon: TrendingUp,
		trend: 'up' as const,
		bgGradient: 'from-emerald-500 via-green-500 to-teal-500',
		iconBg: 'bg-emerald-100',
		iconColor: 'text-emerald-600',
		href: '/qarzlar',
	},
	{
		key: 'expense',
		title: 'Chiqim',
		icon: TrendingDown,
		trend: 'down' as const,
		bgGradient: 'from-rose-500 via-red-500 to-orange-500',
		iconBg: 'bg-rose-100',
		iconColor: 'text-rose-600',
		href: '/xarajatlar',
	},
];

function safeNum(v: any) {
	const n = Number(v);
	return Number.isFinite(n) ? n : 0;
}

export function StatisticsCards() {
	const { user } = useAuth();
	const now = new Date();
	const [year, setYear] = useState<number>(now.getFullYear());
	const [month, setMonth] = useState<number | null>(now.getMonth() + 1);
	const [showFullSummary, setShowFullSummary] = useState(false);
	const navigate = useNavigate();
	const filialId = user?.order_filial ?? null;

	const { data, isLoading } = useQuery({
		queryKey: ['filial-statistics', filialId, year, month],
		queryFn: () => {
			if (!filialId) return Promise.resolve(null);
			return reportsService.getFilialStatistics({ filial_id: filialId, year, month: month ?? undefined });
		},
		enabled: !!filialId,
		staleTime: 60_000,
	});

	// Map API response into card values. API may have nested structure; we safely read expected keys.
	const cards = useMemo(() => {
		// Response example contains keys: orders, vozvrat, expenses, debt_repayments, summary
		const orders = data?.orders ?? {};
		const vozvrat = data?.vozvrat ?? {};
		const expenses = data?.expenses ?? {};
		const summary = data?.summary ?? {};

		return baseCards.map((c) => {
			let total = 0;
			let paid = 0;
			let balance = 0;
			let currency = 'UZS';

			if (c.key === 'sales') {
				total = safeNum(orders.all_product_summa ?? orders.total_paid_usd ?? 0);
				paid = safeNum(orders.total_paid_usd ?? orders.payments?.dollar ?? 0);
				balance = safeNum(orders.total_debt_client ?? total - paid);
				// if total looks like USD (contains decimal and small), prefer USD
				currency = orders.total_paid_usd ? 'USD' : 'UZS';
			}

			if (c.key === 'returns') {
				total = safeNum(vozvrat.total_refunded_usd ?? 0);
				paid = safeNum(vozvrat.payments?.dollar ?? 0);
				balance = 0;
				currency = vozvrat.total_refunded_usd ? 'USD' : 'UZS';
			}

			if (c.key === 'income') {
				total = safeNum(summary.net_revenue_usd ?? orders.profit_usd ?? 0);
				paid = safeNum(summary.net_cashflow_usd ?? 0);
				balance = total - paid;
				currency = summary.net_revenue_usd ? 'USD' : 'UZS';
			}

			if (c.key === 'expense') {
				total = safeNum(expenses.total_usd ?? 0);
				paid = safeNum(expenses.payments?.dollar ?? 0);
				balance = total;
				currency = expenses.total_usd ? 'USD' : 'UZS';
			}

			return { ...c, total, paid, balance, currency };
		});
	}, [data]);

	const years = useMemo(() => {
		const y = now.getFullYear();
		return [y, y - 1, y - 2];
	}, []);

	const months = [
		{ id: 0, label: 'Barcha yil' },
		{ id: 1, label: 'Yan' },
		{ id: 2, label: 'Fev' },
		{ id: 3, label: 'Mar' },
		{ id: 4, label: 'Apr' },
		{ id: 5, label: 'May' },
		{ id: 6, label: 'Iyun' },
		{ id: 7, label: 'Iyul' },
		{ id: 8, label: 'Avg' },
		{ id: 9, label: 'Sen' },
		{ id: 10, label: 'Okt' },
		{ id: 11, label: 'Noy' },
		{ id: 12, label: 'Dek' },
	];

	// Transform API data to match FinancialSummary interface
	const transformedData = useMemo(() => {
		if (!data || !filialId) return null;

		const currentMonth = month || now.getMonth() + 1;
		const daysInMonth = new Date(year, currentMonth, 0).getDate();

		return {
			filters: {
				filial_id: filialId,
				year: year,
				month: currentMonth,
				start_date: data.filters?.start_date || `${year}-${String(currentMonth).padStart(2, '0')}-01`,
				end_date:
					data.filters?.end_date ||
					`${year}-${String(currentMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`,
			},
			summary: {
				net_revenue_usd: data.summary?.net_revenue_usd || '0.00',
				net_cashflow_usd: data.summary?.net_cashflow_usd || '0.00',
			},
			orders: {
				count: data.orders?.count || 0,
				all_product_summa: data.orders?.all_product_summa || '0.00',
				profit_usd: data.orders?.profit_usd || '0.00',
				total_paid_usd: data.orders?.total_paid_usd || '0.00',
				total_debt_client: data.orders?.total_debt_client || '0.00',
				total_debt_today_client: data.orders?.total_debt_today_client || '0.00',
				payments: {
					dollar: data.orders?.payments?.dollar || '0.00',
					cash: data.orders?.payments?.cash || '0.00',
					click: data.orders?.payments?.click || '0.00',
					terminal: data.orders?.payments?.terminal || '0.00',
					transfer: data.orders?.payments?.transfer || '0.00',
				},
				discount: data.orders?.discount || '0.00',
				change: {
					usd: data.orders?.change?.usd || '0.00',
					uzs: data.orders?.change?.uzs || '0.00',
				},
			},
			vozvrat: {
				count: data.vozvrat?.count || 0,
				total_refunded_usd: data.vozvrat?.total_refunded_usd || '0.00',
				payments: {
					dollar: data.vozvrat?.payments?.dollar || '0.00',
					cash: data.vozvrat?.payments?.cash || '0.00',
					click: data.vozvrat?.payments?.click || '0.00',
					terminal: data.vozvrat?.payments?.terminal || '0.00',
					transfer: data.vozvrat?.payments?.transfer || '0.00',
				},
				discount: data.vozvrat?.discount || '0.00',
			},
			expenses: {
				count: data.expenses?.count || 0,
				total_usd: data.expenses?.total_usd || '0.00',
				payments: {
					dollar: data.expenses?.payments?.dollar || '0.00',
					cash: data.expenses?.payments?.cash || '0.00',
					click: data.expenses?.payments?.click || '0.00',
					terminal: data.expenses?.payments?.terminal || '0.00',
					transfer: data.expenses?.payments?.transfer || '0.00',
				},
			},
			debt_repayments: {
				count: data.debt_repayments?.count || 0,
				total_paid_usd: data.debt_repayments?.total_paid_usd || '0.00',
				payments: {
					dollar: data.debt_repayments?.payments?.dollar || '0.00',
					cash: data.debt_repayments?.payments?.cash || '0.00',
					click: data.debt_repayments?.payments?.click || '0.00',
					terminal: data.debt_repayments?.payments?.terminal || '0.00',
					transfer: data.debt_repayments?.payments?.transfer || '0.00',
				},
				discount: data.debt_repayments?.discount || '0.00',
				change: {
					usd: data.debt_repayments?.change?.usd || '0.00',
					uzs: data.debt_repayments?.change?.uzs || '0.00',
				},
			},
		};
	}, [data, filialId, year, month, now]);

	return (
		<div className='space-y-6'>
			<div className='bg-white rounded-2xl shadow p-4'>
				<div className='flex items-center justify-between mb-4'>
					<h2 className='text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2'>
						<BarChart className='w-7 h-7 text-blue-600' />
						Statistika
					</h2>
					<div className='flex items-center gap-3'>
						<Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
							<SelectTrigger className='w-[120px] h-10'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{years.map((y) => (
									<SelectItem key={y} value={String(y)}>
										{y}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={month ? String(month) : '0'}
							onValueChange={(v) => setMonth(Number(v) === 0 ? null : Number(v))}
						>
							<SelectTrigger className='w-[150px] h-10'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{months.map((m) => (
									<SelectItem key={m.id} value={String(m.id)}>
										{m.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{isLoading ? (
					<div className='flex items-center justify-center py-8'>
						<div className='animate-spin w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full' />
					</div>
				) : (
					<>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
							{cards.map((card) => {
								const Icon = card.icon;
								return (
									<div
										key={card.key}
										className='group relative bg-white rounded-3xl shadow transition-all duration-200 overflow-hidden border border-gray-100'
									>
										<div
											className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-5`}
										/>
										<div className='relative p-6 pb-4'>
											<div className='flex items-start justify-between mb-4'>
												<div className={`${card.iconBg} p-3 rounded-2xl shadow-md`}>
													<Icon className={`w-6 h-6 ${card.iconColor}`} />
												</div>
												{card.trend === 'up' ? (
													<div className='flex items-center space-x-1 bg-emerald-50 px-2 py-1 rounded-lg'>
														<ArrowUpRight className='w-4 h-4 text-emerald-600' />
														<span className='text-xs font-semibold text-emerald-600'>
															+{Math.round(Math.random() * 10 + 5)}%
														</span>
													</div>
												) : (
													<div className='flex items-center space-x-1 bg-rose-50 px-2 py-1 rounded-lg'>
														<ArrowDownRight className='w-4 h-4 text-rose-600' />
														<span className='text-xs font-semibold text-rose-600'>
															-{Math.round(Math.random() * 5 + 1)}%
														</span>
													</div>
												)}
											</div>
											<h3 className='text-lg font-bold text-gray-800 mb-1'>{card.title}</h3>
											<p className='text-xs text-gray-500'>Tanlangan davr statistika</p>
										</div>
										<div className='relative px-6 pb-4 space-y-3'>
											<div className='flex justify-between items-center p-3 bg-gray-50 rounded-xl'>
												<div className='flex items-center space-x-2'>
													<div className='w-2 h-2 bg-blue-500 rounded-full' />
													<span className='text-sm text-gray-600 font-medium'>Naqd</span>
												</div>
												<span className='font-bold text-gray-900'>
													{formatMoney(card.total)} {card.currency}
												</span>
											</div>
											<div className='flex justify-between items-center p-3 bg-gray-50 rounded-xl'>
												<div className='flex items-center space-x-2'>
													<div className='w-2 h-2 bg-emerald-500 rounded-full' />
													<span className='text-sm text-gray-600 font-medium'>To'langan</span>
												</div>
												<span className='font-bold text-gray-900'>
													{formatMoney(card.paid)} {card.currency}
												</span>
											</div>
											<div className='flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 mt-4'>
												<span className='font-bold text-gray-700'>Jami</span>
												<span className='font-bold text-xl text-blue-700'>
													{formatMoney(card.balance)} {card.currency}
												</span>
											</div>
										</div>
										<button
											type='button'
											className='relative w-full py-4 flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 border-t border-gray-200 text-sm font-bold text-gray-700 hover:text-blue-700'
											onClick={() => navigate(card.href)}
										>
											<Plus size={18} />
											<span>Yangi kiritish</span>
										</button>
									</div>
								);
							})}
						</div>

						{/* Toggle button for full summary */}
						<div className='mt-6 flex justify-center'>
							<button
								onClick={() => setShowFullSummary(!showFullSummary)}
								className='flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold'
							>
								{showFullSummary ? (
									<>
										<ChevronUp size={20} />
										<span>Batafsil ma'lumotlarni yashirish</span>
									</>
								) : (
									<>
										<ChevronDown size={20} />
										<span>Batafsil ma'lumotlarni ko'rish</span>
									</>
								)}
							</button>
						</div>
					</>
				)}
			</div>

			{/* Full Financial Summary */}
			{showFullSummary && transformedData && !isLoading && (
				<div className='mt-6'>
					<FinancialSummary data={transformedData} />
				</div>
			)}
		</div>
	);
}
