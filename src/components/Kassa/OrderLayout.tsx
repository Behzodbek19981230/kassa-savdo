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
        <div className='flex-1 flex flex-col md:flex-row gap-4 md:gap-0 min-h-0 h-full'>
            {/* Left: Product List - only show if not readOnly */}
            {!readOnly && leftSidebar && (
                <div className='w-full md:w-3/5 md:min-w-[320px] md:max-w-2xl md:border-r border-blue-200/50 bg-white md:bg-transparent flex flex-col min-h-0 overflow-hidden'>
                    {leftSidebar}
                </div>
            )}

            {/* Center: Cart (100% readOnly mode da, aks holda flex-1) */}
            <div
                className={
                    readOnly ? 'w-full h-full' : 'flex-1 h-full min-w-0 md:min-w-[240px] max-w-full md:max-w-full'
                }
            >
                {mainContent}
            </div>
        </div>
    );
}
