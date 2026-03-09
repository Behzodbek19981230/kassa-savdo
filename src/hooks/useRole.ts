import { useAuth } from '../contexts/AuthContext';

export function useRole() {
	const { user } = useAuth();

	const roleKeys = user?.role_detail?.map((r) => r.key) ?? [];

	const hasRole = (key: string) => roleKeys.includes(key);

	return {
		isSuperAdmin: hasRole('super_admin'),
		isAdmin: hasRole('admin'),
		isSeller: hasRole('seller'),
		isSkladManager: hasRole('sklad_manager'),
		isHeadManager: hasRole('head_manager'),
		isManager: hasRole('manager'),
		roleKeys,
		hasRole,
	};
}
