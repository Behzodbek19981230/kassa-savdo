import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Banknote, CreditCard } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { OrderResponse } from '../../types';
import { showError } from '../../lib/toast';
import { USD_RATE } from '../../constants';

interface ProductByModel {
	model_id: number;
	model: string;
	product: any[];
}

interface OrderProductsByModelResponse {
	order_history: OrderResponse;
	products: ProductByModel[];
}

export function OrderShowPage() {
	const { id } = useParams<{ id: string }>();
	const [data, setData] = useState<OrderProductsByModelResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			if (!id) return;
			setIsLoading(true);
			try {
				const response = await orderService.getOrderProductsByModel(parseInt(id));
				setData(response);
			} catch (error: any) {
				console.error('Failed to load order data:', error);
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
				<Loader2 className='w-8 h-8 animate-spin text-indigo-600' />
			</div>
		);
	}

	if (!data) {
		return <div className='p-6 text-center text-gray-500'>Ma'lumotlar topilmadi</div>;
	}

	const { order_history, products } = data;
	const usdRate = order_history?.exchange_rate != null ? Number(order_history.exchange_rate) : USD_RATE;
	const totalPaidUZS =
		Number(order_history.summa_naqt || 0) +
		Number(order_history.summa_dollar || 0) * usdRate +
		Number(order_history.summa_transfer || 0) +
		Number(order_history.summa_terminal || 0);
	const totalPaidUSD = usdRate ? totalPaidUZS / usdRate : 0;

	return (
		<div className='h-full overflow-y-auto p-4 sm:p-6'>
			{/* Order History Ma'lumotlari */}
			<div className='bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4'>
				<div className='flex items-center justify-between mb-3 pb-2 border-b border-gray-200'>
					<h2 className='text-lg sm:text-xl font-bold text-gray-800'>Order #{order_history.id}</h2>
					<div
						className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
							order_history.order_status ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
						}`}
					>
						{order_history.order_status ? 'Tugallangan' : 'Kutilmoqda'}
					</div>
				</div>

				<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3'>
					{/* Mijoz ma'lumotlari */}
					<div className='bg-gradient-to-br from-blue-50 to-indigo-50 p-2 rounded border border-blue-200'>
						<p className='text-[10px] font-semibold text-blue-600 mb-1 uppercase tracking-wide'>Mijoz</p>
						<p className='font-bold text-gray-800 text-sm mb-0.5'>
							{order_history.client_detail?.full_name || "Noma'lum"}
						</p>
						<p className='text-xs text-gray-600'>{order_history.client_detail?.phone_number || ''}</p>
						{order_history.client_detail?.total_debt &&
							Number(order_history.client_detail.total_debt) > 0 && (
								<p className='text-[10px] text-red-600 font-semibold mt-0.5'>
									Qarz: {Number(order_history.client_detail.total_debt).toLocaleString()}
								</p>
							)}
					</div>

					{/* Sana va vaqt */}
					<div className='bg-gradient-to-br from-purple-50 to-pink-50 p-2 rounded border border-purple-200'>
						<p className='text-[10px] font-semibold text-purple-600 mb-1 uppercase tracking-wide'>
							Sana va vaqt
						</p>
						{order_history.created_time ? (
							<>
								<p className='font-bold text-gray-800 text-sm'>
									{new Date(order_history.created_time)
										.toLocaleDateString('ru-RU', {
											year: 'numeric',
											month: '2-digit',
											day: '2-digit',
										})
										.replace(/\//g, '.')}
								</p>
								<p className='text-xs text-gray-600 mt-0.5'>
									{new Date(order_history.created_time).toLocaleTimeString('ru-RU', {
										hour: '2-digit',
										minute: '2-digit',
										second: '2-digit',
									})}
								</p>
							</>
						) : (
							<p className='font-bold text-gray-800 text-sm'>Noma'lum</p>
						)}
					</div>

					{/* Kassir */}
					<div className='bg-gradient-to-br from-green-50 to-emerald-50 p-2 rounded border border-green-200'>
						<p className='text-[10px] font-semibold text-green-600 mb-1 uppercase tracking-wide'>Kassir</p>
						<p className='font-bold text-gray-800 text-sm mb-0.5'>
							{order_history.created_by_detail?.full_name || "Noma'lum"}
						</p>
						<p className='text-xs text-gray-600'>{order_history.created_by_detail?.phone_number || ''}</p>
					</div>

					{/* Filial */}
					<div className='bg-gradient-to-br from-amber-50 to-orange-50 p-2 rounded border border-amber-200'>
						<p className='text-[10px] font-semibold text-amber-600 mb-1 uppercase tracking-wide'>Filial</p>
						<p className='font-bold text-gray-800 text-sm'>
							{order_history.order_filial_detail?.name || "Noma'lum"}
						</p>
					</div>

					{/* Valyuta kursi */}
					<div className='bg-gradient-to-br from-cyan-50 to-teal-50 p-2 rounded border border-cyan-200'>
						<p className='text-[10px] font-semibold text-cyan-600 mb-1 uppercase tracking-wide'>
							Valyuta kursi
						</p>
						<p className='font-bold text-gray-800 text-sm'>
							1 USD = {Number(usdRate).toLocaleString()} UZS
						</p>
					</div>

					{/* Status */}
					<div className='bg-gradient-to-br from-gray-50 to-slate-50 p-2 rounded border border-gray-200'>
						<p className='text-[10px] font-semibold text-gray-600 mb-1 uppercase tracking-wide'>Status</p>
						<div className='space-y-0.5'>
							<div className='flex items-center gap-1.5'>
								<span
									className={`w-1.5 h-1.5 rounded-full ${
										order_history.status_order_dukon ? 'bg-green-500' : 'bg-gray-300'
									}`}
								></span>
								<span className='text-xs text-gray-700'>
									Dukon: {order_history.status_order_dukon ? 'Tayyor' : 'Kutilmoqda'}
								</span>
							</div>
							<div className='flex items-center gap-1.5'>
								<span
									className={`w-1.5 h-1.5 rounded-full ${
										order_history.status_order_sklad ? 'bg-green-500' : 'bg-gray-300'
									}`}
								></span>
								<span className='text-xs text-gray-700'>
									Sklad: {order_history.status_order_sklad ? 'Tayyor' : 'Kutilmoqda'}
								</span>
							</div>
						</div>
					</div>

					{/* Jami summa */}
					<div className='bg-gradient-to-br from-indigo-50 to-blue-50 p-2 rounded border-2 border-indigo-300'>
						<p className='text-[10px] font-semibold text-indigo-600 mb-1 uppercase tracking-wide'>
							Jami summa
						</p>
						<p className='font-bold text-indigo-700 text-base mb-0.5'>
							{(Number(order_history.all_product_summa || 0) / usdRate).toFixed(2)} USD
						</p>
						<p className='text-xs font-semibold text-indigo-600'>
							{Number(order_history.all_product_summa || 0).toLocaleString()} UZS
						</p>
					</div>

					{/* Chegirma */}
					<div className='bg-gradient-to-br from-rose-50 to-red-50 p-2 rounded border border-rose-200'>
						<p className='text-[10px] font-semibold text-rose-600 mb-1 uppercase tracking-wide'>Chegirma</p>
						<p className='font-bold text-rose-700 text-base'>
							{Number(order_history.discount_amount || 0).toLocaleString()} UZS
						</p>
						{Number(order_history.discount_amount || 0) > 0 && (
							<p className='text-[10px] text-rose-600 mt-0.5'>
								{(
									(Number(order_history.discount_amount) /
										Number(order_history.all_product_summa || 1)) *
									100
								).toFixed(1)}
								%
							</p>
						)}
					</div>

					{/* To'lanishi kerak */}
					<div className='bg-gradient-to-br from-emerald-50 to-green-50 p-2 rounded border-2 border-emerald-300'>
						<p className='text-[10px] font-semibold text-emerald-600 mb-1 uppercase tracking-wide'>
							To'lanishi kerak
						</p>
						<p className='font-bold text-emerald-700 text-base mb-0.5'>
							{(
								(Number(order_history.all_product_summa || 0) -
									Number(order_history.discount_amount || 0)) /
								usdRate
							).toFixed(2)}{' '}
							USD
						</p>
						<p className='text-xs font-semibold text-emerald-600'>
							{(
								Number(order_history.all_product_summa || 0) -
								Number(order_history.discount_amount || 0)
							).toLocaleString()}{' '}
							UZS
						</p>
					</div>

					{/* To'lov usullari */}
					<div className='md:col-span-2 lg:col-span-3 xl:col-span-5'>
						<p className='text-[10px] font-semibold text-gray-600 mb-2 uppercase tracking-wide'>
							To'lov usullari
						</p>
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2'>
							{Number(order_history.summa_dollar || 0) > 0 && (
								<div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200'>
									<div className='bg-gradient-to-r from-green-700 to-emerald-800 text-white p-1.5 sm:p-2 flex justify-between items-center'>
										<div className='flex items-center space-x-1.5'>
											<div className='bg-green-100 p-1 rounded'>
												<Banknote className='text-green-700 w-3 h-3' />
											</div>
											<span className='font-medium text-[10px] sm:text-xs'>US dollar naqd</span>
										</div>
									</div>
									<div className='p-1.5 sm:p-2 bg-white'>
										<div className='text-right flex items-center justify-end gap-1'>
											<p className='font-semibold text-sm text-gray-800'>
												{Number(order_history.summa_dollar).toFixed(2)}
											</p>
											<span className='text-[10px] font-medium text-gray-500'>USD</span>
											<p className='text-[10px] text-gray-600 mt-0.5'>
												({Number(order_history.summa_dollar) * usdRate} UZS)
											</p>
										</div>
									</div>
								</div>
							)}
							{Number(order_history.summa_naqt || 0) > 0 && (
								<div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200'>
									<div className='bg-gradient-to-r from-lime-500 to-green-600 text-white p-1.5 sm:p-2 flex justify-between items-center'>
										<div className='flex items-center space-x-1.5'>
											<div className='bg-lime-100 p-1 rounded'>
												<Banknote className='text-lime-700 w-3 h-3' />
											</div>
											<span className='font-medium text-[10px] sm:text-xs'>Naqd</span>
										</div>
									</div>
									<div className='p-1.5 sm:p-2 bg-white'>
										<div className='text-right flex items-center justify-end gap-1'>
											<p className='font-semibold text-sm text-gray-800'>
												{Number(order_history.summa_naqt).toLocaleString()}
											</p>
											<span className='text-[10px] font-medium text-gray-500'>UZS</span>
										</div>
									</div>
								</div>
							)}

							{Number(order_history.summa_transfer || 0) > 0 && (
								<div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200'>
									<div className='bg-gradient-to-r from-blue-400 to-cyan-500 text-white p-1.5 sm:p-2 flex justify-between items-center'>
										<div className='flex items-center space-x-1.5'>
											<div className='bg-blue-100 p-1 rounded'>
												<CreditCard className='text-blue-700 w-3 h-3' />
											</div>
											<span className='font-medium text-[10px] sm:text-xs'>Plastik perevod</span>
										</div>
									</div>
									<div className='p-1.5 sm:p-2 bg-white'>
										<div className='text-right flex items-center justify-end gap-1'>
											<p className='font-semibold text-sm text-gray-800'>
												{Number(order_history.summa_transfer).toLocaleString()}
											</p>
											<span className='text-[10px] font-medium text-gray-500'>UZS</span>
										</div>
									</div>
								</div>
							)}
							{Number(order_history.summa_terminal || 0) > 0 && (
								<div className='border rounded-lg overflow-hidden shadow-sm border-indigo-200'>
									<div className='bg-gradient-to-r from-blue-400 to-cyan-500 text-white p-1.5 sm:p-2 flex justify-between items-center'>
										<div className='flex items-center space-x-1.5'>
											<div className='bg-blue-100 p-1 rounded'>
												<CreditCard className='text-blue-700 w-3 h-3' />
											</div>
											<span className='font-medium text-[10px] sm:text-xs'>Terminal</span>
										</div>
									</div>
									<div className='p-1.5 sm:p-2 bg-white'>
										<div className='text-right flex items-center justify-end gap-1'>
											<p className='font-semibold text-sm text-gray-800'>
												{Number(order_history.summa_terminal).toLocaleString()}
											</p>
											<span className='text-[10px] font-medium text-gray-500'>UZS</span>
										</div>
									</div>
								</div>
							)}
						</div>
						<div className='mt-2 pt-2 border-t border-gray-200'>
							<div className='flex items-center justify-between gap-3'>
								<span className='text-sm sm:text-base font-semibold text-gray-700'>Jami to'landi:</span>
								<div className='text-right'>
									<div className='font-bold text-lg sm:text-xl text-indigo-700'>
										{totalPaidUSD ? totalPaidUSD.toFixed(2) : '0.00'} USD
									</div>
									<div className='text-sm sm:text-base text-gray-500'>
										{totalPaidUZS.toLocaleString()} UZS
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Qaytim */}
					{(Number(order_history.zdacha_dollar || 0) > 0 || Number(order_history.zdacha_som || 0) > 0) && (
						<div className='bg-gradient-to-br from-yellow-50 to-amber-50 p-2 rounded border border-yellow-200 md:col-span-2 lg:col-span-3 xl:col-span-5'>
							<p className='text-[10px] font-semibold text-yellow-600 mb-2 uppercase tracking-wide'>
								Qaytim
							</p>
							<div className='grid grid-cols-2 gap-2'>
								{Number(order_history.zdacha_dollar || 0) > 0 && (
									<div className='bg-white p-2 rounded border border-yellow-100'>
										<p className='text-[10px] text-gray-500 mb-0.5'>Qaytim dollarda</p>
										<p className='font-bold text-gray-800 text-xs'>
											{Number(order_history.zdacha_dollar).toFixed(2)} USD
										</p>
									</div>
								)}
								{Number(order_history.zdacha_som || 0) > 0 && (
									<div className='bg-white p-2 rounded border border-yellow-100'>
										<p className='text-[10px] text-gray-500 mb-0.5'>Qaytim so'mda</p>
										<p className='font-bold text-gray-800 text-xs'>
											{Number(order_history.zdacha_som).toLocaleString()} UZS
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Qarz ma'lumotlari */}
					{(Number(order_history.total_debt_client || 0) > 0 ||
						Number(order_history.total_debt_today_client || 0) > 0) && (
						<div className='bg-gradient-to-br from-red-50 to-pink-50 p-2 rounded border border-red-200 md:col-span-2 lg:col-span-3 xl:col-span-5'>
							<p className='text-[10px] font-semibold text-red-600 mb-2 uppercase tracking-wide'>
								Qarz ma'lumotlari
							</p>
							<div className='grid grid-cols-2 gap-2'>
								{Number(order_history.total_debt_client || 0) > 0 && (
									<div className='bg-white p-2 rounded border border-red-100'>
										<p className='text-[10px] text-gray-500 mb-0.5'>Umumiy qarz</p>
										<p className='font-bold text-red-700 text-xs'>
											{Number(order_history.total_debt_client).toLocaleString()} UZS
										</p>
									</div>
								)}
								{Number(order_history.total_debt_today_client || 0) > 0 && (
									<div className='bg-white p-2 rounded border border-red-100'>
										<p className='text-[10px] text-gray-500 mb-0.5'>Bugungi qarz</p>
										<p className='font-bold text-red-700 text-xs'>
											{Number(order_history.total_debt_today_client).toLocaleString()} UZS
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Foyda */}
					{Number(order_history.all_profit_dollar || 0) > 0 && (
						<div className='bg-gradient-to-br from-lime-50 to-green-50 p-2 rounded border border-lime-200'>
							<p className='text-[10px] font-semibold text-lime-600 mb-1 uppercase tracking-wide'>
								Foyda
							</p>
							<p className='font-bold text-lime-700 text-base'>
								{Number(order_history.all_profit_dollar).toFixed(2)} USD
							</p>
							<p className='text-xs text-lime-600 mt-0.5'>
								{(Number(order_history.all_profit_dollar) * usdRate).toLocaleString()} UZS
							</p>
						</div>
					)}

					{/* Izoh */}
					{order_history.note && (
						<div className='bg-gradient-to-br from-slate-50 to-gray-50 p-2 rounded border border-slate-200 md:col-span-2 lg:col-span-3 xl:col-span-5'>
							<p className='text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide'>
								Izoh
							</p>
							<p className='text-xs text-gray-800 whitespace-pre-wrap'>{order_history.note}</p>
						</div>
					)}

					{/* Yetkazib beruvchi */}
					{order_history.driver_info && (
						<div className='bg-gradient-to-br from-teal-50 to-cyan-50 p-2 rounded border border-teal-200 md:col-span-2 lg:col-span-3 xl:col-span-5'>
							<p className='text-[10px] font-semibold text-teal-600 mb-1 uppercase tracking-wide'>
								Yetkazib beruvchi
							</p>
							<p className='text-xs text-gray-800 whitespace-pre-wrap'>{order_history.driver_info}</p>
						</div>
					)}
				</div>
			</div>

			{/* Productlar - Model bo'yicha guruhlangan */}
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
									Berilgan soni
								</th>
								<th className='px-3 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
									Narxi ($)
								</th>
								<th className='px-3 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
									Asl Narxi ($)
								</th>
								<th className='px-3 py-2 sm:px-4 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap'>
									Foyda ($)
								</th>
							</tr>
						</thead>
						<tbody>
							{products.map((group, groupIndex) => {
								let productIndex = 0;
								const groupTotal = {
									count: 0,
									given_count: 0,
									price_dollar: 0,
									real_price: 0,
									profit: 0,
								};

								return (
									<>
										{/* Model Header */}
										<tr
											key={`header-${group.model_id}`}
											className='bg-blue-100 border-b border-blue-200'
										>
											<td
												colSpan={11}
												className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-blue-800'
											>
												{group.model}
											</td>
										</tr>

										{/* Products */}
										{group.product.map((product) => {
											productIndex++;
											const realPrice = Number(product.real_price || 0);
											const priceDollar = Number(product.price_dollar || 0);
											const count = Number(product.count || 0);
											const profit = (priceDollar - realPrice) * count;

											groupTotal.count += count;
											groupTotal.given_count += Number(product.given_count || 0);
											groupTotal.price_dollar += priceDollar * count;
											groupTotal.real_price += realPrice * count;
											groupTotal.profit += profit;

											return (
												<tr
													key={product.id}
													className='border-b border-gray-100 hover:bg-gray-50 transition-colors'
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
														{product.given_count || 0}
													</td>
													<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800 text-right'>
														{priceDollar.toFixed(2)}
													</td>
													<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm text-gray-800 text-right'>
														{realPrice.toFixed(2)}
													</td>
													<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-semibold text-green-600 text-right'>
														{profit.toFixed(2)}
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
												{groupTotal.given_count}
											</td>
											<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-semibold text-gray-700 text-right'>
												{groupTotal.price_dollar.toFixed(2)}
											</td>
											<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-semibold text-gray-700 text-right'>
												{groupTotal.real_price.toFixed(2)}
											</td>
											<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-green-600 text-right'>
												{groupTotal.profit.toFixed(2)}
											</td>
										</tr>
									</>
								);
							})}

							{/* Grand Total */}
							<tr className='bg-gray-300 border-t-2 border-gray-400'>
								<td colSpan={6} className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-gray-800'>
									Jami:
								</td>
								<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-gray-800 text-right'>
									{products.reduce(
										(sum, g) => sum + g.product.reduce((s, p) => s + Number(p.count || 0), 0),
										0,
									)}
								</td>
								<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-gray-800 text-right'>
									{products.reduce(
										(sum, g) => sum + g.product.reduce((s, p) => s + Number(p.given_count || 0), 0),
										0,
									)}
								</td>
								<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-gray-800 text-right'>
									{products
										.reduce(
											(sum, g) =>
												sum +
												g.product.reduce(
													(s, p) => s + Number(p.price_dollar || 0) * Number(p.count || 0),
													0,
												),
											0,
										)
										.toFixed(2)}
								</td>
								<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-gray-800 text-right'>
									{products
										.reduce(
											(sum, g) =>
												sum +
												g.product.reduce(
													(s, p) => s + Number(p.real_price || 0) * Number(p.count || 0),
													0,
												),
											0,
										)
										.toFixed(2)}
								</td>
								<td className='px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-green-700 text-right'>
									{products
										.reduce(
											(sum, g) =>
												sum +
												g.product.reduce((s, p) => {
													const profit =
														(Number(p.price_dollar || 0) - Number(p.real_price || 0)) *
														Number(p.count || 0);
													return s + profit;
												}, 0),
											0,
										)
										.toFixed(2)}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
