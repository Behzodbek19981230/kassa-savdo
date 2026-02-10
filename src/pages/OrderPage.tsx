import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { KassaPage } from '../components/Kassa/KassaPage';

export function OrderPage() {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const location = useLocation();
	
	// Agar URL /order/show/:id bo'lsa, readOnly mode
	const isReadOnly = location.pathname.includes('/order/show/');

	return <KassaPage onBack={() => navigate('/')} orderId={id ? parseInt(id) : undefined} readOnly={isReadOnly} />;
}
