import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Sale } from '../components/Kassa/types';

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
          date: new Date(sale.date)
        }));
        setSales(salesWithDates);
      } catch (e) {
        console.error('Failed to parse saved sales', e);
      }
    }
  }, []);

  useEffect(() => {
    // Savdolarni saqlash
    localStorage.setItem('sales', JSON.stringify(sales));
  }, [sales]);

  const addSale = (sale: Sale) => {
    setSales(prev => [sale, ...prev]);
  };

  const getSalesByDateRange = (startDate?: Date, endDate?: Date): Sale[] => {
    if (!startDate && !endDate) return sales;
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      if (startDate && saleDate < startDate) return false;
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
        getSalesByDateRange
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
