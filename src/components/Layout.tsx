import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, Clock, DollarSign, Plus, User, Building2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Customer } from './Kassa/types';
import { OrderResponse } from '../services/orderService';

interface LayoutProps {
    children: React.ReactNode;
    onBack?: () => void;
    showBackButton?: boolean;
    selectedCustomer?: Customer | null;
    orderData?: OrderResponse | null;
    isSaleStarted?: boolean;
    isCreatingOrder?: boolean;
    onStartSaleClick?: () => void;
}

export function Layout({
    children,
    onBack,
    showBackButton = true,
    selectedCustomer,
    orderData,
    isSaleStarted = false,
    isCreatingOrder = false,
    onStartSaleClick
}: LayoutProps) {
    const navigate = useNavigate();
    const { kassir, user } = useAuth();
    const USD_RATE = 12180;
    const [now, setNow] = useState(() => new Date());
    
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
        <div className='flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 overflow-hidden'>
            {/* Top Navigation Bar */}
            <header className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white px-3 sm:px-5 py-3 shrink-0 shadow-lg'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
                    {/* Chap tomonda: Navigation va Filial */}
                    <div className='flex items-center gap-2 sm:gap-3 w-full sm:w-auto'>
                        {showBackButton && onBack && (
                            <button
                                onClick={onBack}
                                className='hover:bg-white/20 p-2 rounded-xl transition-all duration-200 shrink-0'
                            >
                                <ArrowLeft size={24} />
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/')}
                            className='text-sm font-semibold tracking-wide text-white/90 hover:opacity-90 hover:bg-white/10 px-2 py-1 rounded-lg transition-all'
                        >
                            Bosh sahifa
                        </button>
                        {user?.order_filial && (
                            <div className='hidden sm:flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm'>
                                <Building2 className='w-3 h-3 text-white/90' />
                                <span className='text-xs font-semibold'>{user.order_filial_detail?.name}</span>
                            </div>
                        )}
                    </div>

                    {/* O'ng tomonda: Vaqt, Kurs, Profil, Knopkalar */}
                    <div className='flex items-center flex-wrap gap-2 sm:gap-3 w-full sm:w-auto justify-end'>
                        {/* Vaqt va Kurs */}
                        <div className='flex items-center gap-2'>
                            <div className='flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm'>
                                <Clock className='w-4 h-4 text-white/90 shrink-0' />
                                <span className='hidden md:inline text-xs font-semibold whitespace-nowrap'>{dateTimeText}</span>
                                <span className='md:hidden text-xs font-semibold whitespace-nowrap'>{timeText}</span>
                            </div>
                            <div className='hidden md:flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm'>
                                <DollarSign className='w-4 h-4 text-white/90 shrink-0' />
                                <span className='text-xs font-semibold whitespace-nowrap'>1 USD = {USD_RATE.toLocaleString()} UZS</span>
                            </div>
                        </div>

                        {/* Kassir Profili */}
                        {(kassir || user) && (
                            <div className='hidden sm:flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm'>
                                <div className='w-8 h-8 bg-white/30 rounded-full flex items-center justify-center shrink-0'>
                                    <User className='w-4 h-4' />
                                </div>
                                <div className='text-xs'>
                                    <div className='font-semibold whitespace-nowrap'>
                                        {kassir?.full_name || user?.full_name || 'Foydalanuvchi'}
                                    </div>
                                    <div className='text-[10px] opacity-80 mt-0.5 whitespace-nowrap'>
                                        {user?.role_detail && user.role_detail.length > 0
                                            ? user.role_detail.map((role) => role.name).join(', ')
                                            : kassir?.username || 'Rol yo\'q'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Statistika knopkasi */}
                        <button
                            onClick={() => navigate('/statistika')}
                            className='flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-white/20 whitespace-nowrap'
                            title='Statistika'
                        >
                            <BarChart2 size={18} />
                            <span className='hidden sm:inline'>Statistika</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            {children}
        </div>
    );
}
