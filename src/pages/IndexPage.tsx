import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/Kassa/Dashboard';

import { ROUTES } from '../constants';

export function IndexPage() {
    const navigate = useNavigate();


    return (
        <div className='h-full overflow-y-auto'>
            <div className='container mx-auto py-8'>
                <Dashboard onNewSale={() => navigate(ROUTES.ORDER_CREATE)} />
            </div>
        </div>
    );
}
