import { KassaUpdate } from '@/components/Kassa/KassaUpdate';
import { useParams } from 'react-router-dom';

export default function UpdateOrder() {
	const { id } = useParams<{ id: string }>();
	const orderId = id ? parseInt(id) : undefined;
	return <KassaUpdate orderId={orderId} updateMode />;
}
