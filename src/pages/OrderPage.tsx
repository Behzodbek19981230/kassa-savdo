import { useParams, useLocation } from 'react-router-dom';
import { KassaPage } from '../components/Kassa/KassaPage';

export function OrderPage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();

    // Agar URL /order/show/:id bo'lsa, readOnly mode
    const isReadOnly = location.pathname.includes('/order/show/');
    // Agar URL /order/update/:id bo'lsa, updateMode
    const isUpdateMode = location.pathname.includes('/order/update/');

    return (
        <KassaPage
            orderId={id ? parseInt(id) : undefined}
            readOnly={isReadOnly}
            updateMode={isUpdateMode}
        />
    );
}
