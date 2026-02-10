import { Plus, Eye, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DatePicker } from '../ui/DatePicker';
import { useState } from 'react';
import { useOrders, useOrdersMySelf } from '../../hooks/useOrders';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface DashboardProps {
    onNewSale?: () => void;
}

export function Dashboard({ onNewSale }: DashboardProps) {
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = useState<Date | undefined>(new Date());

    // API dan order-historylarni olish
    const { data: ordersData, isLoading, error } = useOrdersMySelf({
        date_from: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        date_to: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
        page_size: 100,
    });

    const orders = ordersData?.results || [];

    return (
        <div className='p-3 sm:p-6 min-h-full'>
            <div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 min-h-[400px] border border-gray-100'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
                    <h2 className='text-2xl sm:text-3xl font-bold text-gray-800'>Savdo ro'yxati</h2>
                    <div className='flex flex-wrap items-center gap-3'>
                        <div className='flex items-center gap-2'>
                            <DatePicker
                                date={startDate}
                                onDateChange={setStartDate}
                                placeholder='Dan'
                            />
                            <span className='text-gray-400'>—</span>
                            <DatePicker
                                date={endDate}
                                onDateChange={setEndDate}
                                placeholder='Gacha'
                            />
                        </div>
                        <button className='px-4 sm:px-5 py-2.5 border-2 border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 flex items-center justify-center text-blue-700 font-medium transition-all duration-200'>
                            <span className='mr-2'>🔍</span> <span className='hidden sm:inline'>Saralash</span>
                        </button>
                        <button
                            onClick={onNewSale}
                            className='px-4 sm:px-5 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] font-semibold'
                        >
                            <Plus size={18} className='mr-2' />
                            <span className='hidden sm:inline'>Yangi savdo</span>
                            <span className='sm:hidden'>Yangi</span>
                        </button>
                    </div>
                </div>

                {/* Orders List */}
                {isLoading ? (
                    <div className='flex justify-center items-center h-64'>
                        <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
                    </div>
                ) : error ? (
                    <div className='flex justify-center items-center h-64 text-red-500 text-lg'>
                        Xatolik yuz berdi
                    </div>
                ) : orders.length > 0 ? (
                    <div className='space-y-1.5'>
                        {orders
                            .filter((order) => !order.is_delete)
                            .map((order) => {
                                const isKarzinka = order.is_karzinka;
                                const orderPath = isKarzinka ? `/order/${order.id}` : `/order/show/${order.id}`;

                                return (
                                    <div
                                        key={order.id}
                                        className='bg-white border border-blue-200 rounded-lg px-3 py-3 hover:shadow-md transition-all duration-200'
                                    >
                                        {/* Mobile/Tablet: Vertical layout */}
                                        <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3'>
                                            {/* Top row: Order ID, Date, Badge */}
                                            <div className='flex items-center gap-2 sm:gap-3 flex-wrap'>
                                                <span className='text-gray-500 font-mono text-xs shrink-0'>
                                                    #{order.id.toString().slice(-4)}
                                                </span>
                                                <span className='font-semibold text-gray-900 text-sm shrink-0'>
                                                    Order #{order.id}
                                                </span>
                                                {order.date && (
                                                    <>
                                                        <span className='hidden sm:inline text-gray-400'>|</span>
                                                        <span className='text-xs text-gray-500 shrink-0'>
                                                            {new Date(order.date).toLocaleString('uz-UZ', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </>
                                                )}
                                                {/* Badge */}
                                                {isKarzinka ? (
                                                    <span className='px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full border border-yellow-300 shrink-0'>
                                                        Korzinkada
                                                    </span>
                                                ) : (
                                                    <span className='px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-300 shrink-0 flex items-center gap-1'>
                                                        <CheckCircle2 size={12} />
                                                        Savdo yakunlangan
                                                    </span>
                                                )}
                                            </div>

                                            {/* Middle row: Customer info */}
                                            <div className='flex items-center gap-2 text-xs text-gray-600 flex-wrap'>
                                                <span className='text-gray-500'>Mijoz:</span>
                                                <span className='font-medium'>
                                                    {order.client_detail?.full_name || `ID: ${order.client}`}
                                                </span>
                                                {order.client_detail?.phone_number && (
                                                    <>
                                                        <span className='text-gray-400 hidden sm:inline'>|</span>
                                                        <span className='text-gray-600'>
                                                            {order.client_detail.phone_number}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Bottom row: Amount and Button */}
                                            <div className='flex items-center justify-between sm:justify-end gap-2 sm:ml-auto'>
                                                <span className='font-bold text-blue-700 text-sm sm:text-base'>
                                                    {parseFloat(order.all_product_summa || '0').toLocaleString()} USD
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(orderPath);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${isKarzinka
                                                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                                        }`}
                                                    title={isKarzinka ? 'Davom etish' : "Ko'rish"}
                                                >
                                                    {isKarzinka ? (
                                                        <>
                                                            <ArrowRight size={14} />
                                                            <span className='hidden sm:inline'>Davom etish</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye size={14} />
                                                            <span className='hidden sm:inline'>Ko'rish</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                ) : (
                    <div className='flex justify-center items-center h-64 text-gray-400 text-lg'>
                        Ma'lumotlar yo'q
                    </div>
                )}
            </div>
        </div>
    );
}
