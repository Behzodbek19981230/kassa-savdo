import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage as LoginForm } from '../components/Auth/LoginPage';

export function LoginPage() {
	const { isAuthenticated } = useAuth();
	const navigate = useNavigate();

	if (isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return <LoginForm onSuccess={() => navigate('/', { replace: true })} />;
}
