import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Dashboard } from '../components/Kassa/Dashboard';
import { DebtorDashboard } from '../components/Kassa/DebtorDashboard';
import { ROUTES } from '../constants';
import clsx from 'clsx';

export function IndexPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'sales' | 'debtor'>('sales');

    return (
        <div className='h-full flex flex-col'>
            {/* Tabs */}
            <div className='bg-white border-b border-gray-200 px-4 sm:px-6'>
                <div className='flex gap-1'>
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={clsx(
                            'px-4 py-3 text-sm font-semibold transition-colors border-b-2',
                            activeTab === 'sales'
                                ? 'text-blue-600 border-blue-600'
                                : 'text-gray-600 border-transparent hover:text-gray-900',
                        )}
                    >
                        Savdo ro'yxati
                    </button>
                    <button
                        onClick={() => setActiveTab('debtor')}
                        className={clsx(
                            'px-4 py-3 text-sm font-semibold transition-colors border-b-2',
                            activeTab === 'debtor'
                                ? 'text-blue-600 border-blue-600'
                                : 'text-gray-600 border-transparent hover:text-gray-900',
                        )}
                    >
                        Mijozdan qarzdorlik
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className='flex-1 overflow-y-auto'>
                {activeTab === 'sales' ? (
                    <Dashboard onNewSale={() => navigate(ROUTES.ORDER_CREATE)} />
                ) : (
                    <DebtorDashboard />
                )}
            </div>
        </div>
    );
}
