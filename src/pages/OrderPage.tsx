import { useNavigate, useParams } from 'react-router-dom';
import { KassaPage } from '../components/Kassa/KassaPage';

export function OrderPage() {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();

	return <KassaPage onBack={() => navigate('/')} orderId={id ? parseInt(id) : undefined} />;
}
