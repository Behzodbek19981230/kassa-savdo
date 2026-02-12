import { useState, useEffect } from 'react';
import { Search, Star, Loader2 } from 'lucide-react';
import { Product } from './types';
import { Input } from '../ui/Input';
import { productService, Branch } from '../../services/productService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';

interface ProductListProps {
    products: Product[];
    searchQuery?: string;
    onSearchQueryChange?: (value: string) => void;
    onProductClick: (product: Product) => void;
    filialId?: number;
    selectedBranch?: number | null;
    onBranchChange?: (branchId: number | null) => void;
}

export function ProductList({ products, searchQuery, onSearchQueryChange, onProductClick, filialId, selectedBranch, onBranchChange }: ProductListProps) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);

    // Branchlarni yuklash
    useEffect(() => {
        setIsLoadingBranches(true);
        productService.getBranches()
            .then((response) => {
                setBranches(response.results.filter(b => !b.is_delete));
            })
            .catch((error) => {
                console.error('Failed to load branches:', error);
            })
            .finally(() => {
                setIsLoadingBranches(false);
            });
    }, []);

    return (
        <div className='flex flex-col h-full bg-gradient-to-b from-white to-blue-50/30 border-r border-blue-200/50'>
            {/* Search */}
            <div className='p-3 border-b border-blue-200/50 bg-white/90 backdrop-blur-sm'>
                <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                        <Search size={18} className='text-blue-600/70' />
                    </div>
                    <Input
                        type='text'
                        placeholder='Mahsulot qidirish...'
                        value={searchQuery ?? ''}
                        onChange={(e) => onSearchQueryChange?.(e.target.value)}
                        className='pl-12 bg-white shadow-sm border-blue-200 focus:border-blue-400 focus:ring-blue-200'
                    />
                </div>
            </div>

            {/* Filters */}
            <div className='p-3 flex flex-col gap-2 border-b border-blue-200/50 bg-white/80 backdrop-blur-sm'>


                {/* Branch Filter */}
                <div className='w-full'>
                    <Select
                        value={selectedBranch?.toString() || 'all'}
                        onValueChange={(value) => onBranchChange?.(value === 'all' ? null : parseInt(value))}
                    >
                        <SelectTrigger className='w-full bg-white border-blue-200'>
                            <SelectValue placeholder={isLoadingBranches ? 'Yuklanmoqda...' : 'Brend tanlang'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='all'>Barcha brendlar</SelectItem>
                            {branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id.toString()}>
                                    {branch.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* List */}
            <div className='flex-1 overflow-y-auto p-3 space-y-2'>
                {products.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-12 text-gray-500'>
                        <Search size={48} className='mb-4 opacity-50' />
                        <p className='text-sm'>Mahsulotlar topilmadi</p>
                    </div>
                ) : (
                    products.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => onProductClick(product)}
                            className='w-full text-left p-4 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 border-2 border-transparent hover:border-blue-300 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 flex justify-between items-start group'
                        >
                            <div className='flex items-start space-x-3 flex-1 min-w-0'>
                                {product.isFavorite && (
                                    <Star size={16} className='text-orange-400 mt-0.5 flex-shrink-0' fill='currentColor' />
                                )}
                                {product.image && (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className='w-12 h-12 object-cover rounded-lg flex-shrink-0'
                                    />
                                )}
                                <div className='flex-1 min-w-0'>

                                    <div className='flex flex-wrap gap-2 mt-1.5'>
                                        {product.branchName && (
                                            <div className='text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded'>
                                                Kategoriya: {product.branchName}
                                            </div>
                                        )}
                                        {product.modelName && (
                                            <div className='text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded'>
                                                Modeli: {product.modelName}
                                            </div>
                                        )}
                                        {product.typeName && (
                                            <div className='text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded'>
                                                Turi: {product.typeName}
                                            </div>
                                        )}
                                        {product.size !== undefined && product.size !== null && (
                                            <div className='text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded'>
                                                O'lchami: {product.size}{product.unitCode ? ` ${product.unitCode}` : ''}
                                            </div>
                                        )}
                                        {product.stock !== undefined && (
                                            <div className='text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded'>
                                                Soni: {product.stock}{product.unitCode ? ` ${product.unitCode}` : ''}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
