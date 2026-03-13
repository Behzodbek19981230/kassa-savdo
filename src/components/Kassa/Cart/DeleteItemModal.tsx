import { X, Trash2, Loader2 } from 'lucide-react';

interface DeleteItemModalProps {
	isOpen: boolean;
	isDeleting: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export function DeleteItemModal({ isOpen, isDeleting, onClose, onConfirm }: DeleteItemModalProps) {
	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
			<div className='bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-red-200'>
				<div className='flex justify-between items-center p-4 border-b-2 border-red-100 bg-red-50'>
					<h3 className='text-lg font-bold text-gray-900'>Mahsulotni o'chirish</h3>
					<button
						onClick={onClose}
						disabled={isDeleting}
						className='text-gray-500 hover:text-red-600 hover:bg-white p-1.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
					>
						<X size={18} />
					</button>
				</div>

				<div className='p-5 bg-white'>
					<p className='text-gray-700 mb-5'>
						Bu mahsulotni savdodan o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
					</p>

					<div className='flex gap-2 justify-end'>
						<button
							onClick={onClose}
							disabled={isDeleting}
							className='px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed'
						>
							Bekor qilish
						</button>
						<button
							onClick={onConfirm}
							disabled={isDeleting}
							className='px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 font-semibold text-xs shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5'
						>
							{isDeleting ? (
								<>
									<Loader2 className='w-4 h-4 animate-spin' />
									<span>O'chirilmoqda...</span>
								</>
							) : (
								<>
									<Trash2 className='w-4 h-4' />
									<span>Ha, o'chirish</span>
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
