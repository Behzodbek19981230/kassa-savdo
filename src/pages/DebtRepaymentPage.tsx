import { useState, useEffect, useRef } from 'react';
import { Loader2, Plus, Trash2, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { debtRepaymentService } from '../services/orderService';
import { showError, showSuccess } from '../lib/toast';
import { useAuth } from '../contexts/AuthContext';
import { DebtRepaymentModal } from '../components/Kassa/DebtRepaymentModal';
import { DebtRepaymentReceipt } from '../components/Kassa/DebtRepaymentReceipt';

export function DebtRepaymentPage() {
    const { user } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, [page]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const response = await debtRepaymentService.getDebtRepayments({
                page,
                page_size: 50,
                filial: user?.order_filial || undefined,
            });
            setData(response.results || []);
            setTotalCount(response.count || 0);
        } catch (error: any) {
            console.error('Failed to load debt repayments:', error);
            showError('Ma\'lumotlarni yuklashda xatolik');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Qarz to\'lovini o\'chirishni tasdiqlaysizmi?')) return;
        try {
            await debtRepaymentService.deleteDebtRepayment(id);
            showSuccess('Qarz to\'lovi muvaffaqiyatli o\'chirildi');
            loadData();
        } catch (error: any) {
            console.error('Failed to delete debt repayment:', error);
            showError('O\'chirishda xatolik');
        }
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

    const totalPages = Math.ceil(totalCount / 50);

    return (
        <div className='h-full flex flex-col p-4 sm:p-6'>
            <div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 min-h-[400px] border border-gray-100 overflow-hidden flex-1 flex flex-col'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
                    <h2 className='text-2xl sm:text-3xl font-bold text-gray-800'>Qarzlar</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className='px-4 sm:px-5 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] font-semibold'
                    >
                        <Plus size={18} className='mr-2' />
                        <span className='hidden sm:inline'>Qarz to'lash</span>
                        <span className='sm:hidden'>Qarz to'lash</span>
                    </button>
                </div>

                {/* Table */}
                <div className='flex-1 overflow-x-auto'>
                    {isLoading ? (
                        <div className='flex justify-center items-center h-64'>
                            <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
                        </div>
                    ) : (
                        <table className='w-full border-collapse text-sm'>
                            <thead>
                                <tr className='border-b-2 border-blue-200 bg-blue-50/50'>
                                    <th className='text-left p-2 font-semibold text-gray-700 whitespace-nowrap w-12'>
                                        t/r
                                    </th>
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
                                        Sanasi
                                    </th>
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[120px]'>
                                        Mijoz
                                    </th>
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
                                        Eski qarz
                                    </th>
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
                                        Yangi qarz
                                    </th>
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
                                        To'landi
                                    </th>
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[110px]'>
                                        Status
                                    </th>
                                    <th className='text-left p-2 font-semibold text-gray-700 w-28'>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className='text-center py-12 text-gray-400'>
                                            Ma'lumotlar yo'q
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item, index) => {
                                        const paidAmount =
                                            Number(item.summa_naqt || 0) +
                                            Number(item.summa_dollar || 0) * Number(item.exchange_rate || 1) +
                                            Number(item.summa_transfer || 0) +
                                            Number(item.summa_terminal || 0);

                                        return (
                                            <tr key={item.id} className='border-b border-gray-100 group hover:bg-blue-50/30 transition-colors'>
                                                <td className='p-2 text-gray-500 font-mono'>{(page - 1) * 50 + index + 1}</td>
                                                <td className='p-2 text-gray-600 whitespace-nowrap'>
                                                    {item.date
                                                        ? new Date(item.date).toLocaleDateString('ru-RU', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                        }).replace(/\//g, '.')
                                                        : '-'}
                                                </td>
                                                <td className='p-2'>
                                                    <span className='font-medium text-gray-800'>
                                                        {item.client_detail?.full_name || `ID: ${item.client}`}
                                                    </span>
                                                </td>
                                                <td className='p-2 text-gray-800 text-left'>
                                                    {Number(item.old_total_debt_client || 0).toLocaleString()} UZS
                                                </td>
                                                <td className='p-2 text-gray-800 text-left'>
                                                    {Number(item.total_debt_client || 0).toLocaleString()} UZS
                                                </td>
                                                <td className='p-2 font-semibold text-gray-900 text-left'>
                                                    {paidAmount.toLocaleString()} UZS
                                                </td>
                                                <td className='p-2'>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.debt_status
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {item.debt_status ? 'To\'langan' : 'Kutilmoqda'}
                                                    </span>
                                                </td>
                                                <td className='p-2'>
                                                    <div className='flex items-center gap-1'>
                                                        <button
                                                            onClick={() => handleDownload(item)}
                                                            className='p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors'
                                                            title="Yuklab olish"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className='p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors'
                                                            title="O'chirish"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className='border-t border-gray-200 px-4 py-3 flex items-center justify-between mt-auto'>
                        <div className='text-sm text-gray-700'>
                            Jami: {totalCount} ta
                        </div>
                        <div className='flex gap-2'>
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className='px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                            >
                                Oldingi
                            </button>
                            <span className='px-3 py-1.5 text-sm text-gray-700'>
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className='px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                            >
                                Keyingi
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Debt Repayment Modal */}
            <DebtRepaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    loadData();
                }}
            />

            {/* Hidden Receipt for Printing */}
            {selectedItem && (
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                    <div ref={receiptRef}>
                        <DebtRepaymentReceipt
                            date={selectedItem.date}
                            clientName={selectedItem.client_detail?.full_name || `ID: ${selectedItem.client}`}
                            filialName={selectedItem.filial_detail?.name || user?.order_filial_detail?.name || 'Elegant'}
                            exchangeRate={Number(selectedItem.exchange_rate || 12350)}
                            filialAddress={selectedItem.filial_detail?.address || user?.order_filial_detail?.address}
                            filialPhone={selectedItem.filial_detail?.phone_number || user?.order_filial_detail?.phone_number}
                            filialLogo={selectedItem.filial_detail?.logo || user?.order_filial_detail?.logo}
                            oldDebt={Number(selectedItem.old_total_debt_client || 0) / Number(selectedItem.exchange_rate || 12350)}
                            paidAmountDollar={Number(selectedItem.summa_dollar || 0)}
                            totalPaidAmountDollar={
                                (Number(selectedItem.summa_naqt || 0) +
                                    Number(selectedItem.summa_dollar || 0) * Number(selectedItem.exchange_rate || 12350) +
                                    Number(selectedItem.summa_transfer || 0) +
                                    Number(selectedItem.summa_terminal || 0)) / Number(selectedItem.exchange_rate || 12350)
                            }
                            remainingDebt={Number(selectedItem.total_debt_client || 0) / Number(selectedItem.exchange_rate || 12350)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
