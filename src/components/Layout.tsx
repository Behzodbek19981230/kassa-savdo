import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { ArrowLeft, BarChart2, DollarSign, Plus, User, Building2, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { USD_RATE, ROUTES } from '../constants';

interface LayoutProps {
    children: React.ReactNode;
    onBack?: () => void;
    showBackButton?: boolean;
}

export function Layout({
    children,
    onBack,
    showBackButton = true,
}: LayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { kassir, user, logout } = useAuth();

    // Back button faqat order pagelarda ko'rsatiladi
    const shouldShowBack = showBackButton && location.pathname.startsWith('/order');
    const handleBack = onBack || (() => navigate(ROUTES.HOME));

    return (
        <div className='flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50  '>
            {/* Top Navigation Bar */}
            <header className='bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white px-3 sm:px-5 py-3 shrink-0 shadow-lg'>
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
                    {/* Chap tomonda: Primary navigation (converted from buttons to semantic nav menu) */}
                    <nav aria-label='Primary' className='w-full sm:w-auto'>
                        <div className='flex items-center gap-2 sm:gap-3'>
                            {shouldShowBack && (
                                <button
                                    onClick={handleBack}
                                    className='hover:bg-white/20 p-2 rounded-xl transition-all duration-200 shrink-0'
                                    title='Orqaga'
                                >
                                    <ArrowLeft size={24} />
                                </button>
                            )}
                            <ul className='flex items-center gap-2'>
                                <li>
                                    <NavLink
                                        to={ROUTES.HOME}
                                        className={({ isActive }) =>
                                            `px-3 py-2 rounded-md text-sm font-semibold transition ${isActive ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                                            }`
                                        }
                                    >
                                        Kassa
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to={ROUTES.ORDER_CREATE}
                                        className={({ isActive }) =>
                                            `px-3 py-2 rounded-md text-sm font-semibold transition flex items-center gap-2 ${isActive ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                                            }`
                                        }
                                        title='Buyurma qilish'
                                    >
                                        <Plus size={16} />
                                        <span className='hidden sm:inline'>Buyurma qilish</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to={ROUTES.STATISTICS}
                                        className={({ isActive }) =>
                                            `px-3 py-2 rounded-md text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${isActive ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                                            }`
                                        }
                                        title='Statistika'
                                    >
                                        <BarChart2 size={18} />
                                        <span className='hidden sm:inline'>Statistika</span>
                                    </NavLink>
                                </li>
                            </ul>
                        </div>
                    </nav>

                    {/* O'ng tomonda: Vaqt, Kurs, Profil, Knopkalar */}
                    <div className='flex items-center flex-wrap gap-2 sm:gap-3 w-full sm:w-auto justify-end'>
                        {/* Vaqt va Kurs */}
                        <div className='flex items-center gap-2'>
                            {user?.order_filial && (
                                <div className='hidden sm:flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm ml-3'>
                                    <Building2 className='w-3 h-3 text-white/90' />
                                    <span className='text-xs font-semibold'>{user.order_filial_detail?.name}</span>
                                </div>
                            )}
                            <div className='hidden md:flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm'>
                                <DollarSign className='w-4 h-4 text-white/90 shrink-0' />
                                <span className='text-xs font-semibold whitespace-nowrap'>
                                    1 USD = {USD_RATE.toLocaleString()} UZS
                                </span>
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
                                            : kassir?.username || "Rol yo'q"}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Logout (right) */}
                        <button
                            onClick={logout}
                            className='hover:bg-white/20 p-2 rounded-xl transition-all duration-200'
                            title='Chiqish'
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className='flex-1 overflow-y-auto overflow-x-hidden min-h-0'>{children}</main>
        </div>
    );
}
