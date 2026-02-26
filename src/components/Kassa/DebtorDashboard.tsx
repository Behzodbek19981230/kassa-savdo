import { Eye, Loader2, ArrowRight, Search, FilterX } from 'lucide-react';
import { useState, useMemo, useCallback, Fragment } from 'react';
import { DateRangePicker } from '../ui/date-picker';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { OrderResponse } from '../../services/orderService';
import { orderService } from '../../services/orderService';
import { userService } from '../../services/userService';
import { clientService } from '../../services/clientService';
import type { Client } from '../../services/clientService';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { Autocomplete, type AutocompleteOption } from '../ui/Autocomplete';
import clsx from 'clsx';

interface DraftFilters {
    search: string;
    clientId: number | null;
    employee: number | null;
    dateFrom: Date | undefined;
    dateTo: Date | undefined;
}

const defaultDraft: DraftFilters = {
    search: '',
    clientId: null,
    employee: null,
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

export function DebtorDashboard() {
    const navigate = useNavigate();

    // Draft filters (user edits these, not applied until "Filter" button click)
    const [draft, setDraft] = useState<DraftFilters>({ ...defaultDraft });
    // Applied filters (used in API query)
    const [applied, setApplied] = useState<DraftFilters>({ ...defaultDraft });


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
        };
    }, [applied]);

    const { data: ordersData, isLoading, error } = useQuery({
        queryKey: ['debtor-products', orderParams],
        queryFn: () => orderService.getDebtorProducts(orderParams),
        staleTime: 30000,
    });

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
        for (const g of groups) {
            const items = (g.items || []).filter((o: any) => !o.is_delete);
            totalCount += items.length;
            for (const o of items) {
                totalZakaz += parseFloat(o.all_product_summa || '0') || 0;
                totalTolangan += tolovSummasi(o as OrderResponse);
            }
        }
        return { totalCount, totalZakaz, totalTolangan };
    }, [groups]);


    return (
        <div className='p-3 sm:p-6 min-h-full'>
            <div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 min-h-[400px] border border-gray-100 overflow-hidden'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
                    <h2 className='text-2xl sm:text-3xl font-bold text-gray-800'>Mijozdan qarzdorlik</h2>
                </div>

                {/* Filters Bar */}
                <div className='flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-2 mb-4'>
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
                            className='h-8 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 flex items-center gap-1.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200'
                        >
                            <Search size={14} />
                            <span>Filter</span>
                        </button>
                        {isFiltered && (
                            <button
                                onClick={handleClearFilters}
                                className='h-8 px-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 flex items-center gap-1.5 text-sm font-medium border border-gray-200 transition-all duration-200'
                                title='Filterlarni tozalash'
                            >
                                <FilterX size={14} />
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
                        <table className='w-full border-collapse text-sm'>
                            <thead>
                                <tr className='border-b-2 border-blue-200 bg-blue-50/50'>
                                    <th className='text-left p-2 font-semibold text-gray-700 whitespace-nowrap w-12'>
                                        t/r
                                    </th>
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>Sanasi</th>
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[120px]'>Mijoz</th>
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[120px]'>Xodim</th>
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
                                        Zakaz (summa)
                                    </th>
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
                                        To'langan
                                    </th>
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[80px]'>Qarz</th>
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[90px]'>
                                        Umumiy qarz
                                    </th>
                                    <th className='text-left p-2 font-semibold text-gray-700 w-28'>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.length === 0 || groups.every((g) => (g.items?.length || 0) === 0) ? (
                                    <tr>
                                        <td colSpan={9} className='text-center py-12 text-gray-400'>
                                            Ma'lumotlar yo'q
                                        </td>
                                    </tr>
                                ) : (
                                    (() => {
                                        let rowIndex = 0;
                                        return groups.map((group, gIdx) => {
                                            const items = (group.items || []).filter((o: any) => !o.is_delete);
                                            const sumZakaz = items.reduce(
                                                (s: number, o: any) =>
                                                    s + (parseFloat(o.all_product_summa || '0') || 0),
                                                0,
                                            );
                                            const sumTolangan = items.reduce(
                                                (s: number, o: any) => s + tolovSummasi(o as OrderResponse),
                                                0,
                                            );
                                            return (
                                                <Fragment key={`group-${group.date ?? gIdx}`}>
                                                    <tr className='bg-gray-100'>
                                                        <td className='p-2'></td>
                                                        <td className='px-2 py-1 font-semibold text-gray-700'>
                                                            {group.date
                                                                ? format(new Date(group.date), 'yyyy-MM-dd')
                                                                : 'Barcha sanalar'}
                                                        </td>
                                                        <td className='p-2' />
                                                        <td className='p-2' />
                                                        <td className='p-2 text-left font-semibold text-blue-700'>
                                                            {sumZakaz.toLocaleString()}
                                                        </td>
                                                        <td className='p-2 text-left font-semibold'>
                                                            {sumTolangan.toLocaleString()}
                                                        </td>
                                                        <td className='p-2' />
                                                        <td className='p-2' />
                                                        <td className='p-2' />
                                                    </tr>

                                                    {items.map((order: any) => {
                                                        const isKarzinka = order.is_karzinka;
                                                        const orderPath = isKarzinka
                                                            ? `/order/${order.id}`
                                                            : `/order/show/${order.id}`;
                                                        const tolangan = tolovSummasi(order as OrderResponse);
                                                        const index = ++rowIndex;
                                                        return (
                                                            <tr
                                                                key={order.id}
                                                                className={clsx(
                                                                    'border-b border-gray-100 group hover:bg-blue-50/30 transition-colors',
                                                                    {
                                                                        'bg-red-300': !order.order_status,
                                                                    },
                                                                )}
                                                            >
                                                                <td className='text-left p-2 text-gray-500 font-mono'>
                                                                    {index}
                                                                </td>
                                                                <td className='text-left p-2 text-gray-600 whitespace-nowrap'>
                                                                    {order.created_time
                                                                        ? new Date(order.created_time).toLocaleString(
                                                                            'uz-UZ',
                                                                            {
                                                                                day: '2-digit',
                                                                                month: '2-digit',
                                                                                year: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit',
                                                                            },
                                                                        )
                                                                        : order.date
                                                                            ? new Date(order.date).toLocaleString(
                                                                                'uz-UZ',
                                                                                {
                                                                                    day: '2-digit',
                                                                                    month: '2-digit',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                },
                                                                            )
                                                                            : '—'}
                                                                </td>
                                                                <td className='p-2 text-left text-gray-800'>
                                                                    <span className='font-medium text-gray-800'>
                                                                        {order.client_detail?.full_name ||
                                                                            `ID: ${order.client}`}
                                                                    </span>
                                                                </td>
                                                                <td className='p-2 text-left text-gray-600'>
                                                                    {order.created_by_detail?.full_name ??
                                                                        order.employee ??
                                                                        '—'}
                                                                </td>
                                                                <td className='p-2 text-left font-medium text-blue-700'>
                                                                    {parseFloat(
                                                                        order.all_product_summa || '0',
                                                                    ).toLocaleString()}
                                                                </td>
                                                                <td className='p-2 text-left text-gray-700'>
                                                                    {tolangan.toLocaleString()}
                                                                </td>
                                                                <td className='p-2 text-left text-gray-700'>
                                                                    {parseFloat(
                                                                        order.total_debt_today_client || '0',
                                                                    ).toLocaleString()}
                                                                </td>
                                                                <td className='p-2 text-left text-gray-700'>
                                                                    {parseFloat(
                                                                        order.total_debt_client || '0',
                                                                    ).toLocaleString()}
                                                                </td>
                                                                <td className='p-2 text-center group-hover:bg-blue-50/30 transition-colors'>
                                                                    {/* View button only */}
                                                                    <button
                                                                        onClick={() => navigate(orderPath)}
                                                                        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0 ${isKarzinka
                                                                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                                                            }`}
                                                                        title={
                                                                            isKarzinka ? 'Davom etish' : "Ko'rish"
                                                                        }
                                                                    >
                                                                        {isKarzinka ? (
                                                                            <ArrowRight size={18} />
                                                                        ) : (
                                                                            <Eye size={18} />
                                                                        )}
                                                                    </button>
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
                                <tr className='bg-blue-50'>
                                    <td className='p-2 text-left font-semibold'>Jami</td>
                                    <td colSpan={2} />
                                    <td />
                                    <td className='p-2 text-left font-semibold text-blue-700'>
                                        {overallTotals.totalZakaz.toLocaleString()}
                                    </td>
                                    <td className='p-2 text-left font-semibold'>
                                        {overallTotals.totalTolangan.toLocaleString()}
                                    </td>
                                    <td colSpan={3} />
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}
