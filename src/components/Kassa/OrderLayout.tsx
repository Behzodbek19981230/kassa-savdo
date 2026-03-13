import { ReactNode } from 'react';

interface OrderLayoutProps {
    leftSidebar?: ReactNode | null;
    mainContent: ReactNode;
    readOnly?: boolean;
    updateMode?: boolean;
}

export function OrderLayout({ leftSidebar, mainContent, readOnly = false, updateMode = false }: OrderLayoutProps) {
    return (
        <div className='flex-1 flex flex-col sm:flex-row   min-h-0 h-full'>
            {!readOnly && !updateMode && leftSidebar && (
                <div className='w-full sm:w-1/4 sm:min-w-[240px] sm:max-w-[340px] md:w-2/5 md:min-w-[360px] md:max-w-[400px] lg:w-2/4 lg:min-w-[380px] lg:max-w-[470px] sm:border-r border-blue-200/50 bg-white sm:bg-transparent flex flex-col min-h-0 overflow-hidden'>
                    {leftSidebar}
                </div>
            )}

            <div
                className={
                    readOnly ? 'w-full h-full' : 'flex-1 h-full min-w-0 sm:min-w-[200px] md:min-w-[240px] max-w-full'
                }
            >
                {mainContent}
            </div>
        </div>
    );
}
