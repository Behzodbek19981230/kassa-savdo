import { useState, useRef } from 'react';
import {
  X,
  Printer,
  ChevronDown,
  Banknote,
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle2 } from
'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Input } from '../ui/Input';
import { Receipt } from './Receipt';
import { CartItem, Customer, Sale } from './types';
import { useSales } from '../../contexts/SalesContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  totalAmount: number;
  usdRate: number;
  items?: CartItem[];
  customer?: Customer;
  kassirName?: string;
}
export function PaymentModal({
  isOpen,
  onClose,
  onComplete,
  totalAmount,
  usdRate,
  items = [],
  customer,
  kassirName
}: PaymentModalProps) {
  const { addSale } = useSales();
  const [paidAmount, setPaidAmount] = useState(0);
  const [selectedMethods, setSelectedMethods] = useState<{[key: string]: number}>({});
  const receiptRef = useRef<HTMLDivElement>(null);
  const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
  
  // Hook'lar har doim bir xil tartibda chaqirilishi kerak
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Check-${orderNumber}`,
  });
  
  if (!isOpen) return null;
  
  const usdAmount = (totalAmount / usdRate).toFixed(2);
  const remaining = totalAmount - paidAmount;

  const paymentMethods = [
  {
    id: 'cash',
    name: 'Naqd',
    icon: Banknote,
    gradient: 'from-lime-500 to-green-600',
    iconBg: 'bg-lime-100',
    iconColor: 'text-lime-700'
  },
  {
    id: 'usd',
    name: 'US dollar naqd',
    icon: Banknote,
    gradient: 'from-green-700 to-emerald-800',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-700'
  },
  {
    id: 'card',
    name: 'Plastik perevod',
    icon: CreditCard,
    gradient: 'from-blue-400 to-cyan-500',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700'
  },
  {
    id: 'uzcard',
    name: 'Terminal Uzcard',
    icon: CreditCard,
    gradient: 'from-orange-400 to-amber-500',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-700'
  },
  {
    id: 'humo',
    name: 'Terminal Humo',
    icon: CreditCard,
    gradient: 'from-purple-400 to-pink-500',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-700'
  },
  {
    id: 'click',
    name: 'Click terminal',
    icon: Smartphone,
    gradient: 'from-indigo-400 to-blue-500',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-700'
  },
  {
    id: 'debt',
    name: 'Nasiya',
    icon: Wallet,
    gradient: 'from-gray-400 to-slate-500',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-700'
  }];

  const handleMethodAmountChange = (methodId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setSelectedMethods(prev => ({ ...prev, [methodId]: numAmount }));
    
    const totalPaid = Object.values({ ...selectedMethods, [methodId]: numAmount })
      .reduce((sum, val) => sum + val, 0);
    setPaidAmount(totalPaid);
  };

  const handleRemoveMethod = (methodId: string) => {
    const newMethods = { ...selectedMethods };
    delete newMethods[methodId];
    setSelectedMethods(newMethods);
    
    const totalPaid = Object.values(newMethods).reduce((sum, val) => sum + val, 0);
    setPaidAmount(totalPaid);
  };

  const handleComplete = () => {
    if (remaining <= 0) {
      // Savdo ma'lumotlarini saqlash
      const sale: Sale = {
        id: Date.now().toString(),
        orderNumber,
        date: new Date(),
        items: [...items],
        totalAmount,
        paidAmount,
        customer,
        kassirName,
        paymentMethods: { ...selectedMethods }
      };
      
      addSale(sale);
      handlePrint();
      onComplete?.(); // Cart ni tozalash va boshqa ishlar
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border-2 border-indigo-200">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <button
            onClick={onClose}
            className="text-indigo-600 font-semibold flex items-center hover:text-indigo-700 hover:bg-white px-4 py-2 rounded-xl transition-all duration-200">

            &lt; Ortga qaytish [ESC]
          </button>
          <div className="flex space-x-3">
            <button 
              onClick={handlePrint}
              className="p-3 border-2 border-indigo-200 rounded-xl bg-white hover:bg-indigo-50 text-indigo-600 transition-all duration-200 shadow-sm hover:shadow-md"
              title="Chop etish">
              <Printer size={20} />
            </button>
            <button className="p-3 border-2 border-indigo-200 rounded-xl bg-white hover:bg-indigo-50 text-indigo-600 transition-all duration-200 shadow-sm hover:shadow-md">
              <ChevronDown size={20} />
            </button>
            <button
              onClick={handleComplete}
              disabled={remaining > 0}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2">
              <CheckCircle2 size={18} />
              <span>Tugallash [t]</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-white">
          {/* Totals */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border-2 border-indigo-200">
              <p className="text-gray-600 mb-2 font-medium">To'lanishi kerak:</p>
              <p className="text-3xl font-bold text-indigo-700">
                {totalAmount.toLocaleString()}{' '}
                <span className="text-sm font-normal text-indigo-500">UZS</span>
              </p>
              <p className="text-xl font-bold text-indigo-600 mt-1">
                {usdAmount}{' '}
                <span className="text-sm font-normal text-indigo-400">USD</span>
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-2xl border-2 border-emerald-200">
              <p className="text-gray-600 mb-2 font-medium">To'landi:</p>
              <p className="text-3xl font-bold text-emerald-600">
                {paidAmount.toLocaleString()}{' '}
                <span className="text-sm font-normal text-emerald-500">UZS</span>
              </p>
            </div>
            <div className={`p-5 rounded-2xl border-2 ${remaining > 0 ? 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-200' : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'}`}>
              <p className="text-gray-600 mb-2 font-medium">Qoldi:</p>
              <p className={`text-3xl font-bold ${remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {Math.max(0, remaining).toLocaleString()}{' '}
                <span className={`text-sm font-normal ${remaining > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>UZS</span>
              </p>
              {remaining > 0 && (
                <p className="text-xl font-bold text-rose-500 mt-1">
                  {(remaining / usdRate).toFixed(2)}{' '}
                  <span className="text-sm font-normal text-rose-400">USD</span>
                </p>
              )}
            </div>
          </div>

          {/* Payment Methods Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentMethods.map((method) => {
              const isSelected = selectedMethods[method.id] > 0;
              return (
              <div
                key={method.id}
                className={`border-2 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] ${
                  isSelected ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-indigo-200'
                }`}>

                <div className={`bg-gradient-to-r ${method.gradient} text-white p-4 flex justify-between items-center`}>
                  <div className="flex items-center space-x-3">
                    <div className={`${method.iconBg} p-2 rounded-lg`}>
                      <method.icon className={`${method.iconColor} w-5 h-5`} />
                    </div>
                    <span className="font-semibold text-sm">{method.name}</span>
                  </div>
                  {isSelected && (
                    <button 
                      onClick={() => handleRemoveMethod(method.id)}
                      className="text-white/80 hover:text-white transition-colors bg-white/20 p-1 rounded">
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="p-4 bg-white">
                  <Input
                    type="number"
                    placeholder="0"
                    value={selectedMethods[method.id] || ''}
                    onChange={(e) => handleMethodAmountChange(method.id, e.target.value)}
                    className="w-full border-b-2 border-indigo-200 focus:border-indigo-500 py-2 text-right font-semibold text-lg rounded-lg focus:bg-indigo-50/50" />
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>

      {/* Hidden Receipt for Printing */}
      <div style={{ display: 'none' }}>
        <div ref={receiptRef}>
          <Receipt
            items={items}
            totalAmount={totalAmount}
            usdAmount={usdAmount}
            usdRate={usdRate}
            customer={customer}
            kassirName={kassirName}
            orderNumber={orderNumber}
            date={new Date()}
          />
        </div>
      </div>
    </div>);

}