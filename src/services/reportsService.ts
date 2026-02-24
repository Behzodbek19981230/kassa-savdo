import api from './api';

export const reportsService = {
	getFilialStatistics: async (params: { filial_id: number; year: number; month?: number | null }) => {
		const query = new URLSearchParams();
		query.append('filial_id', String(params.filial_id));
		query.append('year', String(params.year));
		if (params.month !== undefined && params.month !== null) query.append('month', String(params.month));

		const res = await api.get<any>(`/v1/reports/filial-statistics?${query.toString()}`);
		return res.data;
	},
};

export default reportsService;
