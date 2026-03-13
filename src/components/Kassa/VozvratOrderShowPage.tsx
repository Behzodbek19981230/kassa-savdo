import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { vozvratOrderService } from '../../services/orderService';
import { showError } from '../../lib/toast';
import { useExchangeRate } from '../../contexts/ExchangeRateContext';
import { formatMoney } from '../../lib/utils';

interface ProductByModel {
    model_id: number;
    model: string;
    product: any[];
}

interface VozvratOrderProductsByModelResponse {
    vozvrat_order: any;
    products: ProductByModel[];
}

export function VozvratOrderShowPage() {
    const { id } = useParams<{ id: string }>();
    const { displayRate } = useExchangeRate();
    const [data, setData] = useState<VozvratOrderProductsByModelResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                // Vozvrat order ma'lumotlarini olish
                const vozvratOrder = await vozvratOrderService.getVozvratOrder(parseInt(id));

                // Vozvrat order productlarini olish
                const products = await vozvratOrderService.getVozvratOrderProducts(parseInt(id));

                // Productlarni model bo'yicha guruhlash
                const productsByModel: { [key: number]: { model_id: number; model: string; product: any[] } } = {};

                products.forEach((product: any) => {
                    const modelId = product.model || product.model_detail?.id || 0;
                    const modelName = product.model_detail?.name || "Noma'lum model";

                    if (!productsByModel[modelId]) {
                        productsByModel[modelId] = {
                            model_id: modelId,
                            model: modelName,
                            product: [],
                        };
                    }

                    productsByModel[modelId].product.push(product);
                });

                setData({
                    vozvrat_order: vozvratOrder,
                    products: Object.values(productsByModel),
                });
            } catch (error: any) {
                console.error('Failed to load vozvrat order data:', error);
                const errorMessage =
                    error?.response?.data?.detail || error?.message || "Ma'lumotlarni yuklashda xatolik";
                showError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (isLoading) {
        return (
            <div className='flex items-center justify-center h-full'>
                <Loader2 className='w-8 h-7 animate-spin text-indigo-600' />
            </div>
        );
    }

    if (!data) {
        return <div className='p-6 text-center text-gray-500'>Ma'lumotlar topilmadi</div>;
    }

    const { vozvrat_order, products } = data;
    const usdRate = vozvrat_order?.exchange_rate != null ? Number(vozvrat_order.exchange_rate) : displayRate;

    return (
        <div className='h-full overflow-y-auto p-4 sm:p-6'>
            {/* Vozvrat Order Ma'lumotlari */}
            <div className='bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4'>
                <div className='flex items-center justify-between mb-3 pb-2 border-b border-gray-200'>
                    <h2 className='text-lg sm:text-xl font-bold text-gray-800'>Tovar qaytarish #{vozvrat_order.id}</h2>
                    <div
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${vozvrat_order.is_karzinka ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                            }`}
                    >
                        {vozvrat_order.is_karzinka ? 'Karzinka' : 'Yakunlangan'}
                    </div>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3'>
                    {/* Mijoz ma'lumotlari */}
                    <div className='bg-blue-50 p-2 rounded border border-blue-200'>
                        <p className='text-[10px] font-semibold text-blue-600 mb-1 uppercase tracking-wide'>Mijoz</p>
                        <p className='font-bold text-gray-800 text-sm mb-0.5'>
                            {vozvrat_order.client_detail?.full_name || "Noma'lum"}
                        </p>
                        <p className='text-xs text-gray-600'>{vozvrat_order.client_detail?.phone_number || ''}</p>
                        {vozvrat_order.client_detail?.total_debt &&
                            Number(vozvrat_order.client_detail.total_debt) > 0 && (
                                <p className='text-[10px] text-red-600 font-semibold mt-0.5'>
                                    Qarz: {formatMoney(Number(vozvrat_order.client_detail.total_debt))}
                                </p>
                            )}
                    </div>

                    {/* Sana va vaqt */}
                    <div className='bg-purple-50 p-2 rounded border border-purple-200'>
                        <p className='text-[10px] font-semibold text-purple-600 mb-1 uppercase tracking-wide'>
                            Sana va vaqt
                        </p>
                        {vozvrat_order.date ? (
                            <>
                                <p className='font-bold text-gray-800 text-sm'>
                                    {new Date(vozvrat_order.date)
                                        .toLocaleDateString('ru-RU', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                        })
                                        .replace(/\//g, '.')}
                                </p>
                            </>
                        ) : (
                            <p className='font-bold text-gray-800 text-sm'>Noma'lum</p>
                        )}
                    </div>





                    {/* Jami summa */}
                    <div className='bg-indigo-50 p-2 rounded border-2 border-indigo-300'>
                        <p className='text-[10px] font-semibold text-indigo-600 mb-1 uppercase tracking-wide'>
                            Jami summa
                        </p>
                        <p className='font-bold text-indigo-700 text-base mb-0.5'>
                            {formatMoney(Number(vozvrat_order.summa_total_dollar || 0) * usdRate)} UZS
                        </p>
                        <p className='text-xs font-semibold text-indigo-600'>
                            {Number(vozvrat_order.summa_total_dollar || 0).toFixed(2)} USD
                        </p>
                    </div>

                    {/* Chegirma */}
                    {Number(vozvrat_order.discount_amount || 0) > 0 && (
                        <div className='bg-rose-50 p-2 rounded border border-rose-200'>
                            <p className='text-[10px] font-semibold text-rose-600 mb-1 uppercase tracking-wide'>
                                Chegirma
                            </p>
                            <p className='font-bold text-rose-700 text-base'>
                                {formatMoney(Number(vozvrat_order.discount_amount || 0))} UZS
                            </p>
                        </div>
                    )}

                    {/* To'lov usullari */}
                    {(Number(vozvrat_order.summa_naqt || 0) > 0 ||
                        Number(vozvrat_order.summa_dollar || 0) > 0 ||
                        Number(vozvrat_order.summa_transfer || 0) > 0 ||
                        Number(vozvrat_order.summa_terminal || 0) > 0) && (
                            <div className='bg-violet-50 p-2 rounded border border-violet-200 md:col-span-2 lg:col-span-3 xl:col-span-5'>
                                <p className='text-[10px] font-semibold text-violet-600 mb-2 uppercase tracking-wide'>
                                    To'lov usullari
                                </p>
                                <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                                    {Number(vozvrat_order.summa_naqt || 0) > 0 && (
                                        <div className='bg-white p-2 rounded border border-violet-100'>
                                            <p className='text-[10px] text-gray-500 mb-0.5'>Naqd</p>
                                            <p className='font-bold text-gray-800 text-xs'>
                                                {formatMoney(Number(vozvrat_order.summa_naqt))} UZS
                                            </p>
                                        </div>
                                    )}
                                    {Number(vozvrat_order.summa_dollar || 0) > 0 && (
                                        <div className='bg-white p-2 rounded border border-violet-100'>
                                            <p className='text-[10px] text-gray-500 mb-0.5'>USD naqd</p>
                                            <p className='font-bold text-gray-800 text-xs'>
                                                {Number(vozvrat_order.summa_dollar).toFixed(2)} USD
                                            </p>
                                            <p className='text-[10px] text-gray-600 mt-0.5'>
                                                ({Number(vozvrat_order.summa_dollar) * usdRate} UZS)
                                            </p>
                                        </div>
                                    )}
                                    {Number(vozvrat_order.summa_transfer || 0) > 0 && (
                                        <div className='bg-white p-2 rounded border border-violet-100'>
                                            <p className='text-[10px] text-gray-500 mb-0.5'>Transfer</p>
                                            <p className='font-bold text-gray-800 text-xs'>
                                                {formatMoney(Number(vozvrat_order.summa_transfer))} UZS
                                            </p>
                                        </div>
                                    )}
                                    {Number(vozvrat_order.summa_terminal || 0) > 0 && (
                                        <div className='bg-white p-2 rounded border border-violet-100'>
                                            <p className='text-[10px] text-gray-500 mb-0.5'>Terminal</p>
                                            <p className='font-bold text-gray-800 text-xs'>
                                                {formatMoney(Number(vozvrat_order.summa_terminal))} UZS
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    {/* Izoh */}
                    {vozvrat_order.note && (
                        <div className='bg-slate-50 p-2 rounded border border-slate-200 md:col-span-2 lg:col-span-3 xl:col-span-5'>
                            <p className='text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide'>
                                Izoh
                            </p>
                            <p className='text-xs text-gray-800 whitespace-pre-wrap'>{vozvrat_order.note}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Productlar - Model bo'yicha guruhlangan */}
            {products.length > 0 && (
                <div className='bg-white rounded-lg shadow-md overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='w-full border-collapse text-sm'>
                            <thead>
                                <tr className='bg-gray-50 border-b border-gray-200'>
                                    <th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
                                        #
                                    </th>
                                    <th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
                                        Joyi
                                    </th>
                                    <th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
                                        Model
                                    </th>
                                    <th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
                                        Nomi
                                    </th>
                                    <th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
                                        O'lchami
                                    </th>
                                    <th className='px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
                                        Tip
                                    </th>
                                    <th className='px-3 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
                                        Soni
                                    </th>
                                    <th className='px-3 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
                                        Narxi ($)
                                    </th>
                                    <th className='px-3 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
                                        Jami ($)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((group) => {
                                    let productIndex = 0;
                                    const groupTotal = {
                                        count: 0,
                                        price_dollar: 0,
                                    };

                                    return (
                                        <>
                                            {/* Model Header */}
                                            <tr
                                                key={`header-${group.model_id}`}
                                                className='bg-blue-100 border-b border-blue-200'
                                            >
                                                <td
                                                    colSpan={9}
                                                    className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-blue-800'
                                                >
                                                    {group.model}
                                                </td>
                                            </tr>

                                            {/* Products */}
                                            {group.product.map((product) => {
                                                productIndex++;
                                                const priceDollar = Number(product.price_dollar || 0);
                                                const count = Number(product.count || 0);
                                                const totalPrice = priceDollar * count;

                                                groupTotal.count += count;
                                                groupTotal.price_dollar += totalPrice;

                                                return (
                                                    <tr
                                                        key={product.id}
                                                        className='border-b border-gray-100 hover:bg-gray-50 transition-colors even:bg-gray-100'
                                                    >
                                                        <td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-600'>
                                                            {productIndex}
                                                        </td>
                                                        <td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800'>
                                                            {product.sklad_detail?.name || 'Ombor'}
                                                        </td>
                                                        <td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800'>
                                                            {group.model}
                                                        </td>
                                                        <td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800'>
                                                            {product.branch_category_detail?.name ||
                                                                product.type_detail?.name ||
                                                                '-'}
                                                        </td>
                                                        <td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800'>
                                                            {product.size_detail?.size || '-'}
                                                        </td>
                                                        <td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800'>
                                                            {product.type_detail?.name || '-'}
                                                        </td>
                                                        <td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800 text-right'>
                                                            {count}
                                                        </td>
                                                        <td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800 text-right'>
                                                            {priceDollar.toFixed(2)}
                                                        </td>
                                                        <td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800 text-right'>
                                                            {totalPrice.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {/* Group Total */}
                                            <tr className='bg-gray-100 border-b-2 border-gray-300'>
                                                <td
                                                    colSpan={6}
                                                    className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-semibold text-gray-700'
                                                >
                                                    Jami:
                                                </td>
                                                <td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-semibold text-gray-700 text-right'>
                                                    {groupTotal.count}
                                                </td>
                                                <td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-semibold text-gray-700 text-right'>
                                                    -
                                                </td>
                                                <td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-semibold text-gray-700 text-right'>
                                                    {groupTotal.price_dollar.toFixed(2)}
                                                </td>
                                            </tr>
                                        </>
                                    );
                                })}

                                {/* Grand Total */}
                                <tr className='bg-gray-300 border-t-2 border-gray-400'>
                                    <td
                                        colSpan={6}
                                        className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-gray-800'
                                    >
                                        Jami:
                                    </td>
                                    <td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-gray-800 text-right'>
                                        {products.reduce(
                                            (sum, g) => sum + g.product.reduce((s, p) => s + Number(p.count || 0), 0),
                                            0,
                                        )}
                                    </td>
                                    <td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-gray-800 text-right'>
                                        -
                                    </td>
                                    <td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-gray-800 text-right'>
                                        {products
                                            .reduce(
                                                (sum, g) =>
                                                    sum +
                                                    g.product.reduce(
                                                        (s, p) =>
                                                            s + Number(p.price_dollar || 0) * Number(p.count || 0),
                                                        0,
                                                    ),
                                                0,
                                            )
                                            .toFixed(2)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
