import { useParams, useLocation } from 'react-router-dom';
import { KassaPage } from '../components/Kassa/KassaPage';
import { OrderShowPage } from '../components/Kassa/OrderShowPage';

export function OrderPage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();

    // Agar URL /order/show/:id bo'lsa, OrderShowPage komponentini ko'rsatish
    const isShowPage = location.pathname.includes('/order/show/');
    // Agar URL /order/update/:id bo'lsa, updateMode
    const isUpdateMode = location.pathname.includes('/order/update/');

    if (isShowPage) {
        return <OrderShowPage />;
    }

    return (
        <KassaPage
            orderId={id ? parseInt(id) : undefined}
            readOnly={false}
            updateMode={isUpdateMode}
        />
    );
}
