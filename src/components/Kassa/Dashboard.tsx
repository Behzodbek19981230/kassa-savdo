import { Plus, Eye, Loader2, ArrowRight, CheckCircle2, Edit, Trash2, X, Search, FilterX } from 'lucide-react';
import { useState, useMemo, useCallback, Fragment } from 'react';
import { DateRangePicker } from '../ui/date-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOrdersMySelf } from '../../hooks/useOrders';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { OrderResponse } from '../../services/orderService';
import { orderService } from '../../services/orderService';
import { userService } from '../../services/userService';
import { clientService } from '../../services/clientService';
import type { Client } from '../../services/clientService';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { Autocomplete, type AutocompleteOption } from '../ui/Autocomplete';
import { showError, showSuccess } from '../../lib/toast';
import clsx from 'clsx';

interface DashboardProps {
    onNewSale?: () => void;
}

interface DraftFilters {
    search: string;
    clientId: number | null;
    employee: number | null;
    status: 'all' | 'completed' | 'pending';
    dateFrom: Date | undefined;
    dateTo: Date | undefined;
}

const defaultDraft: DraftFilters = {
    search: '',
    clientId: null,
    employee: null,
    status: 'all',
    // Default: one month ago to today
    dateFrom: (() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d;
    })(),
    dateTo: new Date(),
};

function tolovSummasi(order: OrderResponse): number {
    const n = parseFloat(order.summa_naqt || '0') || 0;
    const k = parseFloat(order.summa_kilik || '0') || 0;
    const t = parseFloat(order.summa_terminal || '0') || 0;
    const tr = parseFloat(order.summa_transfer || '0') || 0;
    const d = parseFloat(order.summa_dollar || '0') || 0;
    return n + k + t + tr + d;
}

export function Dashboard({ onNewSale }: DashboardProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Draft filters (user edits these, not applied until "Filter" button click)
    const [draft, setDraft] = useState<DraftFilters>({ ...defaultDraft });
    // Applied filters (used in API query)
    const [applied, setApplied] = useState<DraftFilters>({ ...defaultDraft });

    const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<any | null>(null);

    // Client search for Autocomplete
    const [clients, setClients] = useState<Client[]>([]);
    const [isSearchingClients, setIsSearchingClients] = useState(false);

    const searchClients = useCallback(async (query: string) => {
        setIsSearchingClients(true);
        try {
            const response = await clientService.getClients(query || '');
            setClients(response.results.filter((c) => c.is_active && !c.is_delete));
        } catch {
            setClients([]);
        } finally {
            setIsSearchingClients(false);
        }
    }, []);

    const clientOptions: AutocompleteOption[] = useMemo(
        () =>
            clients.map((c) => ({
                id: c.id.toString(),
                label: `${c.full_name}${c.phone_number ? ` (${c.phone_number})` : ''}`,
                value: c.id.toString(),
            })),
        [clients],
    );

    // Apply filters → build API params from "applied" state
    const orderParams = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const df = applied.dateFrom ? format(applied.dateFrom, 'yyyy-MM-dd') : today;
        const dt = applied.dateTo ? format(applied.dateTo, 'yyyy-MM-dd') : today;
        return {
            date_from: df,
            date_to: dt,
            limit: 500,
            search: applied.search.trim() || undefined,
            client: applied.clientId || undefined,
            created_by: applied.employee || undefined,
            is_karzinka: applied.status === 'pending' ? true : applied.status === 'completed' ? false : undefined,
        };
    }, [applied]);

    const { data: ordersData, isLoading, error, refetch } = useOrdersMySelf(orderParams);

    const { data: usersData } = useQuery({
        queryKey: ['users-list'],
        queryFn: () => userService.getUsers({ limit: 200 }),
        staleTime: 60000,
    });
    const users = usersData?.results || [];

    // Handle "Filter" button click
    const handleApplyFilters = () => {
        setApplied({ ...draft });
    };

    // Handle "Clear" button click
    const handleClearFilters = () => {
        const reset = { ...defaultDraft };
        setDraft(reset);
        setApplied(reset);
    };

    // Check if any filter is active (different from default)
    const datesEqual = (a?: Date, b?: Date) => {
        if (!a && !b) return true;
        if (!a || !b) return false;
        return a.getTime() === b.getTime();
    };

    const isFiltered =
        draft.search !== '' ||
        draft.clientId !== null ||
        draft.employee !== null ||
        draft.status !== 'all' ||
        !datesEqual(draft.dateFrom, defaultDraft.dateFrom) ||
        !datesEqual(draft.dateTo, defaultDraft.dateTo);

    const groupedResults = ordersData?.results || [];
    const isGroupedByDate = groupedResults.length > 0 && (groupedResults[0] as any).items !== undefined;
    const groups = useMemo(() => {
        if (!isGroupedByDate) {
            return [
                {
                    date: null,
                    count: groupedResults.length,
                    items: groupedResults,
                },
            ];
        }
        return groupedResults as Array<any>;
    }, [ordersData]);

    const overallTotals = useMemo(() => {
        let totalCount = 0;
        let totalZakaz = 0;
        let totalTolangan = 0;
        let totalQaytimDollar = 0;
        let totalQaytimSom = 0;
        let totalBugungiQarz = 0;
        let totalUmumiyQarz = 0;
        let totalFoyda = 0;
        let totalKeshbek = 0;
        for (const g of groups) {
            const items = (g.items || []).filter((o: any) => !o.is_delete);
            totalCount += items.length;
            for (const o of items) {
                totalZakaz += parseFloat(o.all_product_summa || '0') || 0;
                totalTolangan += tolovSummasi(o as OrderResponse);
                totalQaytimDollar += parseFloat(o.zdacha_dollar || '0') || 0;
                totalQaytimSom += parseFloat(o.zdacha_som || '0') || 0;
                totalBugungiQarz += parseFloat(o.total_debt_today_client || '0') || 0;
                totalUmumiyQarz += parseFloat(o.total_debt_client || '0') || 0;
                totalFoyda += parseFloat(o.all_profit_dollar || '0') || 0;
                totalKeshbek += parseFloat(o.client_detail?.keshbek || o.cashback_dollar || '0') || 0;
            }
        }
        return {
            totalCount,
            totalZakaz,
            totalTolangan,
            totalQaytimDollar,
            totalQaytimSom,
            totalBugungiQarz,
            totalUmumiyQarz,
            totalFoyda,
            totalKeshbek
        };
    }, [groups]);

    // Order ni tahrirlash
    const handleEdit = (order: any) => {
        navigate(`/order/update/${order.id}`);
    };

    // Order ni o'chirish modalini ochish
    const handleDeleteClick = (order: any) => {
        setOrderToDelete(order);
        setDeleteModalOpen(true);
    };

    // Order ni o'chirish
    const handleDelete = async () => {
        if (!orderToDelete) return;

        setDeletingOrderId(orderToDelete.id);
        try {
            await orderService.deleteOrder(orderToDelete.id);
            showSuccess("Savdo muvaffaqiyatli o'chirildi");
            // Query ni invalidate qilish va refetch - ro'yxatni yangilash
            queryClient.invalidateQueries({ queryKey: ['orders-my-self'] });
            await refetch();
            setDeleteModalOpen(false);
            setOrderToDelete(null);
        } catch (error: any) {
            console.error('Failed to delete order:', error);
            const errorMessage =
                error?.response?.data?.detail || error?.message || "Savdoni o'chirishda xatolik yuz berdi";
            showError(errorMessage);
        } finally {
            setDeletingOrderId(null);
        }
    };

    return (
        <div className='p-2 sm:p-3 min-h-full'>
            <div className='bg-white rounded-xl shadow-xl p-2 sm:p-3 min-h-[400px] border border-gray-100 overflow-hidden'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2'>
                    <h2 className='text-xl font-bold text-gray-800'>Savdo ro'yxati</h2>
                    <button
                        onClick={onNewSale}
                        className='px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-xs'
                    >
                        <Plus size={14} className='mr-1.5' />
                        <span className='hidden sm:inline'>Yangi savdo</span>
                        <span className='sm:hidden'>Yangi</span>
                    </button>
                </div>

                {/* Filters Bar */}
                <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-1.5 mb-2'>
                    <div className='w-full sm:w-[240px]'>
                        <Autocomplete
                            options={clientOptions}
                            value={draft.clientId?.toString() || ''}
                            onChange={(v) => setDraft((p) => ({ ...p, clientId: v ? Number(v) : null }))}
                            onSearchChange={searchClients}
                            placeholder='Mijozni tanlang'
                            emptyMessage={isSearchingClients ? 'Qidirilmoqda...' : 'Mijoz topilmadi'}
                            className='!h-8 !min-h-8'
                        />
                    </div>

                    <div className='w-full sm:w-auto sm:min-w-[170px]'>
                        <Select
                            onValueChange={(v) =>
                                setDraft((p) => ({ ...p, employee: v && v !== '0' ? Number(v) : null }))
                            }
                            value={draft.employee ? String(draft.employee) : '0'}
                        >
                            <SelectTrigger className='w-full h-8 text-sm'>
                                <SelectValue placeholder='Barcha xodimlar' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='0'>Barcha xodimlar</SelectItem>
                                {users.map((u: any) => (
                                    <SelectItem key={u.id} value={String(u.id)}>
                                        {u.full_name || u.username}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className='w-full sm:w-auto sm:min-w-[140px]'>
                        <Select
                            onValueChange={(v) => setDraft((p) => ({ ...p, status: v as DraftFilters['status'] }))}
                            value={draft.status}
                        >
                            <SelectTrigger className='w-full h-8 text-sm'>
                                <SelectValue placeholder='Barcha holatlar' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>Barchasi</SelectItem>
                                <SelectItem value='completed'>Yakunlangan</SelectItem>
                                <SelectItem value='pending'>Korzinkada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className='w-full sm:w-auto'>
                        <DateRangePicker
                            dateFrom={draft.dateFrom}
                            dateTo={draft.dateTo}
                            onDateFromChange={(d) => setDraft((p) => ({ ...p, dateFrom: d }))}
                            onDateToChange={(d) => setDraft((p) => ({ ...p, dateTo: d }))}
                        />
                    </div>

                    <div className='flex items-center gap-2'>
                        <button
                            onClick={handleApplyFilters}
                            className='h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1 text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200'
                        >
                            <Search size={12} />
                            <span>Filter</span>
                        </button>
                        {isFiltered && (
                            <button
                                onClick={handleClearFilters}
                                className='h-7 px-2 bg-gray-100 text-gray-600 rounded-md hover:bg-red-50 hover:text-red-600 flex items-center gap-1 text-xs font-medium border border-gray-200 transition-all duration-200'
                                title='Filterlarni tozalash'
                            >
                                <FilterX size={12} />
                                <span className='hidden sm:inline'>Tozalash</span>
                            </button>
                        )}
                    </div>
                </div>

                {isLoading ? (
                    <div className='flex justify-center items-center h-64'>
                        <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
                    </div>
                ) : error ? (
                    <div className='flex justify-center items-center h-64 text-red-500 text-lg'>Xatolik yuz berdi</div>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full border-collapse text-xs'>
                            <thead>
                                <tr className='border-b-2 border-blue-200 bg-blue-50/50'>
                                    <th className='text-left p-1 font-semibold text-gray-700 min-w-[110px] text-xs'>Sana</th>
                                    <th className='text-left p-1 font-semibold text-gray-700 whitespace-nowrap w-[60px] text-xs'>
                                        t/r
                                    </th>
                                    <th className='text-left p-1 font-semibold text-gray-700 min-w-[120px] text-xs'>Mijoz</th>
                                    <th className='text-left p-1 font-semibold text-gray-700 min-w-[120px] text-xs'>Kim buyurtma oldi</th>
                                    <th className='text-right p-1 font-semibold text-gray-700 min-w-[100px] text-xs'>
                                        To'lanadigan summa($)
                                    </th>
                                    <th className='text-right p-1 font-semibold text-gray-700 min-w-[100px] text-xs'>
                                        To'langan summa($)
                                    </th>
                                    <th className='text-right p-1 font-semibold text-gray-700 min-w-[80px] text-xs'>Qaytim</th>
                                    <th className='text-right p-1 font-semibold text-gray-700 min-w-[90px] text-xs'>
                                        Bugungi qarz($)
                                    </th>
                                    <th className='text-right p-1 font-semibold text-gray-700 min-w-[90px] text-xs'>
                                        Umumiy qolgan qarz($)
                                    </th>
                                    <th className='text-right p-1 font-semibold text-gray-700 min-w-[90px] text-xs'>
                                        Jami foyda($)
                                    </th>
                                    <th className='text-right p-1 font-semibold text-gray-700 min-w-[120px] text-xs'>Yaratilgan vaqt</th>
                                    <th className='text-right p-1 font-semibold text-gray-700 min-w-[110px] text-xs'>Buyurtma holati</th>
                                    <th className='text-right p-1 font-semibold text-gray-700 min-w-[80px] text-xs'>Keshbek($)</th>
                                    <th className='text-right p-1 font-semibold text-gray-700 w-24 text-xs'>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.length === 0 || groups.every((g) => (g.items?.length || 0) === 0) ? (
                                    <tr>
                                        <td colSpan={14} className='text-center py-12 text-gray-400'>
                                            Ma'lumotlar yo'q
                                        </td>
                                    </tr>
                                ) : (
                                    (() => {
                                        return groups.map((group, gIdx) => {
                                            const items = (group.items || []).filter((o: any) => !o.is_delete);
                                            return (
                                                <Fragment key={`group-${group.date ?? gIdx}`}>
                                                    {items.map((order: any, itemIdx: number) => {
                                                        const isKarzinka = order.is_karzinka;
                                                        const orderPath = isKarzinka
                                                            ? `/order/${order.id}`
                                                            : `/order/show/${order.id}`;
                                                        const tolangan = tolovSummasi(order as OrderResponse);
                                                        const isFirstInGroup = itemIdx === 0;
                                                        const groupDate = group.date
                                                            ? format(new Date(group.date), 'dd.MM.yyyy')
                                                            : 'Barcha sanalar';

                                                        const payable = parseFloat(order.all_product_summa || '0');
                                                        const paid = tolangan;
                                                        const exchangeRate = order.exchange_rate || 1;
                                                        const changeDollar = parseFloat(order.zdacha_dollar || '0');
                                                        const changeSom = parseFloat(order.zdacha_som || '0');
                                                        const todayDebt = parseFloat(order.total_debt_today_client || '0');
                                                        const totalDebt = parseFloat(order.total_debt_client || '0');
                                                        const totalProfit = parseFloat(order.all_profit_dollar || '0');
                                                        const cashback = parseFloat(order.client_detail?.keshbek || order.cashback_dollar || '0');

                                                        return (
                                                            <tr
                                                                key={order.id}
                                                                className={clsx(
                                                                    'border-b border-gray-100 group hover:bg-blue-50/30 transition-colors even:bg-gray-100',
                                                                    {
                                                                        'bg-red-50': !order.order_status,
                                                                    },
                                                                )}
                                                            >
                                                                {isFirstInGroup ? (
                                                                    <td
                                                                        rowSpan={items.length}
                                                                        className='text-left p-1 font-semibold text-gray-700 text-xs align-top border-r border-gray-200'
                                                                    >
                                                                        {groupDate}
                                                                    </td>
                                                                ) : null}
                                                                <td className='text-left p-1 text-gray-500 font-mono text-xs'>
                                                                    {order?.order}
                                                                </td>
                                                                <td className='p-1 text-left text-gray-800 text-xs'>
                                                                    {order.client_detail?.full_name ||
                                                                        `ID: ${order.client}`}
                                                                </td>
                                                                <td className='p-1 text-left text-gray-600 text-xs'>
                                                                    {order.created_by_detail?.full_name ??
                                                                        order.employee ??
                                                                        '—'}
                                                                </td>
                                                                <td className='p-1 text-right font-medium text-blue-700 text-xs'>
                                                                    {(payable / exchangeRate).toFixed(2)}
                                                                </td>
                                                                <td className='p-1 text-right text-gray-700 text-xs'>
                                                                    {(paid / exchangeRate).toFixed(2)}
                                                                </td>
                                                                <td className='p-1 text-right text-gray-700 text-xs'>
                                                                    {changeDollar > 0 || changeSom > 0
                                                                        ? `${changeDollar.toFixed(2)}$${changeSom > 0 ? ` / ${changeSom.toLocaleString()} so'm` : ''}`
                                                                        : '—'}
                                                                </td>
                                                                <td className='p-1 text-right text-gray-700 text-xs'>
                                                                    {(todayDebt / exchangeRate).toFixed(2)}
                                                                </td>
                                                                <td className='p-1 text-right text-gray-700 text-xs'>
                                                                    {(totalDebt / exchangeRate).toFixed(2)}
                                                                </td>
                                                                <td className='p-1 text-right text-gray-700 text-xs'>
                                                                    {totalProfit.toFixed(2)}
                                                                </td>
                                                                <td className='p-1 text-right text-gray-600 whitespace-nowrap text-xs'>
                                                                    {order.created_time
                                                                        ? format(new Date(order.created_time), ' HH:mm')
                                                                        : order.date
                                                                            ? format(new Date(order.date), ' HH:mm')
                                                                            : '—'}
                                                                </td>
                                                                <td className='text-right p-1 group-hover:bg-blue-50/30 transition-colors'>
                                                                    {isKarzinka ? (
                                                                        <span className='px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-semibold rounded-full border border-yellow-300'>
                                                                            Korzinkada
                                                                        </span>
                                                                    ) : order.order_status ? (
                                                                        <span className='px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-semibold rounded-full border border-green-300 inline-flex items-center gap-0.5'>
                                                                            <CheckCircle2 size={10} />
                                                                            Yakunlangan
                                                                        </span>
                                                                    ) : (
                                                                        <span className='px-1.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-semibold rounded-full border border-red-300'>
                                                                            Yakunlanmagan
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className='p-1 text-right text-gray-700 text-xs'>
                                                                    {cashback.toFixed(2)}
                                                                </td>
                                                                <td className='p-1 text-right group-hover:bg-blue-50/30 transition-colors'>
                                                                    <div className='flex items-center justify-center gap-0.5'>
                                                                        {/* Edit button */}
                                                                        {!isKarzinka && (
                                                                            <button
                                                                                onClick={() => handleEdit(order)}
                                                                                className='p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors disabled:opacity-50'
                                                                                title='Tahrirlash'
                                                                            >
                                                                                <Edit size={12} />
                                                                            </button>
                                                                        )}
                                                                        {/* View/Continue button */}
                                                                        <button
                                                                            onClick={() => navigate(orderPath)}
                                                                            className={`p-1 rounded transition-colors disabled:opacity-50 ${isKarzinka
                                                                                ? 'hover:bg-yellow-100 text-yellow-600'
                                                                                : 'hover:bg-green-100 text-green-600'
                                                                                }`}
                                                                            title={
                                                                                isKarzinka ? 'Davom etish' : "Ko'rish"
                                                                            }
                                                                        >
                                                                            {isKarzinka ? (
                                                                                <ArrowRight size={14} />
                                                                            ) : (
                                                                                <Eye size={14} />
                                                                            )}
                                                                        </button>
                                                                        {/* Delete button */}
                                                                        <button
                                                                            onClick={() => handleDeleteClick(order)}
                                                                            disabled={deletingOrderId === order.id}
                                                                            className='p-1 rounded hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                                                            title="O'chirish"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </Fragment>
                                            );
                                        });
                                    })()
                                )}
                                {/* overall totals row */}
                                {groups.length > 0 && groups[0]?.items?.[0] && (
                                    <tr className='bg-blue-50'>
                                        <td className='p-1 text-left font-semibold text-xs'>Jami</td>
                                        <td colSpan={3} />
                                        <td className='p-1 text-right font-semibold text-blue-700 text-xs'>
                                            {(overallTotals.totalZakaz / (groups[0]?.items?.[0]?.exchange_rate || 1)).toFixed(2)}
                                        </td>
                                        <td className='p-1 text-right font-semibold text-xs'>
                                            {(overallTotals.totalTolangan / (groups[0]?.items?.[0]?.exchange_rate || 1)).toFixed(2)}
                                        </td>
                                        <td className='p-1 text-right font-semibold text-xs'>
                                            {overallTotals.totalQaytimDollar > 0 || overallTotals.totalQaytimSom > 0
                                                ? `${overallTotals.totalQaytimDollar.toFixed(2)}$${overallTotals.totalQaytimSom > 0 ? ` / ${overallTotals.totalQaytimSom.toLocaleString()} so'm` : ''}`
                                                : '—'}
                                        </td>
                                        <td className='p-1 text-right font-semibold text-xs'>
                                            {(overallTotals.totalBugungiQarz / (groups[0]?.items?.[0]?.exchange_rate || 1)).toFixed(2)}
                                        </td>
                                        <td className='p-1 text-right font-semibold text-xs'>
                                            {(overallTotals.totalUmumiyQarz / (groups[0]?.items?.[0]?.exchange_rate || 1)).toFixed(2)}
                                        </td>
                                        <td className='p-1 text-right font-semibold text-xs'>
                                            {overallTotals.totalFoyda.toFixed(2)}
                                        </td>
                                        <td className='p-1 text-right font-semibold text-xs'></td>
                                        <td className='p-1 text-right font-semibold text-xs'></td>
                                        <td className='p-1 text-right font-semibold text-xs'>
                                            {overallTotals.totalKeshbek.toFixed(2)}
                                        </td>
                                        <td className='p-1 text-right font-semibold text-xs'></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
                    <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-red-200'>
                        <div className='flex justify-between items-center p-5 border-b-2 border-red-100 bg-red-50'>
                            <h3 className='text-xl font-bold text-gray-900'>Savdoni o'chirish</h3>
                            <button
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setOrderToDelete(null);
                                }}
                                disabled={deletingOrderId !== null}
                                className='text-gray-500 hover:text-red-600 hover:bg-white p-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className='p-6 bg-white'>
                            <p className='text-gray-700 mb-6'>
                                Savdo #{orderToDelete?.id} ni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.
                            </p>

                            <div className='flex gap-3 justify-end'>
                                <button
                                    onClick={() => {
                                        setDeleteModalOpen(false);
                                        setOrderToDelete(null);
                                    }}
                                    disabled={deletingOrderId !== null}
                                    className='px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    Bekor qilish
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deletingOrderId !== null}
                                    className='px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all duration-200 font-semibold text-xs shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5'
                                >
                                    {deletingOrderId !== null ? (
                                        <>
                                            <Loader2 className='w-4 h-4 animate-spin' />
                                            <span>O'chirilmoqda...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className='w-4 h-4' />
                                            <span>Ha, o'chirish</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
