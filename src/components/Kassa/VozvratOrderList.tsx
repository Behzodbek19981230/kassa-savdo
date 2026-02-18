import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { vozvratOrderService } from '../../services/orderService';
import { showError, showSuccess } from '../../lib/toast';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

export function VozvratOrderList() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<{
        currentPage: number;
        lastPage: number;
        perPage: number;
        total: number;
    } | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, [page]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const response = await vozvratOrderService.getVozvratOrders({
                page,
                page_size: 50,
                filial: user?.order_filial || undefined,
            });
            setData(response.results || []);
            // Response dan pagination yoki count orqali pagination yaratish
            const responseData = response as any;
            if (responseData.pagination) {
                setPagination(responseData.pagination);
            } else {
                // Fallback pagination
                setPagination({
                    currentPage: page,
                    lastPage: Math.ceil((response.count || 0) / 50),
                    perPage: 50,
                    total: response.count || 0,
                });
            }
        } catch (error: any) {
            console.error('Failed to load vozvrat orders:', error);
            showError("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tovar qaytarishni o\'chirishni tasdiqlaysizmi?')) return;
        setDeletingId(id);
        try {
            await vozvratOrderService.deleteVozvratOrder(id);
            showSuccess('Tovar qaytarish muvaffaqiyatli o\'chirildi');
            loadData();
        } catch (error: any) {
            console.error('Failed to delete vozvrat order:', error);
            showError('O\'chirishda xatolik');
        } finally {
            setDeletingId(null);
        }
    };

    const handleView = (id: number) => {
        navigate(`/tovar-qaytarish/show/${id}`);
    };

    const handleEdit = (id: number) => {
        navigate(`/tovar-qaytarish/${id}`);
    };

    const handleNewReturn = () => {
        // Yangi vozvrat order yaratish uchun KassaPage ochiladi
        navigate('/tovar-qaytarish/new');
    };

    return (
        <div className='h-full flex flex-col p-4 sm:p-6'>
            <div className='bg-white rounded-2xl shadow-xl p-4 sm:p-6 min-h-[400px] border border-gray-100 overflow-hidden flex-1 flex flex-col'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
                    <h2 className='text-2xl sm:text-3xl font-bold text-gray-800'>Tovar qaytarish</h2>
                    <button
                        onClick={handleNewReturn}
                        className='px-4 sm:px-5 py-2.5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] font-semibold'
                    >
                        <Plus size={18} className='mr-2' />
                        <span className='hidden sm:inline'>Qaytarish</span>
                        <span className='sm:hidden'>Qaytarish</span>
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
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[120px]'>
                                        Telefon
                                    </th>
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[100px]'>
                                        Jami ($)
                                    </th>
                                    <th className='text-left p-2 font-semibold text-gray-700 min-w-[110px]'>
                                        Holati
                                    </th>
                                    <th className='text-left p-2 font-semibold text-gray-700 w-28'>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className='text-center py-12 text-gray-400'>
                                            Ma'lumotlar yo'q
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item, index) => (
                                        <tr key={item.id} className='border-b border-gray-100 group hover:bg-blue-50/30 transition-colors'>
                                            <td className='p-2 text-gray-500 font-mono'>{(page - 1) * 50 + index + 1}</td>
                                            <td className='p-2 text-gray-600 whitespace-nowrap'>
                                                {item.date ? format(new Date(item.date), 'dd.MM.yyyy') : '-'}
                                            </td>
                                            <td className='p-2'>
                                                <span className='font-medium text-gray-800'>
                                                    {item.client_detail?.full_name || '-'}
                                                </span>
                                            </td>
                                            <td className='p-2 text-gray-800'>
                                                {item.client_detail?.phone_number || '-'}
                                            </td>
                                            <td className='p-2 font-semibold text-gray-900'>
                                                {parseFloat(item.summa_total_dollar || '0').toFixed(2)}
                                            </td>
                                            <td className='p-2'>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${item.is_karzinka
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-green-100 text-green-700'
                                                        }`}
                                                >
                                                    {item.is_karzinka ? 'Korzinkada' : 'Yakunlangan'}
                                                </span>
                                            </td>
                                            <td className='p-2'>
                                                <div className='flex items-center gap-1'>
                                                    <button
                                                        onClick={() => handleView(item.id)}
                                                        className='p-1.5 rounded hover:bg-indigo-100 text-indigo-600 transition-colors'
                                                        title="Ko'rish"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    {item.is_karzinka && (
                                                        <button
                                                            onClick={() => handleEdit(item.id)}
                                                            className='p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors'
                                                            title='Tahrirlash'
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        disabled={deletingId === item.id}
                                                        className='p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50'
                                                        title="O'chirish"
                                                    >
                                                        {deletingId === item.id ? (
                                                            <Loader2 size={16} className='animate-spin' />
                                                        ) : (
                                                            <Trash2 size={16} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {pagination && pagination.lastPage > 1 && (
                    <div className='border-t border-gray-200 px-4 py-3 flex items-center justify-between mt-auto'>
                        <div className='text-sm text-gray-700'>
                            Jami: {pagination.total} ta
                        </div>
                        <div className='flex gap-2'>
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={pagination.currentPage === 1}
                                className='px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                            >
                                Oldingi
                            </button>
                            <span className='px-3 py-1.5 text-sm text-gray-700'>
                                {pagination.currentPage} / {pagination.lastPage}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.lastPage || 1, p + 1))}
                                disabled={pagination.currentPage === pagination.lastPage}
                                className='px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                            >
                                Keyingi
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
