import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Product } from './types';
import { Input, Label } from '../ui/Input';
interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (quantity: number, price: number) => void;
}
export function ProductModal({
  isOpen,
  onClose,
  product,
  onConfirm
}: ProductModalProps) {
  const [quantity, setQuantity] = useState<string>('1');
  const [price, setPrice] = useState<number>(0);
  const [mode, setMode] = useState<'quantity' | 'sum'>('quantity');
  useEffect(() => {
    if (product) {
      setPrice(product.price);
      setQuantity('1');
    }
  }, [product]);
  if (!isOpen || !product) return null;
  const handleConfirm = () => {
    const qty = parseFloat(quantity);
    if (qty > 0) {
      onConfirm(qty, price);
      onClose();
    }
  };
  const total = parseFloat(quantity) * price;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-indigo-200">
        <div className="flex justify-between items-center p-5 border-b-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <h3 className="text-xl font-bold text-gray-900">
            {product.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-indigo-600 hover:bg-white p-2 rounded-xl transition-all duration-200">

            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-5 bg-white">
          <div className="flex justify-between text-sm text-gray-600 bg-indigo-50/50 p-3 rounded-xl">
            <span className="font-medium">Sot. narxi:</span>
            <span className="font-bold text-indigo-700 text-lg">
              {product.price.toLocaleString()} UZS
            </span>
          </div>
          <div className="flex justify-between text-sm text-indigo-600 bg-emerald-50/50 p-3 rounded-xl">
            <span className="font-medium">Sotuvda bor:</span>
            <span className="font-bold text-emerald-700">
              {product.stock.toLocaleString()} {product.unit}
            </span>
          </div>
          <div className="flex justify-between text-sm text-orange-600 bg-orange-50/50 p-3 rounded-xl">
            <span className="font-medium">Band qilingan:</span>
            <span className="font-bold text-orange-700">1 {product.unit}</span>
          </div>

          <div className="mt-4">
            <Label htmlFor="quantity" className="block text-xs text-indigo-600 mb-2 ml-1 font-semibold">
              Miqdori
            </Label>
            <div className="flex rounded-xl shadow-lg overflow-hidden border-2 border-indigo-200">
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="flex-1 block w-full rounded-l-xl border-0 sm:text-lg p-3 bg-white"
                autoFocus />

              <div className="flex">
                <button
                  type="button"
                  onClick={() => setMode('sum')}
                  className={`px-5 py-3 border-l-2 text-sm font-semibold transition-all duration-200 ${mode === 'sum' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-500' : 'bg-white text-gray-700 border-indigo-200 hover:bg-indigo-50'}`}>

                  SUMMA
                </button>
                <button
                  type="button"
                  onClick={() => setMode('quantity')}
                  className={`px-5 py-3 border-l-2 rounded-r-xl text-sm font-semibold transition-all duration-200 ${mode === 'quantity' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-500' : 'bg-white text-gray-700 border-indigo-200 hover:bg-indigo-50'}`}>

                  {product.unit.toUpperCase()}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleConfirm}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold flex items-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">

              <span className="mr-2">✓</span> SAQLASH
            </button>
          </div>
        </div>
      </div>
    </div>);

}