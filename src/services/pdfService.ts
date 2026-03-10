import api from './api';

/** Buyurtma PDF turi: mijoz uchun yoki hodim uchun */
export type OrderPdfType = 'client' | 'worker';

/**
 * Order-history uchun PDF yuklab Blob qaytaradi.
 * Mijoz: pdf/order-history/<pk>/client
 * Hodim: pdf/order-history/<pk>/worker
 */
export async function getOrderHistoryPdf(orderPk: number, type: OrderPdfType): Promise<Blob> {
	const response = await api.get<Blob>(`/v1/pdf/order-history/${orderPk}/${type}`, {
		responseType: 'blob',
	});
	return response.data;
}

/**
 * To'langan qarz uchun PDF (mijoz): pdf/debt-repayment/<pk>/client
 */
export async function getDebtRepaymentPdf(debtRepaymentPk: number): Promise<Blob> {
	const response = await api.get<Blob>(`/v1/pdf/debt-repayment/${debtRepaymentPk}/client`, {
		responseType: 'blob',
	});
	return response.data;
}

export const pdfService = {
	getOrderHistoryPdf,
	getDebtRepaymentPdf,
};
