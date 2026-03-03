import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { USD_RATE } from '../constants';
import { exchangeRateService, type ExchangeRateResponse } from '../services/exchangeRateService';
import { useAuth } from './AuthContext';

interface ExchangeRateContextType {
	exchangeRatesData: ExchangeRateResponse | undefined;
	activeRate: ExchangeRateResponse['results'][number] | undefined;
	displayRate: number;
	isLoading: boolean;
	refetchExchangeRate: () => Promise<unknown>;
}

const ExchangeRateContext = createContext<ExchangeRateContextType | undefined>(undefined);

export function ExchangeRateProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth();
	const filial = user?.order_filial || undefined;

	const {
		data: exchangeRatesData,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['exchange-rates', filial],
		queryFn: () => exchangeRateService.getExchangeRates({ filial }),
		staleTime: 60_000,
	});

	const activeRate = useMemo(
		() => exchangeRatesData?.results.find((rate) => rate.is_active === true),
		[exchangeRatesData],
	);

	const displayRate = Number(activeRate?.dollar || USD_RATE);

	return (
		<ExchangeRateContext.Provider
			value={{
				exchangeRatesData,
				activeRate,
				displayRate,
				isLoading,
				refetchExchangeRate: refetch,
			}}
		>
			{children}
		</ExchangeRateContext.Provider>
	);
}

export function useExchangeRate() {
	const context = useContext(ExchangeRateContext);
	if (!context) {
		throw new Error('useExchangeRate must be used within an ExchangeRateProvider');
	}
	return context;
}
