import { useState, useEffect, useMemo } from 'react';
import { Search, Star, RotateCcw } from 'lucide-react';
import { Product } from './types';
import { Input } from '../ui/Input';
import { productService, Branch } from '../../services/productService';
import { Autocomplete } from '../ui/Autocomplete';

interface ProductListProps {
    products: Product[];
    appliedSearch?: string;
    onSearchSubmit?: (value: string) => void;
    onProductClick: (product: Product) => void;
    selectedBranch?: number | null;
    selectedModel?: number | null;
    selectedType?: number | null;
    onBranchChange?: (branchId: number | null) => void;
    onModelChange?: (modelId: number | null) => void;
    onTypeChange?: (typeId: number | null) => void;
}

const filterAutocompleteClass =
    '!h-7 !min-h-7 rounded-lg border border-blue-200 px-2 text-xs focus:ring-1 focus:ring-blue-300 max-h-[300px]';

export function ProductList({
    products,
    appliedSearch = '',
    onSearchSubmit,
    onProductClick,
    selectedBranch,
    selectedModel,
    selectedType,
    onBranchChange,
    onModelChange,
    onTypeChange,
}: ProductListProps) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);
    const [searchInput, setSearchInput] = useState(appliedSearch);

    useEffect(() => {
        setSearchInput(appliedSearch);
    }, [appliedSearch]);

    useEffect(() => {
        setIsLoadingBranches(true);
        productService
            .getBranches()
            .then((response) => {
                setBranches(response.results.filter((b) => !b.is_delete));
            })
            .catch((error) => {
                console.error('Failed to load branches:', error);
            })
            .finally(() => {
                setIsLoadingBranches(false);
            });
    }, []);

    const uniqueModels = useMemo(() => {
        const seen = new Set<number>();
        return products
            .filter((p) => p.modelId != null && p.modelName)
            .filter((p) => {
                if (seen.has(p.modelId!)) return false;
                seen.add(p.modelId!);
                return true;
            })
            .map((p) => ({ id: p.modelId!, name: p.modelName! }));
    }, [products]);

    const uniqueTypes = useMemo(() => {
        const seen = new Set<number>();
        return products
            .filter((p) => p.typeId != null && p.typeName)
            .filter((p) => {
                if (seen.has(p.typeId!)) return false;
                seen.add(p.typeId!);
                return true;
            })
            .map((p) => ({ id: p.typeId!, name: p.typeName! }));
    }, [products]);

    const branchOptions = useMemo(
        () => [
            { id: 'all', label: 'Barcha kategoriyalar', value: 'all' },
            ...branches.map((b) => ({ id: String(b.id), label: b.name, value: String(b.id) })),
        ],
        [branches]
    );
    const modelOptions = useMemo(
        () => [
            { id: 'all', label: 'Barcha modellar', value: 'all' },
            ...uniqueModels.map((m) => ({ id: String(m.id), label: m.name, value: String(m.id) })),
        ],
        [uniqueModels]
    );
    const typeOptions = useMemo(
        () => [
            { id: 'all', label: 'Barcha turlar', value: 'all' },
            ...uniqueTypes.map((t) => ({ id: String(t.id), label: t.name, value: String(t.id) })),
        ],
        [uniqueTypes]
    );

    const handleSearchSubmit = () => {
        onSearchSubmit?.(searchInput.trim());
    };

    const handleClear = () => {
        setSearchInput('');
        onSearchSubmit?.('');
        onBranchChange?.(null);
        onModelChange?.(null);
        onTypeChange?.(null);
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-blue-50/30 border-r border-blue-200/50">
            {/* Qidiruv — faqat submit da backend ga boradi; tugmalar faqat icon */}
            <div className="p-3 border-b border-blue-200/50 bg-white/90 backdrop-blur-sm">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-blue-600/70" />
                        </div>
                        <Input
                            type="text"
                            placeholder="Mahsulot qidirish..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchSubmit())}
                            className="pl-9 h-9 text-sm bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleSearchSubmit}
                        title="Qidirish"
                        className="h-9 w-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shrink-0"
                    >
                        <Search size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        title="Tozalash"
                        className="h-9 w-9 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            {/* Filterlar: bir qatorda 3 ta, butun width bo'yicha */}
            <div className="p-2 grid grid-cols-3 gap-2 border-b border-blue-200/50 bg-white/80 backdrop-blur-sm">
                <Autocomplete
                    options={branchOptions}
                    value={selectedBranch?.toString() ?? 'all'}
                    onChange={(v) => onBranchChange?.(v === 'all' ? null : parseInt(v))}
                    placeholder={isLoadingBranches ? '...' : 'Kategoriya'}
                    className={`${filterAutocompleteClass} w-full min-w-0`}
                    emptyMessage="Kategoriya topilmadi"
                />
                <Autocomplete
                    options={modelOptions}
                    value={selectedModel?.toString() ?? 'all'}
                    onChange={(v) => onModelChange?.(v === 'all' ? null : parseInt(v))}
                    placeholder="Model"
                    className={`${filterAutocompleteClass} w-full min-w-0`}
                    emptyMessage="Model topilmadi"
                />
                <Autocomplete
                    options={typeOptions}
                    value={selectedType?.toString() ?? 'all'}
                    onChange={(v) => onTypeChange?.(v === 'all' ? null : parseInt(v))}
                    placeholder="Turi"
                    className={`${filterAutocompleteClass} w-full min-w-0`}
                    emptyMessage="Tur topilmadi"
                />
            </div>

            {/* Ro'yxat */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Search size={48} className="mb-4 opacity-50" />
                        <p className="text-sm">Mahsulotlar topilmadi</p>
                    </div>
                ) : (
                    products.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => onProductClick(product)}
                            className="w-full text-left p-4 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 border-2 border-transparent hover:border-blue-300 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 flex justify-between items-start group"
                        >
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                                {product.isFavorite && (
                                    <Star size={16} className="text-orange-400 mt-0.5 flex-shrink-0" fill="currentColor" />
                                )}
                                {product.image && (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                        {product.branchName && (
                                            <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded">
                                                Kategoriya: {product.branchName}
                                            </span>
                                        )}
                                        {product.modelName && (
                                            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                                                Modeli: {product.modelName}
                                            </span>
                                        )}
                                        {product.typeName && (
                                            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">
                                                Turi: {product.typeName}
                                            </span>
                                        )}
                                        {product.size !== undefined && product.size !== null && (
                                            <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded">
                                                O'lchami: {product.size}
                                                {product.unitCode ? ` ${product.unitCode}` : ''}
                                            </span>
                                        )}
                                        {product.stock !== undefined && (
                                            <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded">
                                                Soni: {product.stock}
                                                {product.unitCode ? ` ${product.unitCode}` : ''}
                                            </span>
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
