import { Trash2, Plus, Minus } from 'lucide-react';
import { CartItem } from './types';
interface CartProps {
    items: CartItem[];
    onUpdateQuantity: (id: string, delta: number) => void;
    onRemoveItem: (id: string) => void;
    totalItems: number;
}
export function Cart({
    items,
    onUpdateQuantity,
    onRemoveItem,
    totalItems
}: CartProps) {
    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-blue-50/30 border-r border-blue-200/50">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-500 border-b border-blue-400 flex justify-between items-center shadow-md">
                <h2 className="text-2xl font-bold text-white flex items-center">
                    Savdo{' '}
                    <span className="ml-3 text-yellow-200 text-xl">
                        {totalItems.toLocaleString()}
                    </span>
                </h2>
                <span className="text-white/80 font-semibold bg-white/20 px-3 py-1 rounded-xl">#2</span>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {items.map((item, index) =>
                    <div
                        key={item.id}
                        className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl border-2 border-blue-100 flex items-center transition-all duration-200">

                        <div className="w-10 h-10 text-center font-bold text-blue-600 text-sm bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
                            {index + 1}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex flex-col border-2 border-blue-200 rounded-xl mx-3 overflow-hidden shadow-sm">
                            <button
                                onClick={() => onUpdateQuantity(item.id, 1)}
                                className="p-1.5 hover:bg-gradient-to-br hover:from-emerald-400 hover:to-green-500 text-emerald-600 border-b border-blue-200 flex justify-center transition-all duration-200">

                                <Plus size={14} />
                            </button>
                            <button
                                onClick={() => onUpdateQuantity(item.id, -1)}
                                className="p-1.5 hover:bg-gradient-to-br hover:from-rose-400 hover:to-red-500 text-rose-600 flex justify-center transition-all duration-200">

                                <Minus size={14} />
                            </button>
                        </div>

                        {/* Quantity Display */}
                        <div className="w-20 text-center border-2 border-blue-200 rounded-xl px-2 py-2.5 bg-gradient-to-br from-blue-50 to-cyan-50 text-sm font-semibold mx-1 text-blue-700">
                            {item.quantity} {item.unit === 'dona' ? 'dona' : 'kg'}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 px-3">
                            <div className="font-semibold text-gray-900 text-sm">
                                {item.name}
                            </div>
                            <div className="text-xs text-blue-600 font-medium mt-1">
                                {item.price.toLocaleString()} UZS
                            </div>
                        </div>

                        {/* Total & Delete */}
                        <div className="flex items-center space-x-3">
                            <div className="font-bold text-blue-700 text-right w-28 text-lg">
                                {item.totalPrice.toLocaleString()}
                            </div>
                            <button
                                onClick={() => onRemoveItem(item.id)}
                                className="text-white bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 p-2 rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105">

                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>);

}