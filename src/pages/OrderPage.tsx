import { useNavigate } from 'react-router-dom';
import { KassaPage } from '../components/Kassa/KassaPage';

export function OrderPage() {
	const navigate = useNavigate();

	return <KassaPage onBack={() => navigate('/')} />;
}
