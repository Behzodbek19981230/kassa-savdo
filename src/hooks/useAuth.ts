import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, LoginResponse } from '../services/authService';
import { useAuth as useAuthContext } from '../contexts/AuthContext';

export const useLogin = () => {
	const queryClient = useQueryClient();
	const { setAuthData } = useAuthContext();

	return useMutation({
		mutationFn: async ({ username, password }: { username: string; password: string }) => {
			return await authService.login(username, password);
		},
		onSuccess: (data: LoginResponse) => {
			// Token va user ma'lumotlarini saqlash
			localStorage.setItem('auth_token', data.access_token);
			
			if (data.user) {
				localStorage.setItem('kassir', JSON.stringify(data.user));
				setAuthData(data.access_token, data.user);
			} else {
				// Agar user ma'lumotlari kelmasa, token dan foydalanish
				setAuthData(data.access_token, null);
			}
			
			queryClient.invalidateQueries({ queryKey: ['auth'] });
		},
		onError: (error) => {
			console.error('Login error:', error);
		},
	});
};
