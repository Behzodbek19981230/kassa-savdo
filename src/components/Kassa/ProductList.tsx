import { Star, Tag } from 'lucide-react';
import { Product } from './types';
interface ProductListProps {
    products: Product[];
    onProductClick: (product: Product) => void;
}
export function ProductList({ products, onProductClick }: ProductListProps) {
    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-indigo-50/30 border-r border-indigo-200/50">
            {/* Filters */}
            <div className="p-3 flex space-x-2 border-b border-indigo-200/50 bg-white/80 backdrop-blur-sm">
                <button className="p-2.5 bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-xl hover:from-orange-500 hover:to-amber-600 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]">
                    <Star size={20} />
                </button>
                <button className="flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-xl hover:from-indigo-200 hover:to-purple-200 text-sm font-semibold transition-all duration-200 shadow-sm">
                    <Tag size={16} className="mr-2" />
                    Bo'limlar
                </button>
                <button className="flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-xl hover:from-indigo-200 hover:to-purple-200 text-sm font-semibold transition-all duration-200 shadow-sm">
                    <Tag size={16} className="mr-2" />
                    Brendlar
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {products.map((product) =>
                    <button
                        key={product.id}
                        onClick={() => onProductClick(product)}
                        className="w-full text-left p-4 bg-white hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 border-2 border-transparent hover:border-indigo-300 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 flex justify-between items-start group">

                        <div className="flex items-start space-x-3">
                            {product.isFavorite &&
                                <Star
                                    size={16}
                                    className="text-orange-400 mt-0.5 flex-shrink-0"
                                    fill="currentColor" />

                            }
                            <div>
                                <div className="font-semibold text-gray-800 text-sm group-hover:text-indigo-700">
                                    {product.name}
                                </div>
                                <div className="text-xs text-gray-500 mt-1.5 font-medium">
                                    {product.stock} {product.unit}
                                </div>
                            </div>
                        </div>
                        <div className="text-sm font-bold text-indigo-600 whitespace-nowrap group-hover:text-indigo-700">
                            {product.price.toLocaleString()}
                        </div>
                    </button>
                )}
            </div>
        </div>);

}