import { Plus, Calendar, ShoppingCart, RotateCcw, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Eye, Trash2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/Accordion';
import { DatePicker } from '../ui/DatePicker';
import { useState, useEffect } from 'react';
import { useSales } from '../../contexts/SalesContext';
import { Sale } from './types';

interface DashboardProps {
  onNewSale?: () => void;
}

export function Dashboard({ onNewSale }: DashboardProps) {
  const { sales, getSalesByDateRange } = useSales();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);

  useEffect(() => {
    const filtered = getSalesByDateRange(startDate, endDate);
    setFilteredSales(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, startDate, endDate]);
  
  const cards = [
  {
    title: 'Savdo',
    icon: ShoppingCart,
    color: 'blue',
    total: 0,
    paid: 0,
    balance: 0,
    trend: 'up',
    bgGradient: 'from-indigo-500 via-blue-500 to-cyan-500',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600'
  },
  {
    title: 'Qaytib olish',
    icon: RotateCcw,
    color: 'orange',
    total: 0,
    paid: 0,
    balance: 0,
    trend: 'down',
    bgGradient: 'from-orange-500 via-amber-500 to-yellow-500',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600'
  },
  {
    title: 'Tushum',
    icon: TrendingUp,
    color: 'green',
    total: 0,
    paid: 0,
    balance: 0,
    trend: 'up',
    bgGradient: 'from-emerald-500 via-green-500 to-teal-500',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600'
  },
  {
    title: 'Chiqim',
    icon: TrendingDown,
    color: 'red',
    total: 0,
    paid: 0,
    balance: 0,
    trend: 'down',
    bgGradient: 'from-rose-500 via-red-500 to-pink-500',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600'
  }];
  return (
    <div className="p-6 min-h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
          <div
            key={card.title}
            className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 border border-gray-100">
            
            {/* Gradient Background Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
            
            {/* Header with Icon */}
            <div className="relative p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.iconBg} p-3 rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                {card.trend === 'up' ? (
                  <div className="flex items-center space-x-1 bg-emerald-50 px-2 py-1 rounded-lg">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-600">+12%</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 bg-rose-50 px-2 py-1 rounded-lg">
                    <ArrowDownRight className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-semibold text-rose-600">-5%</span>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">{card.title}</h3>
              <p className="text-xs text-gray-500">Bugungi statistika</p>
            </div>

            {/* Stats */}
            <div className="relative px-6 pb-4 space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 font-medium">Naqd</span>
                </div>
                <span className="font-bold text-gray-900">
                  {card.total.toLocaleString()} UZS
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 font-medium">To'langan</span>
                </div>
                <span className="font-bold text-gray-900">
                  {card.paid.toLocaleString()} UZS
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 mt-4">
                <span className="font-bold text-gray-700">Jami</span>
                <span className="font-bold text-xl text-indigo-700">
                  {card.balance.toLocaleString()} UZS
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button className="relative w-full py-4 flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 border-t border-gray-200 text-sm font-bold text-gray-700 hover:text-indigo-700 group-hover:shadow-inner">
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Yangi kiritish</span>
            </button>
          </div>
        )})}
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 min-h-[400px] border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Savdo ro'yxati</h2>
          <div className="flex space-x-3">
            <button className="px-5 py-2.5 border-2 border-indigo-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 flex items-center text-indigo-700 font-medium transition-all duration-200">
              <span className="mr-2">🔍</span> Saralash
            </button>
            <button 
              onClick={onNewSale}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 flex items-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] font-semibold">
              <Plus size={18} className="mr-2" />
              Yangi savdo
            </button>
          </div>
        </div>

        {/* Filters Accordion */}
        <Accordion type="single" collapsible className="mb-6 border-2 border-indigo-200 rounded-xl p-4">
          <AccordionItem value="filters" className="border-none">
            <AccordionTrigger className="text-indigo-700 hover:no-underline">
              <div className="flex items-center">
                <Calendar size={18} className="mr-2" />
                Filtrlash
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Boshlanish sanasi
                  </label>
                  <DatePicker
                    date={startDate}
                    onDateChange={setStartDate}
                    placeholder="Boshlanish sanasini tanlang"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tugash sanasi
                  </label>
                  <DatePicker
                    date={endDate}
                    onDateChange={setEndDate}
                    placeholder="Tugash sanasini tanlang"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Sales List */}
        {filteredSales.length > 0 ? (
          <div className="space-y-3">
            {filteredSales.map((sale) => (
              <div
                key={sale.id}
                className="bg-white border-2 border-indigo-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        #{sale.orderNumber.slice(-4)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">
                          {sale.orderNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(sale.date).toLocaleString('uz-UZ', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600">Mijoz:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {sale.customer?.name || 'Umumiy'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Sotuvchi:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {sale.kassirName || 'Noma\'lum'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Mahsulotlar:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {sale.items.length} ta
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Jami:</span>
                        <span className="font-bold text-indigo-700 ml-2 text-lg">
                          {sale.totalAmount.toLocaleString()} UZS
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Ko'rish"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="O'chirish"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-64 text-gray-400 text-lg">
            Ma'lumotlar yo'q
          </div>
        )}
      </div>
    </div>);

}