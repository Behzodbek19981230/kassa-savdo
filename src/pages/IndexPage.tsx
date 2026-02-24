import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/Kassa/Dashboard';

import { ROUTES } from '../constants';
import { StatisticsCards } from '@/components/Kassa/StatisticsCards';

export function IndexPage() {
    const navigate = useNavigate();

    return (
        <div className='h-full flex flex-col p-4 sm:p-6'>
            <Dashboard onNewSale={() => navigate(ROUTES.ORDER_CREATE)} />
            {/* <StatisticsCards /> */}
        </div>
    );
}
