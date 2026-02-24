import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    DollarSign,
    User,
    Building2,
    LogOut,
    FileText,
    Undo2,
    ShoppingCart,
    StickyNote,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { USD_RATE, ROUTES } from '../constants';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { NotesPanel } from './NotesPanel';

interface LayoutProps {
    children: React.ReactNode;
    onBack?: () => void;
    showBackButton?: boolean;
}

export function Layout({ children, onBack, showBackButton = true }: LayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { kassir, user, logout } = useAuth();
    const [notesOpen, setNotesOpen] = useState(false);

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
                                            `px-3 py-2 rounded-md text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap shrink-0 ${isActive ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                                            }`
                                        }
                                    >
                                        <ShoppingCart size={18} />
                                        <span className='hidden sm:inline'>Savdo ro'yxati</span>
                                    </NavLink>
                                </li>
                                {/* <li>
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
                                </li> */}
                                {/* <li>
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
                                </li> */}
                                <li>
                                    <NavLink
                                        to={ROUTES.DEBT_REPAYMENT}
                                        className={({ isActive }) =>
                                            `px-3 py-2 rounded-md text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${isActive ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                                            }`
                                        }
                                        title="To'langan qarzlar"
                                    >
                                        <FileText size={18} />
                                        <span className='hidden sm:inline'>To'langan qarzlar</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to={ROUTES.EXPENSES}
                                        className={({ isActive }) =>
                                            `px-3 py-2 rounded-md text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${isActive ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                                            }`
                                        }
                                        title='Xarajatlar'
                                    >
                                        <DollarSign size={18} />
                                        <span className='hidden sm:inline'>Xarajatlar</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to={ROUTES.VOZVRAT_ORDER}
                                        className={({ isActive }) =>
                                            `px-3 py-2 rounded-md text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap ${isActive ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'
                                            }`
                                        }
                                        title='Tovar qaytarish'
                                    >
                                        <Undo2 size={18} />
                                        <span className='hidden sm:inline'>Tovar qaytarish</span>
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

            {/* Sticky eslatmalar tugmasi */}
            <button
                onClick={() => setNotesOpen(true)}
                className='fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1.5 rounded-l-xl border border-r-0 border-amber-300 bg-amber-500 px-2 py-3 text-white shadow-lg transition-all hover:px-3 hover:shadow-xl'
                title='Eslatmalar'
            >
                <StickyNote className='h-5 w-5' />
            </button>

            {/* O'ng tarafdan ochiladigan eslatmalar paneli */}
            <Sheet open={notesOpen} onOpenChange={setNotesOpen}>
                <SheetContent side='right' className='w-[400px] sm:max-w-[420px] p-0 flex flex-col'>
                    <SheetHeader className='px-4 pt-4 pb-0'>
                        <SheetTitle className='text-lg'>Eslatmalar</SheetTitle>
                        <SheetDescription className='sr-only'>Eslatmalar paneli</SheetDescription>
                    </SheetHeader>
                    <div className='flex-1 overflow-hidden'>
                        <NotesPanel embedded />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
