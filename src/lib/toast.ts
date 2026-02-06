import toast from 'react-hot-toast';

// Success toast
export const showSuccess = (message: string) => {
	return toast.success(message, {
		duration: 3000,
		position: 'top-right',
	});
};

// Error toast
export const showError = (message: string) => {
	return toast.error(message, {
		duration: 4000,
		position: 'top-right',
	});
};

// Loading toast
export const showLoading = (message: string) => {
	return toast.loading(message, {
		position: 'top-right',
	});
};

// Info toast
export const showInfo = (message: string) => {
	return toast(message, {
		duration: 3000,
		position: 'top-right',
		icon: 'ℹ️',
	});
};

// Promise toast (for async operations)
export const showPromise = <T,>(
	promise: Promise<T>,
	messages: {
		loading: string;
		success: string;
		error: string;
	}
) => {
	return toast.promise(promise, messages, {
		position: 'top-right',
	});
};
