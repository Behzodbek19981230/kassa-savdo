import { useParams, useLocation } from 'react-router-dom';
import { KassaPage } from '../components/Kassa/KassaPage';
import { VozvratOrderList } from '../components/Kassa/VozvratOrderList';
import { VozvratOrderShowPage } from '../components/Kassa/VozvratOrderShowPage';

export function VozvratOrderPage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();

    // Agar pathname /tovar-qaytarish/new bo'lsa, yangi order yaratish
    if (location.pathname === '/tovar-qaytarish/new') {
        return <KassaPage isVozvratOrder={true} />;
    }

    // Agar URL /tovar-qaytarish/show/:id bo'lsa, VozvratOrderShowPage komponentini ko'rsatish
    const isShowPage = location.pathname.includes('/tovar-qaytarish/show/');
    if (isShowPage) {
        return <VozvratOrderShowPage />;
    }

    // Agar id yo'q bo'lsa, list ko'rsatish
    if (!id) {
        return <VozvratOrderList />;
    }

    // Agar URL /tovar-qaytarish/update/:id bo'lsa, updateMode
    const isUpdateMode = location.pathname.includes('/tovar-qaytarish/update/');

    return (
        <KassaPage
            orderId={parseInt(id)}
            readOnly={false}
            updateMode={isUpdateMode}
            isVozvratOrder={true}
        />
    );
}
