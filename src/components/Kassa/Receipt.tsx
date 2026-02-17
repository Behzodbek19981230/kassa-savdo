import { QRCodeSVG } from 'qrcode.react';
import { CartItem, Customer } from '../../types';

interface ReceiptProps {
	items: CartItem[];
	totalAmount: number;
	usdAmount: string;
	usdRate: number;
	customer?: Customer;
	kassirName?: string;
	orderNumber: string;
	date: Date;
}

export function Receipt({
	items,
	totalAmount,
	usdAmount,
	usdRate,
	customer,
	kassirName,
	orderNumber,
	date,
}: ReceiptProps) {
	// derive some sums for the styled totals block
	const paid = 0; // placeholder — PaymentModal already passes paid info if needed
	const remaining = Math.max(0, totalAmount - paid);

	return (
		<div id='receipt-print' className='w-full bg-white px-8 py-6' style={{ fontFamily: 'Times New Roman, serif' }}>
			<style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #receipt-print { width: 100%; }
        }
        .receipt-table th, .receipt-table td { border: 1px solid #111827; padding: 6px 8px; }
      `}</style>

			{/* Header: logo + store info + date */}
			<div className='flex items-start justify-between mb-4'>
				<div className='w-1/4'>
					<div className='border p-2 inline-block'>
						<div className='text-center font-bold text-lg'>ELEGANT</div>
						<div className='text-xs'>Fine Porcelain</div>
					</div>
				</div>

				<div className='flex-1 text-center'>
					<div className='text-xl font-extrabold'>{new Date().toLocaleDateString('uz-UZ')}</div>
					<div className='text-2xl font-bold text-red-600'>Oygul apa Chirchiq</div>
				</div>

				<div className='w-1/4 text-right text-sm'>
					<div className='text-green-700 font-semibold'>Dollar kursi:</div>
					<div className='text-green-700 text-lg font-bold'>{usdRate.toLocaleString()} so'm</div>
				</div>
			</div>

			{/* Store / contact info row */}
			<div className='mb-4 text-sm text-gray-700 grid grid-cols-3 gap-4'>
				<div>
					<div className='font-semibold'>Do'kon:</div>
					<div>Supermarket 1-2</div>
					<div>Firma: Elegant</div>
				</div>
				<div className='text-center'>
					<div className='font-semibold'>Manzil:</div>
					<div>Toshkent viloyati, Chirchiq shahri</div>
				</div>
				<div className='text-right'>
					<div className='font-semibold'>Telefon:</div>
					<div>+99899-793-62-87</div>
				</div>
			</div>

			{/* Items table */}
			<div className='mb-6 overflow-x-auto'>
				<table className='w-full receipt-table border-collapse text-sm'>
					<thead>
						<tr className='bg-gray-100'>
							<th className='text-left'>№</th>
							<th className='text-left'>MODEL</th>
							<th className='text-left'>NOMI</th>
							<th className='text-right'>SONI</th>
							<th className='text-left'>TIP</th>
							<th className='text-right'>NARXI ($)</th>
							<th className='text-right'>UMUMIY NARXI ($)</th>
						</tr>
					</thead>
					<tbody>
						{items.map((it, i) => (
							<tr key={it.id}>
								<td style={{ width: 30 }}>{i + 1}</td>
								<td>{(it as any).modelName || '-'}</td>
								<td>{it.name}</td>
								<td className='text-right'>{it.quantity}</td>
								<td>{it.unit || '-'}</td>
								<td className='text-right'>{(it.price / usdRate).toFixed(0)}</td>
								<td className='text-right'>{(it.totalPrice / usdRate).toFixed(0)}</td>
							</tr>
						))}
						<tr>
							<td colSpan={6} className='text-right font-semibold'>
								Jami
							</td>
							<td className='text-right font-bold'>{(totalAmount / usdRate).toFixed(2)}</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Totals summary styled similar to the sample */}
			<div className='grid grid-cols-3 gap-6 mb-8'>
				<div className='col-span-2'>
					<div className='text-sm text-yellow-700 font-semibold'>Ostaka ($):</div>
					<div className='text-2xl font-bold text-yellow-600'>{(totalAmount / usdRate).toFixed(2)} $</div>
					<div className='mt-2 text-sm text-gray-600'>Olingan tavarlar summasi ($): 160,00 $</div>
				</div>

				<div className='text-right'>
					<div className='text-sm text-blue-600'>To'langan summa dollarda ($):</div>
					<div className='text-lg font-bold text-blue-600'>0,00 $</div>
				</div>
			</div>

			<div className='text-lg font-bold text-rose-600'>Qolgan qarz ($): {(remaining / usdRate).toFixed(2)} $</div>

			{/* Footer small print */}
			<div className='mt-8 text-sm text-gray-600 border-t pt-4'>
				<div>Manzil: Toshkent viloyati, Chirchiq</div>
				<div>Telefon: +99899-811-00-23, +99890-812-94-44</div>
			</div>
		</div>
	);
}
