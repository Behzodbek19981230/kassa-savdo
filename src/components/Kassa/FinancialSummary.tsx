import { ShoppingCart, RotateCcw, TrendingDown, DollarSign, Calendar, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface FinancialSummaryData {
    filters: {
        filial_id: number;
        year: number;
        month: number;
        start_date: string;
        end_date: string;
    };
    summary: {
        net_revenue_usd: string;
        net_cashflow_usd: string;
    };
    orders: {
        count: number;
        all_product_summa: string;
        profit_usd: string;
        total_paid_usd: string;
        total_debt_client: string;
        total_debt_today_client: string;
        payments: {
            dollar: string;
            cash: string;
            click: string;
            terminal: string;
            transfer: string;
        };
        discount: string;
        change: {
            usd: string;
            uzs: string;
        };
    };
    vozvrat: {
        count: number;
        total_refunded_usd: string;
        payments: {
            dollar: string;
            cash: string;
            click: string;
            terminal: string;
            transfer: string;
        };
        discount: string;
    };
    expenses: {
        count: number;
        total_usd: string;
        payments: {
            dollar: string;
            cash: string;
            click: string;
            terminal: string;
            transfer: string;
        };
    };
    debt_repayments: {
        count: number;
        total_paid_usd: string;
        payments: {
            dollar: string;
            cash: string;
            click: string;
            terminal: string;
            transfer: string;
        };
        discount: string;
        change: {
            usd: string;
            uzs: string;
        };
    };
}

interface FinancialSummaryProps {
    data: FinancialSummaryData;
}

function formatNumber(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isNegative(value: string | number): boolean {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num < 0;
}

function PaymentBreakdown({ payments, title }: { payments: FinancialSummaryData['orders']['payments']; title?: string }) {
    return (
        <div className='space-y-2'>
            {title && <h4 className='text-sm font-semibold text-gray-700 mb-2'>{title}</h4>}
            <div className='grid grid-cols-2 sm:grid-cols-5 gap-2'>
                <div className='bg-blue-50 p-2 rounded-lg border border-blue-200'>
                    <div className='text-xs text-gray-600 mb-1'>Dollar</div>
                    <div className='text-sm font-bold text-blue-700'>{formatNumber(payments.dollar)} $</div>
                </div>
                <div className='bg-green-50 p-2 rounded-lg border border-green-200'>
                    <div className='text-xs text-gray-600 mb-1'>Naqd</div>
                    <div className='text-sm font-bold text-green-700'>{formatNumber(payments.cash)}</div>
                </div>
                <div className='bg-purple-50 p-2 rounded-lg border border-purple-200'>
                    <div className='text-xs text-gray-600 mb-1'>Click</div>
                    <div className='text-sm font-bold text-purple-700'>{formatNumber(payments.click)}</div>
                </div>
                <div className='bg-orange-50 p-2 rounded-lg border border-orange-200'>
                    <div className='text-xs text-gray-600 mb-1'>Terminal</div>
                    <div className='text-sm font-bold text-orange-700'>{formatNumber(payments.terminal)}</div>
                </div>
                <div className='bg-cyan-50 p-2 rounded-lg border border-cyan-200'>
                    <div className='text-xs text-gray-600 mb-1'>Transfer</div>
                    <div className='text-sm font-bold text-cyan-700'>{formatNumber(payments.transfer)}</div>
                </div>
            </div>
        </div>
    );
}

export function FinancialSummary({ data }: FinancialSummaryProps) {
    const months = [
        'Yanvar',
        'Fevral',
        'Mart',
        'Aprel',
        'May',
        'Iyun',
        'Iyul',
        'Avgust',
        'Sentyabr',
        'Oktyabr',
        'Noyabr',
        'Dekabr',
    ];
    const { user } = useAuth();
    return (
        <div className='p-3 sm:p-6 min-h-full space-y-6'>
            {/* Filters Section */}
            <div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100'>
                <div className='flex items-center gap-2 mb-4'>
                    <Calendar className='w-5 h-5 text-blue-600' />
                    <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>Filter ma'lumotlari</h2>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <div className='bg-blue-50 p-4 rounded-xl border border-blue-200'>
                        <div className='text-xs text-gray-600 mb-1'>Filial</div>
                        <div className='text-lg font-bold text-blue-700'>{user?.order_filial_detail?.name}</div>
                    </div>
                    <div className='bg-green-50 p-4 rounded-xl border border-green-200'>
                        <div className='text-xs text-gray-600 mb-1'>Yil</div>
                        <div className='text-lg font-bold text-green-700'>{data.filters.year}</div>
                    </div>
                    <div className='bg-purple-50 p-4 rounded-xl border border-purple-200'>
                        <div className='text-xs text-gray-600 mb-1'>Oy</div>
                        <div className='text-lg font-bold text-purple-700'>
                            {months[data.filters.month - 1] || data.filters.month}
                        </div>
                    </div>
                    <div className='bg-orange-50 p-4 rounded-xl border border-orange-200'>
                        <div className='text-xs text-gray-600 mb-1'>Davr</div>
                        <div className='text-sm font-bold text-orange-700'>
                            {format(new Date(data.filters.start_date), 'dd.MM.yyyy')} -{' '}
                            {format(new Date(data.filters.end_date), 'dd.MM.yyyy')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Section */}
            <div
                className={`rounded-2xl shadow-xl p-4 sm:p-6 text-white ${isNegative(data.summary.net_revenue_usd) || isNegative(data.summary.net_cashflow_usd)
                    ? 'bg-gradient-to-br from-red-500 via-rose-500 to-pink-500'
                    : 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500'
                    }`}
            >
                <div className='flex items-center gap-2 mb-4'>
                    <TrendingDown className='w-5 h-5' />
                    <h2 className='text-xl sm:text-2xl font-bold'>Umumiy statistika</h2>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/30'>
                        <div className='text-sm opacity-90 mb-2'>Sof daromad (USD)</div>
                        <div
                            className={`text-2xl sm:text-3xl font-bold ${isNegative(data.summary.net_revenue_usd) ? 'text-red-100' : ''
                                }`}
                        >
                            {isNegative(data.summary.net_revenue_usd) ? '-' : ''}
                            {formatNumber(Math.abs(parseFloat(data.summary.net_revenue_usd)))} $
                        </div>
                    </div>
                    <div className='bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/30'>
                        <div className='text-sm opacity-90 mb-2'>Sof pul oqimi (USD)</div>
                        <div
                            className={`text-2xl sm:text-3xl font-bold ${isNegative(data.summary.net_cashflow_usd) ? 'text-red-100' : ''
                                }`}
                        >
                            {isNegative(data.summary.net_cashflow_usd) ? '-' : ''}
                            {formatNumber(Math.abs(parseFloat(data.summary.net_cashflow_usd)))} $
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Section */}
            <div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100'>
                <div className='flex items-center gap-2 mb-4'>
                    <ShoppingCart className='w-5 h-5 text-blue-600' />
                    <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>Savdo ma'lumotlari</h2>
                </div>
                <div className='space-y-4'>
                    <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4'>
                        <div className='bg-blue-50 p-4 rounded-xl border border-blue-200'>
                            <div className='text-xs text-gray-600 mb-1'>Savdolar soni</div>
                            <div className='text-xl font-bold text-blue-700'>{data.orders.count}</div>
                        </div>
                        <div className='bg-green-50 p-4 rounded-xl border border-green-200'>
                            <div className='text-xs text-gray-600 mb-1'>Jami mahsulot summa</div>
                            <div className='text-lg font-bold text-green-700'>{formatNumber(data.orders.all_product_summa)}</div>
                        </div>
                        <div className='bg-emerald-50 p-4 rounded-xl border border-emerald-200'>
                            <div className='text-xs text-gray-600 mb-1'>Foyda (USD)</div>
                            <div className='text-lg font-bold text-emerald-700'>{formatNumber(data.orders.profit_usd)} $</div>
                        </div>
                        <div className='bg-purple-50 p-4 rounded-xl border border-purple-200'>
                            <div className='text-xs text-gray-600 mb-1'>To'langan (USD)</div>
                            <div className='text-lg font-bold text-purple-700'>{formatNumber(data.orders.total_paid_usd)} $</div>
                        </div>
                        <div className='bg-red-50 p-4 rounded-xl border border-red-200'>
                            <div className='text-xs text-gray-600 mb-1'>Jami qarz mijoz</div>
                            <div className='text-lg font-bold text-red-700'>{formatNumber(data.orders.total_debt_client)}</div>
                        </div>
                        <div className='bg-orange-50 p-4 rounded-xl border border-orange-200'>
                            <div className='text-xs text-gray-600 mb-1'>Bugungi qarz</div>
                            <div className='text-lg font-bold text-orange-700'>{formatNumber(data.orders.total_debt_today_client)}</div>
                        </div>
                        <div className='bg-yellow-50 p-4 rounded-xl border border-yellow-200'>
                            <div className='text-xs text-gray-600 mb-1'>Chegirma</div>
                            <div className='text-lg font-bold text-yellow-700'>{formatNumber(data.orders.discount)}</div>
                        </div>
                        <div className='bg-cyan-50 p-4 rounded-xl border border-cyan-200'>
                            <div className='text-xs text-gray-600 mb-1'>Qaytim</div>
                            <div className='text-sm font-bold text-cyan-700'>
                                USD: {formatNumber(data.orders.change.usd)} | UZS: {formatNumber(data.orders.change.uzs)}
                            </div>
                        </div>
                    </div>
                    <PaymentBreakdown payments={data.orders.payments} title="To'lovlar" />
                </div>
            </div>

            {/* Vozvrat Section */}
            <div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100'>
                <div className='flex items-center gap-2 mb-4'>
                    <RotateCcw className='w-5 h-5 text-orange-600' />
                    <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>Qaytarilganlar</h2>
                </div>
                <div className='space-y-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4'>
                        <div className='bg-orange-50 p-4 rounded-xl border border-orange-200'>
                            <div className='text-xs text-gray-600 mb-1'>Qaytarilganlar soni</div>
                            <div className='text-xl font-bold text-orange-700'>{data.vozvrat.count}</div>
                        </div>
                        <div className='bg-red-50 p-4 rounded-xl border border-red-200'>
                            <div className='text-xs text-gray-600 mb-1'>Jami qaytarilgan (USD)</div>
                            <div className='text-xl font-bold text-red-700'>{formatNumber(data.vozvrat.total_refunded_usd)} $</div>
                        </div>
                        <div className='bg-yellow-50 p-4 rounded-xl border border-yellow-200'>
                            <div className='text-xs text-gray-600 mb-1'>Chegirma</div>
                            <div className='text-xl font-bold text-yellow-700'>{formatNumber(data.vozvrat.discount)}</div>
                        </div>
                    </div>
                    <PaymentBreakdown payments={data.vozvrat.payments} title="Qaytarilgan to'lovlar" />
                </div>
            </div>

            {/* Expenses Section */}
            <div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100'>
                <div className='flex items-center gap-2 mb-4'>
                    <TrendingDown className='w-5 h-5 text-red-600' />
                    <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>Chiqimlar</h2>
                </div>
                <div className='space-y-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
                        <div className='bg-red-50 p-4 rounded-xl border border-red-200'>
                            <div className='text-xs text-gray-600 mb-1'>Chiqimlar soni</div>
                            <div className='text-xl font-bold text-red-700'>{data.expenses.count}</div>
                        </div>
                        <div className='bg-rose-50 p-4 rounded-xl border border-rose-200'>
                            <div className='text-xs text-gray-600 mb-1'>Jami chiqim (USD)</div>
                            <div className='text-xl font-bold text-rose-700'>{formatNumber(data.expenses.total_usd)} $</div>
                        </div>
                    </div>
                    <PaymentBreakdown payments={data.expenses.payments} title="Chiqim to'lovlari" />
                </div>
            </div>

            {/* Debt Repayments Section */}
            <div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100'>
                <div className='flex items-center gap-2 mb-4'>
                    <DollarSign className='w-5 h-5 text-emerald-600' />
                    <h2 className='text-xl sm:text-2xl font-bold text-gray-800'>Qarz to'lovlari</h2>
                </div>
                <div className='space-y-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
                        <div className='bg-emerald-50 p-4 rounded-xl border border-emerald-200'>
                            <div className='text-xs text-gray-600 mb-1'>To'lovlar soni</div>
                            <div className='text-xl font-bold text-emerald-700'>{data.debt_repayments.count}</div>
                        </div>
                        <div className='bg-green-50 p-4 rounded-xl border border-green-200'>
                            <div className='text-xs text-gray-600 mb-1'>Jami to'langan (USD)</div>
                            <div className='text-lg font-bold text-green-700'>{formatNumber(data.debt_repayments.total_paid_usd)} $</div>
                        </div>
                        <div className='bg-yellow-50 p-4 rounded-xl border border-yellow-200'>
                            <div className='text-xs text-gray-600 mb-1'>Chegirma</div>
                            <div className='text-lg font-bold text-yellow-700'>{formatNumber(data.debt_repayments.discount)}</div>
                        </div>
                        <div className='bg-cyan-50 p-4 rounded-xl border border-cyan-200'>
                            <div className='text-xs text-gray-600 mb-1'>Qaytim</div>
                            <div className='text-sm font-bold text-cyan-700'>
                                USD: {formatNumber(data.debt_repayments.change.usd)} | UZS:{' '}
                                {formatNumber(data.debt_repayments.change.uzs)}
                            </div>
                        </div>
                    </div>
                    <PaymentBreakdown payments={data.debt_repayments.payments} title="Qarz to'lovlari" />
                </div>
            </div>
        </div>
    );
}
