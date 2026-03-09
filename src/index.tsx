import './index.css';
import React from 'react';
import { render } from 'react-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ExchangeRateProvider } from './contexts/ExchangeRateContext';
import { SalesProvider } from './contexts/SalesContext';
import { TooltipProvider } from './components/ui/tooltip';

// React Query client yaratish
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 5 * 60 * 1000, // 5 daqiqa
		},
	},
});

render(
	<QueryClientProvider client={queryClient}>
		<AuthProvider>
			<ExchangeRateProvider>
				<SalesProvider>
					<TooltipProvider>
						<App />
					</TooltipProvider>
				</SalesProvider>
			</ExchangeRateProvider>
		</AuthProvider>
	</QueryClientProvider>,
	document.getElementById('root'),
);
