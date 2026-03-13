import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, RotateCcw, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ProductItem, ProductGroup } from '../../types';
import { Input } from '../ui/Input';
import { productService, Branch, ProductImage, ProductModel, BranchCategoryDetail } from '../../services/productService';
import { Autocomplete } from '../ui/Autocomplete';
import { useInfiniteQuery } from '@tanstack/react-query';

const AUTOCOMPLETE_PAGE_SIZE = 30;

interface ProductListProps {

    onProductClick: (product: ProductItem) => void;

}

const filterAutocompleteClass =
    '!h-7 !min-h-7 rounded-lg border border-blue-200 px-2 text-xs focus:ring-1 focus:ring-blue-300 max-h-[300px]';

export function ProductList({
    onProductClick,
}: ProductListProps) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);
    const [branchCategorySearch, setBranchCategorySearch] = useState('');
    const [modelSearch, setModelSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedProductImages, setSelectedProductImages] = useState<ProductImage[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLoadingImages, setIsLoadingImages] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [limit] = useState(30); // You can adjust limit as needed
    const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
    const [selectedBranchCategory, setSelectedBranchCategory] = useState<number | null>(null);
    const [selectedModel, setSelectedModel] = useState<number | null>(null);
    const [appliedSearch, setAppliedSearch] = useState('');

    const groupedProductsInfinite = useInfiniteQuery({
        queryKey: [
            'groupedProducts',
            {
                search: appliedSearch.trim(),
                branch: selectedBranch ?? undefined,
                branch_category: selectedBranchCategory ?? undefined,
                model: selectedModel ?? undefined,
            },
        ],
        queryFn: ({ pageParam }) =>
            productService.getProductsGroupedByModel({
                search: appliedSearch.trim() || undefined,
                branch: selectedBranch ?? undefined,
                branch_category: selectedBranchCategory ?? undefined,
                model: selectedModel ?? undefined,
                page: pageParam,
                limit,
            }),
        getNextPageParam: (lastPage) =>
            lastPage.pagination &&
                lastPage.pagination.currentPage !== undefined &&
                lastPage.pagination.lastPage !== undefined &&
                lastPage.pagination.currentPage < lastPage.pagination.lastPage
                ? lastPage.pagination.currentPage + 1
                : undefined,
        initialPageParam: 1,
        enabled: true,
    });

    const groupedProducts = useMemo(() => {
        const allGroups: ProductGroup[] = [];
        groupedProductsInfinite.data?.pages.forEach((page) => {
            if (page.results) {
                allGroups.push(...page.results);
            }
        });
        return allGroups;
    }, [groupedProductsInfinite.data]);

    const isLoadingGrouped = groupedProductsInfinite.isLoading || groupedProductsInfinite.isFetching;
    const hasMoreGroups = !!groupedProductsInfinite.hasNextPage;


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

    const prevBranchRef = useRef<number | null | undefined>(selectedBranch);
    useEffect(() => {
        if (prevBranchRef.current !== selectedBranch && prevBranchRef.current !== undefined) {
            setSelectedBranchCategory(null);
            setSelectedModel(null);
        }
        prevBranchRef.current = selectedBranch;
    }, [selectedBranch]);

    const branchCategoriesInfinite = useInfiniteQuery({
        queryKey: [
            'productBranchCategories',
            'filter',
            {
                product_branch: selectedBranch ?? undefined,
                is_delete: false,
                search: branchCategorySearch,
            },
        ],
        queryFn: ({ pageParam }) =>
            productService.getBranchCategories({
                product_branch: selectedBranch ?? undefined,
                page: pageParam,
                limit: AUTOCOMPLETE_PAGE_SIZE,
                search: branchCategorySearch || undefined,
            }),
        getNextPageParam: (lastPage) =>
            lastPage.pagination && lastPage.pagination.currentPage < lastPage.pagination.lastPage
                ? lastPage.pagination.currentPage + 1
                : undefined,
        initialPageParam: 1,
        enabled: true,
    });

    const prevBranchCategoryRef = useRef<number | null | undefined>(selectedBranchCategory);
    useEffect(() => {
        if (prevBranchCategoryRef.current !== selectedBranchCategory && prevBranchCategoryRef.current !== undefined) {
            setSelectedModel(null);
        }
        prevBranchCategoryRef.current = selectedBranchCategory;
    }, [selectedBranchCategory]);

    const modelsInfinite = useInfiniteQuery({
        queryKey: [
            'productModels',
            'filter',
            {
                branch_category: selectedBranchCategory ?? undefined,
                is_delete: false,
                search: modelSearch,
            },
        ],
        queryFn: ({ pageParam }) =>
            productService.getProductModels({
                branch_category: selectedBranchCategory ?? undefined,
                page: pageParam,
                limit: AUTOCOMPLETE_PAGE_SIZE,
                search: modelSearch || undefined,
            }),
        getNextPageParam: (lastPage) =>
            lastPage.pagination && lastPage.pagination.currentPage < lastPage.pagination.lastPage
                ? lastPage.pagination.currentPage + 1
                : undefined,
        initialPageParam: 1,
        enabled: true,
    });

    const branchOptions = useMemo(
        () => [
            { id: 'all', label: 'Barchasi', value: 'all' },
            ...branches.map((b) => ({ id: String(b.id), label: b.name, value: String(b.id) })),
        ],
        [branches],
    );

    const branchCategories = useMemo(() => {
        const allCategories: BranchCategoryDetail[] = [];
        branchCategoriesInfinite.data?.pages.forEach((page) => {
            if (page.results) {
                allCategories.push(...page.results.filter((c) => !c.is_delete));
            }
        });
        return allCategories;
    }, [branchCategoriesInfinite.data]);

    const branchCategoryOptions = useMemo(
        () => [
            { id: 'all', label: 'Barchasi', value: 'all' },
            ...branchCategories.map((c) => ({ id: String(c.id), label: c.name, value: String(c.id) })),
        ],
        [branchCategories],
    );

    const models = useMemo(() => {
        const allModels: ProductModel[] = [];
        modelsInfinite.data?.pages.forEach((page) => {
            if (page.results) {
                allModels.push(...page.results.filter((m) => !m.is_delete));
            }
        });
        return allModels;
    }, [modelsInfinite.data]);

    const modelOptions = useMemo(
        () => [
            { id: 'all', label: 'Barchasi', value: 'all' },
            ...models.map((m) => ({ id: String(m.id), label: m.name, value: String(m.id) })),
        ],
        [models],
    );

    const handleSearchSubmit = () => {
        setAppliedSearch(searchInput);
    };

    const handleClear = () => {
        setSearchInput('');
        setAppliedSearch('');
        setSelectedBranch(null);
        setSelectedBranchCategory(null);
        setSelectedModel(null);
        setBranchCategorySearch('');
        setModelSearch('');
    };


    const handleImageClick = async (product: ProductItem) => {

        if (!product.id) return;

        setIsImageModalOpen(true);
        setIsLoadingImages(true);
        setCurrentImageIndex(0);

        try {
            const images = await productService.getProductImages(Number(product.id));
            setSelectedProductImages(images);
        } catch (error) {
            console.error('Failed to load product images:', error);
            setSelectedProductImages([]);
        } finally {
            setIsLoadingImages(false);
        }
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const threshold = 100;
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            if (
                scrollHeight - scrollTop <= clientHeight + threshold &&
                !isLoadingGrouped &&
                hasMoreGroups
            ) {
                groupedProductsInfinite.fetchNextPage();
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [isLoadingGrouped, hasMoreGroups, groupedProductsInfinite.fetchNextPage]);

    return (
        <div className='flex flex-col h-full min-h-0 bg-blue-50/30 overflow-hidden'>
            <div className='p-3 border-b border-blue-200/50 bg-white/90 backdrop-blur-sm'>
                <div className='flex gap-2'>
                    <div className='relative flex-1'>
                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                            <Search size={16} className='text-blue-600/70' />
                        </div>
                        <Input
                            type='text'
                            placeholder='Mahsulot qidirish...'
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchSubmit())}
                            className='pl-9 h-9 text-sm bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-200'
                        />
                    </div>
                    <button
                        type='button'
                        onClick={handleSearchSubmit}
                        title='Qidirish'
                        className='h-9 w-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shrink-0'
                    >
                        <Search size={18} />
                    </button>
                    <button
                        type='button'
                        onClick={handleClear}
                        title='Tozalash'
                        className='h-9 w-9 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-600 flex items-center justify-center shrink-0'
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            <div className='p-2 grid grid-cols-3 gap-2 border-b border-blue-200/50 bg-white/80 backdrop-blur-sm'>
                <Autocomplete
                    options={branchOptions}
                    value={selectedBranch?.toString() ?? 'all'}
                    onChange={(v) => setSelectedBranch(v === 'all' ? null : parseInt(v))}
                    placeholder={isLoadingBranches ? '...' : 'Kategoriya'}
                    className={`${filterAutocompleteClass} w-full min-w-0`}
                    emptyMessage='Kategoriya topilmadi'
                />
                <Autocomplete
                    options={branchCategoryOptions}
                    value={selectedBranchCategory?.toString() ?? 'all'}
                    onChange={(v) => {
                        if (v === 'all') {
                            setSelectedBranchCategory(null);
                        } else {
                            setSelectedBranchCategory(parseInt(v));
                        }
                        setSelectedModel(null);
                    }}
                    placeholder={branchCategoriesInfinite.isLoading ? '...' : 'Kategoriya turi'}
                    className={`${filterAutocompleteClass} w-full min-w-0`}
                    emptyMessage='Kategoriya turi topilmadi'
                    onSearchChange={setBranchCategorySearch}
                    onScrollToBottom={() => branchCategoriesInfinite.fetchNextPage()}
                    hasMore={!!branchCategoriesInfinite.hasNextPage}
                />
                <Autocomplete
                    options={modelOptions}
                    value={selectedModel?.toString() ?? 'all'}
                    onChange={(v) => {
                        if (v === 'all') {
                            setSelectedModel(null);
                        } else {
                            setSelectedModel(parseInt(v));
                        }
                    }}
                    placeholder={modelsInfinite.isLoading ? '...' : 'Model'}
                    className={`${filterAutocompleteClass} w-full min-w-0`}
                    emptyMessage='Model topilmadi'
                    onSearchChange={setModelSearch}
                    onScrollToBottom={() => modelsInfinite.fetchNextPage()}
                    hasMore={!!modelsInfinite.hasNextPage}
                />
            </div>

            <div ref={scrollContainerRef} className='flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 min-h-0'>
                {isLoadingGrouped && groupedProducts.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-12 text-gray-500'>
                        <Loader2 className='w-8 h-7 animate-spin text-blue-600 mb-4' />
                        <p className='text-sm'>Mahsulotlar yuklanmoqda...</p>
                    </div>
                ) : groupedProducts.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-12 text-gray-500'>
                        <Search size={48} className='mb-4 opacity-50' />
                        <p className='text-sm'>Mahsulotlar topilmadi</p>
                    </div>
                ) : (
                    groupedProducts.map((group) => (
                        <div key={group.model} className='mb-3'>
                            <div className='font-bold text-blue-700 text-sm mb-1'>
                                {group.model_detail?.name || 'Model'}
                                <span className='ml-2 text-xs text-gray-500'>({group.total_product_count} ta)</span>
                            </div>
                            <div className='space-y-1'>
                                {group.items.map((product: any) => (
                                    <button
                                        key={product.id}
                                        onClick={() => {
                                            onProductClick(product);
                                        }}
                                        className='w-full text-left p-1.5 bg-white hover:bg-blue-50 border border-transparent hover:border-blue-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex justify-between items-start group'
                                    >
                                        <div className='flex items-start space-x-2 flex-1 min-w-0'>
                                            {/* Product Image */}
                                            <div className='relative flex-shrink-0'>
                                                {product.images && product.images.file ? (
                                                    <img
                                                        src={product.images.file}
                                                        alt={product.name}
                                                        className='w-10 h-10 object-cover rounded border border-gray-200 group-hover:border-blue-300 transition-colors cursor-pointer'
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleImageClick(product);
                                                        }}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src =
                                                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect fill="%23e5e7eb" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="24"%3E%3F%3C/text%3E%3C/svg%3E';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className='w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center'>
                                                        <span className='text-gray-400 text-[10px]'>Rasm</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className='flex-1 min-w-0'>
                                                <div className='flex flex-wrap gap-1'>
                                                    {product.branch_detail?.name && (
                                                        <span className='text-[10px] text-orange-600 font-medium bg-orange-50 px-1.5 py-0.5 rounded'>
                                                            Kategoriya: {product.branch_detail.name}
                                                        </span>
                                                    )}
                                                    {product.model_detail?.name && (
                                                        <span className='text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded'>
                                                            Modeli: {product.model_detail.name}
                                                        </span>
                                                    )}
                                                    {product.type_detail?.name && (
                                                        <span className='text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded'>
                                                            Turi: {product.type_detail.name}
                                                        </span>
                                                    )}
                                                    {product.size_detail?.size && (
                                                        <span className='text-[10px] text-purple-600 font-medium bg-purple-50 px-1.5 py-0.5 rounded'>
                                                            O'lchami: {product.size_detail.size}{' '}
                                                            {product.size_detail.unit_code || ''}
                                                        </span>
                                                    )}
                                                    {product.count !== undefined && (
                                                        <span className='text-[10px] text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded'>
                                                            Soni: {product.count} {product.size_detail?.unit_code || ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}
                {isLoadingGrouped && groupedProducts.length > 0 && (
                    <div className='flex items-center justify-center py-4'>
                        <Loader2 className='w-6 h-6 animate-spin text-blue-600 mr-2' />
                        <span className='text-sm text-gray-500'>Yuklanmoqda...</span>
                    </div>
                )}
                {!hasMoreGroups && groupedProducts.length > 0 && (
                    <div className='flex items-center justify-center py-4'>
                        <span className='text-sm text-gray-400'>Barcha mahsulotlar ko'rsatildi</span>
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {isImageModalOpen && (
                <div
                    className='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4'
                    onClick={() => setIsImageModalOpen(false)}
                >
                    <div
                        className='bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col'
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className='flex justify-between items-center p-4 border-b border-gray-200'>
                            <h3 className='text-lg font-semibold text-gray-900'>
                                Mahsulot rasmlari ({currentImageIndex + 1} / {selectedProductImages.length})
                            </h3>
                            <button
                                onClick={() => setIsImageModalOpen(false)}
                                className='text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors'
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Image Container */}
                        <div className='flex-1 flex items-center justify-center p-6 bg-gray-50 relative min-h-[400px]'>
                            {isLoadingImages ? (
                                <div className='flex flex-col items-center gap-3'>
                                    <Loader2 className='w-8 h-7 animate-spin text-blue-600' />
                                    <p className='text-sm text-gray-500'>Rasmlar yuklanmoqda...</p>
                                </div>
                            ) : selectedProductImages.length > 0 ? (
                                <>
                                    {/* Previous Button */}
                                    {selectedProductImages.length > 1 && (
                                        <button
                                            onClick={() =>
                                                setCurrentImageIndex((prev) =>
                                                    prev === 0 ? selectedProductImages.length - 1 : prev - 1,
                                                )
                                            }
                                            className='absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all z-10'
                                        >
                                            <ChevronLeft size={24} className='text-gray-700' />
                                        </button>
                                    )}

                                    {/* Main Image */}
                                    <img
                                        src={selectedProductImages[currentImageIndex]?.file}
                                        alt={`Image ${currentImageIndex + 1}`}
                                        className='max-w-full max-h-[70vh] object-contain rounded-lg'
                                    />

                                    {/* Next Button */}
                                    {selectedProductImages.length > 1 && (
                                        <button
                                            onClick={() =>
                                                setCurrentImageIndex((prev) =>
                                                    prev === selectedProductImages.length - 1 ? 0 : prev + 1,
                                                )
                                            }
                                            className='absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all z-10'
                                        >
                                            <ChevronRight size={24} className='text-gray-700' />
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className='text-center text-gray-500'>
                                    <p>Rasmlar topilmadi</p>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {selectedProductImages.length > 1 && (
                            <div className='p-4 border-t border-gray-200 bg-white'>
                                <div className='flex gap-2 overflow-x-auto pb-2'>
                                    {selectedProductImages.map((img, index) => (
                                        <button
                                            key={img.id}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                                                ? 'border-blue-500 ring-2 ring-blue-200'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <img
                                                src={img.file}
                                                alt={`Thumbnail ${index + 1}`}
                                                className='w-full h-full object-cover'
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
