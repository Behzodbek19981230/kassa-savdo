import {
	Plus,
	ShoppingCart,
	RotateCcw,
	TrendingUp,
	TrendingDown,
	ArrowUpRight,
	ArrowDownRight,
} from 'lucide-react';

const cards = [
	{
		title: 'Savdo',
		icon: ShoppingCart,
		total: 0,
		paid: 0,
		balance: 0,
		trend: 'up' as const,
		bgGradient: 'from-blue-500 via-blue-400 to-cyan-400',
		iconBg: 'bg-blue-100',
		iconColor: 'text-blue-600',
	},
	{
		title: "Qaytib olish",
		icon: RotateCcw,
		total: 0,
		paid: 0,
		balance: 0,
		trend: 'down' as const,
		bgGradient: 'from-orange-500 via-amber-500 to-yellow-500',
		iconBg: 'bg-orange-100',
		iconColor: 'text-orange-600',
	},
	{
		title: 'Tushum',
		icon: TrendingUp,
		total: 0,
		paid: 0,
		balance: 0,
		trend: 'up' as const,
		bgGradient: 'from-emerald-500 via-green-500 to-teal-500',
		iconBg: 'bg-emerald-100',
		iconColor: 'text-emerald-600',
	},
	{
		title: 'Chiqim',
		icon: TrendingDown,
		total: 0,
		paid: 0,
		balance: 0,
		trend: 'down' as const,
		bgGradient: 'from-rose-500 via-red-500 to-orange-500',
		iconBg: 'bg-rose-100',
		iconColor: 'text-rose-600',
	},
];

export function StatisticsCards() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{cards.map((card) => {
				const Icon = card.icon;
				return (
					<div
						key={card.title}
						className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 border border-gray-100"
					>
						<div
							className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
						/>
						<div className="relative p-6 pb-4">
							<div className="flex items-start justify-between mb-4">
								<div className={`${card.iconBg} p-3 rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-300`}>
									<Icon className={`w-6 h-6 ${card.iconColor}`} />
								</div>
								{card.trend === 'up' ? (
									<div className="flex items-center space-x-1 bg-emerald-50 px-2 py-1 rounded-lg">
										<ArrowUpRight className="w-4 h-4 text-emerald-600" />
										<span className="text-xs font-semibold text-emerald-600">+12%</span>
									</div>
								) : (
									<div className="flex items-center space-x-1 bg-rose-50 px-2 py-1 rounded-lg">
										<ArrowDownRight className="w-4 h-4 text-rose-600" />
										<span className="text-xs font-semibold text-rose-600">-5%</span>
									</div>
								)}
							</div>
							<h3 className="text-lg font-bold text-gray-800 mb-1">{card.title}</h3>
							<p className="text-xs text-gray-500">Bugungi statistika</p>
						</div>
						<div className="relative px-6 pb-4 space-y-3">
							<div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
								<div className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-blue-500 rounded-full" />
									<span className="text-sm text-gray-600 font-medium">Naqd</span>
								</div>
								<span className="font-bold text-gray-900">{card.total.toLocaleString()} UZS</span>
							</div>
							<div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
								<div className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-emerald-500 rounded-full" />
									<span className="text-sm text-gray-600 font-medium">To'langan</span>
								</div>
								<span className="font-bold text-gray-900">{card.paid.toLocaleString()} UZS</span>
							</div>
							<div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 mt-4">
								<span className="font-bold text-gray-700">Jami</span>
								<span className="font-bold text-xl text-blue-700">{card.balance.toLocaleString()} UZS</span>
							</div>
						</div>
						<button
							type="button"
							className="relative w-full py-4 flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 border-t border-gray-200 text-sm font-bold text-gray-700 hover:text-blue-700 group-hover:shadow-inner"
						>
							<Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
							<span>Yangi kiritish</span>
						</button>
					</div>
				);
			})}
		</div>
	);
}
