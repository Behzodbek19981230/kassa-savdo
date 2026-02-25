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
    Bell,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNotesAll, useUpdateNote } from '../hooks/api/useNotes';
import { useAuth } from '../contexts/AuthContext';
import { USD_RATE, ROUTES } from '../constants';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { NotesPanel } from './NotesPanel';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import type { NoteItem } from '../services/note.service';

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
    const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
    const { data: notesData } = useNotesAll();
    const updateNote = useUpdateNote();
    const unreadNotesCount = notesData ? notesData.filter((n) => n.is_read === false).length : 0;
    const sortedNotes = notesData
        ? [...notesData].sort((a, b) => {
            const da = new Date(a.date || a.created_at || 0).getTime();
            const db = new Date(b.date || b.created_at || 0).getTime();
            return db - da;
        })
        : [];
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const ddRef = useRef<HTMLDivElement | null>(null);

    const prevUnreadRef = useRef<number>(unreadNotesCount);
    const [pulseActive, setPulseActive] = useState(false);

    useEffect(() => {
        // play short bell when new unread notifications arrive
        if (typeof prevUnreadRef.current === 'number' && unreadNotesCount > prevUnreadRef.current) {
            try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = 'sine';
                o.frequency.value = 1000;
                g.gain.value = 0.0001;
                o.connect(g);
                g.connect(ctx.destination);
                const now = ctx.currentTime;
                g.gain.linearRampToValueAtTime(0.15, now + 0.01);
                o.start(now);
                o.stop(now + 0.18);
                setTimeout(() => {
                    try {
                        ctx.close();
                    } catch { }
                }, 400);

                // visual pulse
                setPulseActive(true);
                setTimeout(() => setPulseActive(false), 1400);
            } catch (err) {
                // ignore audio errors
            }
        }
        prevUnreadRef.current = unreadNotesCount;
    }, [unreadNotesCount]);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!ddRef.current) return;
            if (!ddRef.current.contains(e.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener('click', onDoc);
        return () => document.removeEventListener('click', onDoc);
    }, []);

    const formatNoteDate = (raw?: string) => {
        if (!raw) return '—';
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return '—';
        const day = String(d.getDate()).padStart(2, '0');
        const mon = String(d.getMonth() + 1).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${day}.${mon} ${h}:${m}`;
    };

    const handleNoteClick = (note: NoteItem) => {
        setSelectedNote(note);
        setIsNoteDialogOpen(true);
        setDropdownOpen(false);

        // Agar eslatma o'qilmagan bo'lsa, uni o'qilgan deb belgilash
        if (note.is_read === false) {
            updateNote.mutateAsync({
                id: note.id,
                payload: {
                    sorting: note.sorting ?? 0,
                    date: note.date || new Date().toISOString(),
                    title: note.title,
                    text: note.text || '',
                    status: note.status || 'new',
                    is_read: true,
                    is_delete: note.is_delete ?? false,
                },
            }).catch((error: unknown) => {
                console.error('Failed to mark note as read:', error);
            });
        }
    };

    const handleDoneNote = async () => {
        if (!selectedNote) return;
        try {
            await updateNote.mutateAsync({
                id: selectedNote.id,
                payload: {
                    sorting: selectedNote.sorting ?? 0,
                    date: selectedNote.date || new Date().toISOString(),
                    title: selectedNote.title,
                    text: selectedNote.text || '',
                    status: 'done',
                    is_read: selectedNote.is_read ?? true,
                    is_delete: selectedNote.is_delete ?? false,
                },
            });
            setIsNoteDialogOpen(false);
            setSelectedNote(null);
        } catch (error) {
            console.error('Failed to mark note as done:', error);
        }
    };

    const unreadNotes = sortedNotes.filter((n) => n.is_read === false);

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

                        {/* Notifications dropdown */}
                        <div className='relative' ref={ddRef}>
                            <div
                                role='button'
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') setDropdownOpen((s) => !s);
                                }}
                                onClick={() => setDropdownOpen((s) => !s)}
                                title='Bildirishnomalar'
                                className='flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-sm shadow-sm cursor-pointer relative'
                            >
                                <Bell className='h-[18px] w-[18px] text-white/90' />
                                {pulseActive && (
                                    <span className='pointer-events-none absolute -inset-1 rounded-xl ring-2 ring-amber-300/70 opacity-90 animate-ping' />
                                )}
                                {unreadNotesCount > 0 && (
                                    <span className='absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-extrabold text-white border-2 border-white/10'>
                                        {unreadNotesCount > 99 ? '99+' : unreadNotesCount}
                                    </span>
                                )}
                            </div>

                            {dropdownOpen && (
                                <div className='absolute right-0 mt-2 w-[340px] p-1.5 z-50 rounded-lg border border-white/20 bg-slate-900/85 backdrop-blur-sm text-white shadow-lg'>
                                    <p className='px-2 py-1.5 text-xs font-semibold text-white/80'>Bildirishnomalar</p>
                                    <div className='max-h-[360px] overflow-y-auto'>
                                        {unreadNotes.length === 0 ? (
                                            <p className='px-2 py-4 text-sm text-white/70 text-center'>
                                                O'qilmagan bildirishnoma yo'q
                                            </p>
                                        ) : (
                                            <div className='space-y-1 pb-1'>
                                                {unreadNotes.map((note) => (
                                                    <div
                                                        key={note.id}
                                                        className='cursor-pointer rounded-xl border border-white/10 bg-slate-800/70 p-0 hover:bg-slate-800/80 transition-colors'
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleNoteClick(note);
                                                        }}
                                                    >
                                                        <div className='w-full p-2.5'>
                                                            <div className='w-full flex items-start justify-between gap-2'>
                                                                <p className='text-sm font-semibold leading-5 line-clamp-1 text-white'>
                                                                    {note.title || 'Sarlavha'}
                                                                </p>
                                                                <span className='shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-100'>
                                                                    Yangi
                                                                </span>
                                                            </div>
                                                            <p className='mt-1 text-xs text-white/80 line-clamp-2'>
                                                                {note.text || "Matn yo'q"}
                                                            </p>
                                                            <div className='mt-2 flex items-center justify-between'>
                                                                <p className='text-[11px] text-white/70'>
                                                                    {formatNoteDate(
                                                                        note.date || note.created_at,
                                                                    )}
                                                                </p>
                                                                <span className='text-[11px] text-white/70'>
                                                                    {note.status === 'done'
                                                                        ? 'Bajarilgan'
                                                                        : note.status === 'expired'
                                                                            ? "Muddati o'tgan"
                                                                            : 'Yangi'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

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

            {/* Eslatma Dialog */}
            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogContent className='sm:max-w-[560px]'>
                    <DialogHeader>
                        <DialogTitle>{selectedNote?.title || 'Eslatma'}</DialogTitle>
                        <DialogDescription>
                            {selectedNote ? formatNoteDate(selectedNote.date || selectedNote.created_at) : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-3'>
                        <div className='flex items-center gap-2 text-xs text-gray-500'>
                            <span>
                                Muallif: {selectedNote?.created_by_detail?.full_name || selectedNote?.author_name || '—'}
                            </span>
                            <span>•</span>
                            <span>
                                Status:{' '}
                                {selectedNote?.status === 'done'
                                    ? 'Bajarilgan'
                                    : selectedNote?.status === 'expired'
                                        ? "Muddati o'tgan"
                                        : 'Yangi'}
                            </span>
                        </div>
                        <div className='rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm leading-6 whitespace-pre-wrap'>
                            {selectedNote?.text || "Matn yo'q"}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setIsNoteDialogOpen(false)}>
                            Yopish
                        </Button>
                        {selectedNote && selectedNote.status !== 'done' && (
                            <Button onClick={handleDoneNote} disabled={updateNote.isPending}>
                                {updateNote.isPending ? 'Saqlanmoqda...' : 'Bajarildi'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
