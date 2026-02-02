import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Sale } from '../components/Kassa/types';

const USD_RATE = 12180;

const MOCK_SALES: Sale[] = (() => {
	const now = new Date();
	const mkDate = (daysAgo: number, hh: number, mm: number) => {
		const d = new Date(now);
		d.setDate(d.getDate() - daysAgo);
		d.setHours(hh, mm, 0, 0);
		return d;
	};

	const mkItems = (seed: number) => [
		{
			id: `p-${seed}-1`,
			name: 'Fanta orange',
			price: 14000,
			stock: 100,
			unit: 'dona' as const,
			quantity: 2,
			totalPrice: 28000,
		},
		{
			id: `p-${seed}-2`,
			name: 'Bamboo',
			price: 12000,
			stock: 50,
			unit: 'dona' as const,
			quantity: 1,
			totalPrice: 12000,
		},
	];

	return [
		{
			id: 'mock-1',
			orderNumber: 'SK-000001',
			date: mkDate(0, 10, 15),
			items: mkItems(1),
			totalAmount: 40000,
			paidAmount: 40000,
			customer: { id: 'c-1', name: 'Ali Valiyev', phone: '+998901234567' },
			kassirName: 'Admin',
			paymentMethods: { cash: 40000 },
		},
		{
			id: 'mock-2',
			orderNumber: 'SK-000002',
			date: mkDate(0, 12, 40),
			items: [
				{
					id: 'p-2-1',
					name: 'Just shampoo 1l',
					price: 26000,
					stock: 80,
					unit: 'dona',
					quantity: 1,
					totalPrice: 26000,
				},
			],
			totalAmount: 26000,
			paidAmount: 20000,
			customer: { id: 'c-2', name: 'Hasan Hasanov', phone: '+998901234568' },
			kassirName: 'Kassir-1',
			paymentMethods: { cash: 20000, card: 6000 },
		},
		{
			id: 'mock-3',
			orderNumber: 'SK-000003',
			date: mkDate(1, 16, 5),
			items: [
				{
					id: 'p-3-1',
					name: 'Kango',
					price: 2000,
					stock: 200,
					unit: 'dona',
					quantity: 10,
					totalPrice: 20000,
				},
				{
					id: 'p-3-2',
					name: 'Bolt 25',
					price: 10000,
					stock: 40,
					unit: 'dona',
					quantity: 1,
					totalPrice: 10000,
				},
			],
			totalAmount: 30000,
			paidAmount: 30000,
			customer: { id: 'c-3', name: 'Umumiy' },
			kassirName: 'Kassir-2',
			paymentMethods: { cash: 30000 },
		},
		{
			id: 'mock-4',
			orderNumber: 'SK-000004',
			date: mkDate(2, 9, 30),
			items: [
				{
					id: 'p-4-1',
					name: 'Windows ustanovka',
					price: 40000,
					stock: 10,
					unit: 'xizmat',
					quantity: 1,
					totalPrice: 40000,
				},
			],
			totalAmount: 40000,
			paidAmount: 40000,
			customer: { id: 'c-4', name: 'Olim Olimov', email: 'olim@example.com' },
			kassirName: 'Admin',
			paymentMethods: { transfer: 40000 },
		},
		{
			id: 'mock-5',
			orderNumber: 'SK-000005',
			date: mkDate(3, 18, 20),
			items: [
				{
					id: 'p-5-1',
					name: 'X17',
					price: 1560000,
					stock: 6,
					unit: 'dona',
					quantity: 1,
					totalPrice: 1560000,
				},
			],
			totalAmount: 1560000,
			paidAmount: 1560000,
			customer: { id: 'c-5', name: 'Karim Karimov', phone: '+998901234570' },
			kassirName: 'Kassir-1',
			paymentMethods: { card: 1560000 },
		},
		{
			id: 'mock-6',
			orderNumber: 'SK-000006',
			date: mkDate(6, 11, 10),
			items: [
				{
					id: 'p-6-1',
					name: 'USD (hisob-kitob)',
					price: USD_RATE,
					stock: 0,
					unit: 'xizmat',
					quantity: 10,
					totalPrice: 10 * USD_RATE,
				},
			],
			totalAmount: 10 * USD_RATE,
			paidAmount: 10 * USD_RATE,
			customer: { id: 'c-6', name: 'Umumiy' },
			kassirName: 'Admin',
			paymentMethods: { cash: 10 * USD_RATE },
		},
	];
})();

interface SalesContextType {
	sales: Sale[];
	addSale: (sale: Sale) => void;
	getSalesByDateRange: (startDate?: Date, endDate?: Date) => Sale[];
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export function SalesProvider({ children }: { children: ReactNode }) {
	const [sales, setSales] = useState<Sale[]>([]);

	useEffect(() => {
		// localStorage dan savdolarni yuklash
		const savedSales = localStorage.getItem('sales');
		if (savedSales) {
			try {
				const parsed = JSON.parse(savedSales);
				// Date stringlarni Date objectlarga o'girish
				const salesWithDates = parsed.map((sale: any) => ({
					...sale,
					date: new Date(sale.date),
				}));
				setSales(salesWithDates);
			} catch (e) {
				console.error('Failed to parse saved sales', e);
			}
			return;
		}

		// Demo/mock: agar localStorage bo'sh bo'lsa, savdolar ro'yxatiga mock data qo'yamiz
		setSales(MOCK_SALES);
	}, []);

	useEffect(() => {
		// Savdolarni saqlash
		localStorage.setItem('sales', JSON.stringify(sales));
	}, [sales]);

	const addSale = (sale: Sale) => {
		setSales((prev) => [sale, ...prev]);
	};

	const getSalesByDateRange = (startDate?: Date, endDate?: Date): Sale[] => {
		if (!startDate && !endDate) return sales;

		const normalizedStart = startDate ? new Date(startDate) : undefined;
		if (normalizedStart) normalizedStart.setHours(0, 0, 0, 0);

		return sales.filter((sale) => {
			const saleDate = new Date(sale.date);
			if (normalizedStart && saleDate < normalizedStart) return false;
			if (endDate) {
				const end = new Date(endDate);
				end.setHours(23, 59, 59, 999);
				if (saleDate > end) return false;
			}
			return true;
		});
	};

	return (
		<SalesContext.Provider
			value={{
				sales,
				addSale,
				getSalesByDateRange,
			}}
		>
			{children}
		</SalesContext.Provider>
	);
}

export function useSales() {
	const context = useContext(SalesContext);
	if (context === undefined) {
		throw new Error('useSales must be used within a SalesProvider');
	}
	return context;
}
