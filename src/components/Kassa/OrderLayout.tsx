import { ReactNode } from 'react';

interface OrderLayoutProps {
    leftSidebar?: ReactNode;
    mainContent: ReactNode;
    readOnly?: boolean;
}

/**
 * OrderPage uchun sub layout komponenti
 * Left sidebar (ProductList) va main content (Cart) ni boshqaradi
 */
export function OrderLayout({ leftSidebar, mainContent, readOnly = false }: OrderLayoutProps) {
    return (
        <div className='flex-1 flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 min-h-0 h-full'>
            {/* Left: Product List - only show if not readOnly */}
            {!readOnly && leftSidebar && (
                <div className='w-full sm:w-4/5 sm:min-w-[240px] md:w-2/5 md:min-w-[280px] md:max-w-[450px] lg:w-3/5 lg:min-w-[320px] lg:max-w-xl sm:border-r border-blue-200/50 bg-white sm:bg-transparent flex flex-col min-h-0 overflow-hidden'>
                    {leftSidebar}
                </div>
            )}

            {/* Center: Cart (100% readOnly mode da, aks holda flex-1) */}
            <div
                className={
                    readOnly
                        ? 'w-full h-full'
                        : 'flex-1 h-full min-w-0 sm:min-w-[200px] md:min-w-[240px] max-w-full'
                }
            >
                {mainContent}
            </div>
        </div>
    );
}
