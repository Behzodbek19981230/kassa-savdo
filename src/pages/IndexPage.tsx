import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/Kassa/Dashboard';
import { DebtorDashboard } from '../components/Kassa/DebtorDashboard';
import { ROUTES } from '../constants';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

export function IndexPage() {
    const navigate = useNavigate();

    return (
        <Tabs defaultValue='sales' className='h-full flex flex-col'>
            <div className='bg-white px-4 py-3 sm:px-6 border-b border-gray-100'>
                <TabsList className='grid grid-cols-2'>
                    <TabsTrigger value='sales'>Savdo ro'yxati</TabsTrigger>
                    <TabsTrigger value='debtor'>Mijozdan qarzdorlik</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value='sales' className='flex-1 overflow-y-auto mt-0'>
                <Dashboard onNewSale={() => navigate(ROUTES.ORDER_CREATE)} />
            </TabsContent>
            <TabsContent value='debtor' className='flex-1 overflow-y-auto mt-0'>
                <DebtorDashboard />
            </TabsContent>
        </Tabs>
    );
}
