import { useState, useRef, Fragment, useMemo } from 'react';
import { Loader2, Plus, Trash2, Download, Search, RotateCcw } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { DateRangePicker } from '../components/ui/date-picker';
import { Autocomplete } from '../components/ui/Autocomplete';
import { clientService } from '../services/clientService';
import { userService } from '../services/userService';
import { debtRepaymentService } from '../services/orderService';
import { showError, showSuccess } from '../lib/toast';
import { useAuth } from '../contexts/AuthContext';
import { DebtRepaymentModal } from '../components/Kassa/DebtRepaymentModal';
import { DebtRepaymentReceipt } from '../components/Kassa/DebtRepaymentReceipt';

export function DebtRepaymentPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const [draftDateFrom, setDraftDateFrom] = useState<Date | undefined>(oneMonthAgo);
    const [draftDateTo, setDraftDateTo] = useState<Date | undefined>(today);
    const [appliedDateFrom, setAppliedDateFrom] = useState<Date | undefined>(oneMonthAgo);
    const [appliedDateTo, setAppliedDateTo] = useState<Date | undefined>(today);

    // Filters: client and employee
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
    const [clientOptions, setClientOptions] = useState<{ id: string; label: string; value: string }[]>([]);
    const [employeeOptions, setEmployeeOptions] = useState<{ id: string; label: string; value: string }[]>([]);
    const [appliedClientId, setAppliedClientId] = useState<number | null>(null);
    const [appliedEmployeeId, setAppliedEmployeeId] = useState<number | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    // React Query bilan ma'lumotlarni olish
    const {
        data: groupedData,
        isLoading,
        error,
    } = useQuery({
        queryKey: [
            'debt-repayments-grouped',
            {
                filial: user?.order_filial,
                dateFrom: appliedDateFrom ? format(appliedDateFrom, 'yyyy-MM-dd') : undefined,
                dateTo: appliedDateTo ? format(appliedDateTo, 'yyyy-MM-dd') : undefined,
                client: appliedClientId ?? undefined,
                employee: appliedEmployeeId ?? undefined,
            },
        ],
        queryFn: () =>
            debtRepaymentService.getDebtRepaymentsGroupedByDate({
                filial: user?.order_filial || undefined,
                date_from: appliedDateFrom ? format(appliedDateFrom, 'yyyy-MM-dd') : undefined,
                date_to: appliedDateTo ? format(appliedDateTo, 'yyyy-MM-dd') : undefined,
                client: appliedClientId ?? undefined,
                employee: appliedEmployeeId ?? undefined,
            }),
        staleTime: 30000, // 30 soniya
        enabled: !!user?.order_filial,
    });
    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: number) => debtRepaymentService.deleteDebtRepayment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['debt-repayments-grouped'] });
            showSuccess("Qarz to'lovi muvaffaqiyatli o'chirildi");
        },
        onError: (error: any) => {
            console.error('Failed to delete debt repayment:', error);
            showError("O'chirishda xatolik");
        },
    });

    const groups = groupedData || [];

    // Overall totals hisoblash
    const overallTotals = useMemo(() => {
        let totalCount = 0;
        let totalPaid = 0;
        let totalOldDebt = 0;
        let totalNewDebt = 0;

        for (const group of groups) {
            const items = group.items || [];
            totalCount += items.length;
            for (const item of items) {
                const paidAmount =
                    Number(item.summa_naqt || 0) +
                    Number(item.summa_dollar || 0) * Number(item.exchange_rate || 1) +
                    Number(item.summa_transfer || 0) +
                    Number(item.summa_terminal || 0);
                totalPaid += paidAmount;
                totalOldDebt += Number(item.old_total_debt_client || 0);
                totalNewDebt += Number(item.total_debt_client || 0);
            }
        }

        return { totalCount, totalPaid, totalOldDebt, totalNewDebt };
    }, [groups]);

    const handleDelete = async (id: number) => {
        if (!confirm("Qarz to'lovini o'chirishni tasdiqlaysizmi?")) return;
        deleteMutation.mutate(id);
    };

    const handleDownload = (item: any) => {
        setSelectedItem(item);
        // Small delay to ensure state is set before printing
        setTimeout(() => {
            if (receiptRef.current) {
                handlePrint();
            }
        }, 100);
    };

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Qarz-hisobi-${selectedItem?.id || 'unknown'}`,
        pageStyle: `
            @page {
                size: A4 landscape;
                margin: 10mm;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `,
    });

    const handleModalSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['debt-repayments-grouped'] });
    };

    const onSearchEmployeeQueryChange = async (q: string) => {
        const res = await userService.getUsers({ search: q || '', limit: 100 });
        const items = res.results || [];
        setEmployeeOptions(
            items.map((u: any) => ({
                id: String(u.id),
                label: u.full_name || u.username || `ID:${u.id}`,
                value: String(u.id),
            })),
        );
    };

    return (
        <div className='h-full flex flex-col p-2 sm:p-3'>
            <div className='bg-white rounded-xl shadow-xl p-2 sm:p-3 min-h-[400px] border border-gray-100 overflow-hidden flex-1 flex flex-col'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2'>
                    <h2 className='text-xl font-bold text-gray-800'>To'langan qarzlar</h2>
                    <div className='flex items-center gap-3'>
                        <DateRangePicker
                            dateFrom={draftDateFrom}
                            dateTo={draftDateTo}
                            onDateFromChange={(d) => setDraftDateFrom(d)}
                            onDateToChange={(d) => setDraftDateTo(d)}
                        />

                        <div className='w-56'>
                            <Autocomplete
                                options={clientOptions}
                                value={selectedClientId ? String(selectedClientId) : ''}
                                onChange={(v) => setSelectedClientId(v ? Number(v) : null)}
                                onSearchChange={async (q) => {
                                    const res = await clientService.getClients(q || '');
                                    const items = res.results || [];
                                    setClientOptions(
                                        items.map((c: any) => ({
                                            id: String(c.id),
                                            label: c.full_name || c.phone_number || `ID:${c.id}`,
                                            value: String(c.id),
                                        })),
                                    );
                                }}
                                placeholder="Mijoz bo'yicha filtrlash"
                            />
                        </div>

                        <div className='w-56'>
                            <Autocomplete
                                options={employeeOptions}
                                value={selectedEmployeeId ? String(selectedEmployeeId) : ''}
                                onChange={(v) => setSelectedEmployeeId(v ? Number(v) : null)}
                                onSearchChange={onSearchEmployeeQueryChange}
                                placeholder="Xodim bo'yicha filtrlash"
                            />
                        </div>

                        <div className='flex items-center gap-1.5'>
                            <button
                                onClick={() => {
                                    setAppliedDateFrom(draftDateFrom);
                                    setAppliedDateTo(draftDateTo);
                                    setAppliedClientId(selectedClientId);
                                    setAppliedEmployeeId(selectedEmployeeId);
                                }}
                                className='h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center'
                            >
                                <Search size={12} className='mr-1.5' />
                                <span>Filter</span>
                            </button>

                            <button
                                onClick={() => {
                                    const defaultFrom = oneMonthAgo;
                                    const defaultTo = today;
                                    setDraftDateFrom(defaultFrom);
                                    setDraftDateTo(defaultTo);
                                    setAppliedDateFrom(defaultFrom);
                                    setAppliedDateTo(defaultTo);
                                    setSelectedClientId(null);
                                    setSelectedEmployeeId(null);
                                    setAppliedClientId(null);
                                    setAppliedEmployeeId(null);
                                }}
                                className='h-7 px-2 bg-white text-gray-700 rounded-md text-xs font-medium border border-gray-200 flex items-center gap-1.5'
                            >
                                <RotateCcw size={12} />
                                <span>Tozalash</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className='px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-xs'
                        >
                            <Plus size={14} className='mr-1.5' />
                            <span className='hidden sm:inline'>Qarz to'lash</span>
                            <span className='sm:hidden'>Qarz to'lash</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className='flex-1 overflow-x-auto'>
                    {isLoading ? (
                        <div className='flex justify-center items-center h-64'>
                            <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
                        </div>
                    ) : error ? (
                        <div className='flex justify-center items-center h-64'>
                            <p className='text-red-600'>Ma'lumotlarni yuklashda xatolik yuz berdi</p>
                        </div>
                    ) : (
                        <table className='w-full border-collapse text-xs'>
                            <thead>
                                <tr className='border-b-2 border-blue-200 bg-blue-50/50'>
                                    <th className='text-left p-1 font-semibold text-gray-700 min-w-[110px] text-xs'>Sana</th>
                                    <th className='text-left p-1 font-semibold text-gray-700 whitespace-nowrap w-[60px] text-xs'>
                                        t/r
                                    </th>
                                    <th className='text-left p-1 font-semibold text-gray-700 min-w-[120px] text-xs'>Mijoz</th>
                                    <th className='text-left p-1 font-semibold text-gray-700 min-w-[120px] text-xs'>Xodim</th>
                                    <th className='text-left p-1 font-semibold text-gray-700 min-w-[100px] text-xs'>
                                        Eski qarz
                                    </th>
                                    <th className='text-left p-1 font-semibold text-gray-700 min-w-[100px] text-xs'>
                                        Yangi qarz
                                    </th>
                                    <th className='text-left p-1 font-semibold text-gray-700 min-w-[100px] text-xs'>
                                        To'landi
                                    </th>
                                    <th className='text-left p-1 font-semibold text-gray-700 min-w-[110px] text-xs'>Holati</th>
                                    <th className='text-left p-1 font-semibold text-gray-700 w-24 text-xs'>Amallar</th>
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
                                        return groups.map((group, gIdx) => {
                                            const items = group.items || [];
                                            return (
                                                <Fragment key={`group-${group.date ?? gIdx}`}>
                                                    {items.map((item: any, itemIdx: number) => {
                                                        const paidAmount =
                                                            Number(item.summa_naqt || 0) +
                                                            Number(item.summa_dollar || 0) *
                                                            Number(item.exchange_rate || 1) +
                                                            Number(item.summa_transfer || 0) +
                                                            Number(item.summa_terminal || 0);
                                                        const isFirstInGroup = itemIdx === 0;
                                                        const groupDate = group.date
                                                            ? format(new Date(group.date), 'dd.MM.yyyy')
                                                            : 'Barcha sanalar';
                                                        return (
                                                            <tr
                                                                key={item.id}
                                                                className='border-b border-gray-100 group hover:bg-blue-50/30 transition-colors even:bg-gray-100'
                                                            >
                                                                {isFirstInGroup ? (
                                                                    <td
                                                                        rowSpan={items.length}
                                                                        className='text-left p-1 font-semibold text-gray-700 text-xs align-top border-r border-gray-200'
                                                                    >
                                                                        {groupDate}
                                                                    </td>
                                                                ) : null}
                                                                <td className='p-1 text-gray-500 font-mono text-xs'>{group.items.length - itemIdx}</td>
                                                                <td className='p-1 text-xs'>
                                                                    <span className='font-medium text-gray-800'>
                                                                        {item.client_detail?.full_name ||
                                                                            `ID: ${item.client}`}
                                                                    </span>
                                                                </td>
                                                                <td className='p-1 text-xs'>
                                                                    <span className='font-medium text-gray-800'>
                                                                        {item.employee_detail?.full_name ||
                                                                            (item.employee
                                                                                ? `ID: ${item.employee}`
                                                                                : '-')}
                                                                    </span>
                                                                </td>
                                                                <td className='p-1 text-gray-800 text-left text-xs'>
                                                                    {Number(
                                                                        item.old_total_debt_client || 0,
                                                                    ).toLocaleString()}{' '}
                                                                    UZS
                                                                </td>
                                                                <td className='p-1 text-gray-800 text-left text-xs'>
                                                                    {Number(
                                                                        item.total_debt_client || 0,
                                                                    ).toLocaleString()}{' '}
                                                                    UZS
                                                                </td>
                                                                <td className='p-1 font-semibold text-gray-900 text-left text-xs'>
                                                                    {paidAmount.toLocaleString()} UZS
                                                                </td>
                                                                <td className='p-1'>
                                                                    <span
                                                                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${item.debt_status
                                                                            ? 'bg-green-100 text-green-700'
                                                                            : 'bg-yellow-100 text-yellow-700'
                                                                            }`}
                                                                    >
                                                                        {item.debt_status ? "To'langan" : 'Kutilmoqda'}
                                                                    </span>
                                                                </td>
                                                                <td className='p-1'>
                                                                    <div className='flex items-center gap-0.5'>
                                                                        <button
                                                                            onClick={() => handleDownload(item)}
                                                                            className='p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors'
                                                                            title='Yuklab olish'
                                                                        >
                                                                            <Download size={12} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDelete(item.id)}
                                                                            disabled={
                                                                                deleteMutation.isPending &&
                                                                                deleteMutation.variables === item.id
                                                                            }
                                                                            className='p-1 rounded hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50'
                                                                            title="O'chirish"
                                                                        >
                                                                            {deleteMutation.isPending &&
                                                                                deleteMutation.variables === item.id ? (
                                                                                <Loader2
                                                                                    size={12}
                                                                                    className='animate-spin'
                                                                                />
                                                                            ) : (
                                                                                <Trash2 size={12} />
                                                                            )}
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
                                {/* Overall totals row */}
                                {groups.length > 0 && overallTotals.totalCount > 0 && (
                                    <tr className='bg-blue-50'>
                                        <td className='p-1 font-semibold text-xs'>Jami</td>
                                        <td className='p-1' />
                                        <td className='p-1' />
                                        <td className='p-1' />

                                        <td className='p-1 text-left font-semibold text-blue-700 text-xs'>
                                            {overallTotals.totalOldDebt.toLocaleString()} UZS
                                        </td>
                                        <td className='p-1 text-left font-semibold text-blue-700 text-xs'>
                                            {overallTotals.totalNewDebt.toLocaleString()} UZS
                                        </td>
                                        <td className='p-1 text-left font-semibold text-green-700 text-xs'>
                                            {overallTotals.totalPaid.toLocaleString()} UZS
                                        </td>
                                        <td colSpan={3} />
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Debt Repayment Modal */}
            <DebtRepaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleModalSuccess}
            />

            {/* Hidden Receipt for Printing */}
            {selectedItem && (
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                    <div ref={receiptRef}>
                        <DebtRepaymentReceipt
                            date={selectedItem.date}
                            clientName={selectedItem.client_detail?.full_name || `ID: ${selectedItem.client}`}
                            filialName={
                                selectedItem.filial_detail?.name || user?.order_filial_detail?.name || 'Elegant'
                            }
                            exchangeRate={Number(selectedItem.exchange_rate || 12350)}
                            filialAddress={selectedItem.filial_detail?.address || user?.order_filial_detail?.address}
                            filialPhone={
                                selectedItem.filial_detail?.phone_number || user?.order_filial_detail?.phone_number
                            }
                            filialLogo={selectedItem.filial_detail?.logo || user?.order_filial_detail?.logo}
                            oldDebt={
                                Number(selectedItem.old_total_debt_client || 0) /
                                Number(selectedItem.exchange_rate || 12350)
                            }
                            paidAmountDollar={Number(selectedItem.summa_dollar || 0)}
                            totalPaidAmountDollar={
                                (Number(selectedItem.summa_naqt || 0) +
                                    Number(selectedItem.summa_dollar || 0) *
                                    Number(selectedItem.exchange_rate || 12350) +
                                    Number(selectedItem.summa_transfer || 0) +
                                    Number(selectedItem.summa_terminal || 0)) /
                                Number(selectedItem.exchange_rate || 12350)
                            }
                            remainingDebt={
                                Number(selectedItem.total_debt_client || 0) /
                                Number(selectedItem.exchange_rate || 12350)
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
