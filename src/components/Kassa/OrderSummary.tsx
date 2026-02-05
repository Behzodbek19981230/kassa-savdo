import { useState, useEffect } from 'react';
import { User, MessageSquare, Plus, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select';
import { Autocomplete, AutocompleteOption } from '../ui/Autocomplete';
import { CustomerModal } from './CustomerModal';
import { Customer } from './types';

interface OrderSummaryProps {
  totalAmount: number;
  usdRate: number;
  onPayment: () => void;
  onCustomerChange?: (customer: Customer | null) => void;
}

// Mock kontaktlar - haqiqiy loyihada API dan keladi
const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Ali Valiyev', phone: '+998901234567' },
  { id: '2', name: 'Hasan Hasanov', phone: '+998901234568' },
  { id: '3', name: 'Husan Husanov', phone: '+998901234569' },
  { id: '4', name: 'Olim Olimov', email: 'olim@example.com' },
  { id: '5', name: 'Karim Karimov', phone: '+998901234570' },
];

export function OrderSummary({
  totalAmount,
  usdRate,
  onPayment,
  onCustomerChange
}: OrderSummaryProps) {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();

  // localStorage dan kontaktlarni yuklash
  useEffect(() => {
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      try {
        setCustomers(JSON.parse(savedCustomers));
      } catch (e) {
        console.error('Failed to parse saved customers', e);
      }
    }
  }, []);

  // Kontaktlarni saqlash
  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  const autocompleteOptions: AutocompleteOption[] = customers.map(customer => ({
    id: customer.id,
    label: customer.name + (customer.phone ? ` (${customer.phone})` : ''),
    value: customer.id
  }));

  const handleAddNewCustomer = (name: string) => {
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name: name
    };
    setCustomers([...customers, newCustomer]);
    setSelectedCustomerId(newCustomer.id);
    onCustomerChange?.(newCustomer);
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const customer = customers.find(c => c.id === customerId);
    onCustomerChange?.(customer || null);
  };

  const handleSaveCustomer = (customerData: Omit<Customer, 'id'>) => {
    if (editingCustomer) {
      // Tahrirlash
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id 
          ? { ...c, ...customerData }
          : c
      ));
    } else {
      // Yangi qo'shish
      const newCustomer: Customer = {
        id: Date.now().toString(),
        ...customerData
      };
      setCustomers([...customers, newCustomer]);
      setSelectedCustomerId(newCustomer.id);
    }
    setEditingCustomer(undefined);
  };

  const handleOpenAddModal = () => {
    setEditingCustomer(undefined);
    setIsCustomerModalOpen(true);
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const usdTotal = (totalAmount / usdRate).toFixed(2);
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-blue-50/30 p-4">
      {/* Customer Selection */}
      <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg mb-4 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center text-blue-600 text-sm font-semibold">
              <User size={18} className="mr-2" />
              <span>Kontakt</span>
            </div>
            <button 
              onClick={handleOpenAddModal}
              className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white p-2 rounded-xl hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg"
              title="Yangi kontakt qo'shish"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <Autocomplete
            options={autocompleteOptions}
            value={selectedCustomerId}
            onChange={handleCustomerChange}
            onAddNew={handleAddNewCustomer}
            placeholder="Kontakt tanlang yoki qidiring..."
            emptyMessage="Kontakt topilmadi"
          />

          {selectedCustomer && (
            <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm mb-1">
                    {selectedCustomer.name}
                  </div>
                  {selectedCustomer.phone && (
                    <div className="text-xs text-gray-600 mb-1">
                      📞 {selectedCustomer.phone}
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="text-xs text-gray-600">
                      ✉️ {selectedCustomer.email}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEditingCustomer(selectedCustomer);
                    setIsCustomerModalOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-100 transition-colors"
                  title="Tahrirlash"
                >
                  <User size={14} />
                </button>
                <button
                  onClick={() => {
                    setSelectedCustomerId('');
                    onCustomerChange?.(null);
                  }}
                  className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors ml-1"
                  title="Olib tashlash"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="p-3 text-center text-blue-500 text-sm flex items-center justify-center hover:bg-blue-50 cursor-pointer transition-colors duration-200 font-medium border-t border-blue-100">
          <MessageSquare size={16} className="mr-2" />
          Izoh yozish
        </div>
      </div>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setEditingCustomer(undefined);
        }}
        onSave={handleSaveCustomer}
        initialData={editingCustomer}
      />

      {/* Cashier Selection */}
      <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg mb-auto overflow-hidden p-4">
        <div className="mb-3">
          <label className="text-xs text-blue-600 font-semibold">
            Sotuvchi tanlash
          </label>
        </div>
        <Select defaultValue="kassa-1">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sotuvchi tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kassa-1">Kassa test 4 INWARE #28</SelectItem>
            <SelectItem value="kassa-2">Kassa test 5 INWARE #29</SelectItem>
            <SelectItem value="kassa-3">Kassa test 6 INWARE #30</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Totals Section */}
      <div className="mt-4 space-y-4">
        {/* Exchange Rate */}
        <div className="flex justify-between items-center text-xs text-blue-600 font-semibold px-2 bg-blue-50/50 p-2 rounded-xl">
          <div className="flex items-center">
            <span className="mr-1">✎</span> Kurs
          </div>
          <div className="font-bold">{usdRate.toLocaleString()} UZS = 1 USD</div>
        </div>

        {/* Total Display */}
        <div className="flex justify-between items-end px-2 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200">
          <span className="text-gray-700 font-semibold">Yig'indi</span>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-700">
              {totalAmount.toLocaleString()}{' '}
              <span className="text-sm font-normal text-blue-500">UZS</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center px-2 text-sm text-blue-600 bg-blue-50/50 p-2 rounded-xl">
          <span className="font-medium">Chegirma (0%)</span>
          <span className="font-bold text-gray-800">
            0 <span className="text-xs font-normal text-gray-500">UZS</span>
          </span>
        </div>

        {/* Payment Button */}
        <button
          onClick={onPayment}
          className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 text-white py-5 rounded-2xl shadow-xl hover:shadow-2xl flex justify-between items-center px-6 mt-2 transition-all duration-200 transform hover:scale-[1.01] font-bold">

          <div className="text-left">
            <div className="text-xs opacity-90">To'lovga</div>
            <div className="text-sm opacity-70">F2</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {totalAmount.toLocaleString()} UZS
            </div>
          </div>
        </button>
      </div>
    </div>);

}