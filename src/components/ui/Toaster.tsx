import { Toaster as HotToaster } from 'react-hot-toast';

export function Toaster() {
	return (
		<HotToaster
			position="top-right"
			reverseOrder={false}
			gutter={12}
			containerClassName="!top-4 !right-4"
			toastOptions={{
				// Default options
				duration: 4000,
				style: {
					background: '#fff',
					color: '#363636',
					padding: '16px 20px',
					borderRadius: '12px',
					boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
					border: '2px solid',
					maxWidth: '420px',
					minWidth: '320px',
					fontSize: '14px',
					fontWeight: '500',
				},
				// Success toast
				success: {
					duration: 3000,
					iconTheme: {
						primary: '#10b981',
						secondary: '#fff',
					},
					style: {
						borderColor: '#10b981',
						background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
						color: '#065f46',
					},
					className: 'toast-success',
				},
				// Error toast
				error: {
					duration: 4000,
					iconTheme: {
						primary: '#ef4444',
						secondary: '#fff',
					},
					style: {
						borderColor: '#ef4444',
						background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
						color: '#991b1b',
					},
					className: 'toast-error',
				},
				// Loading toast
				loading: {
					style: {
						borderColor: '#3b82f6',
						background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
						color: '#1e40af',
					},
					className: 'toast-loading',
				},
			}}
		/>
	);
}
