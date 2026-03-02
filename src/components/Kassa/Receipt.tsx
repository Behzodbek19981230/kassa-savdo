import { CartItem, Customer } from '../../types';
import { API_BASE_URL } from '../../constants';

interface ReceiptProps {
	items: CartItem[];
	totalAmount: number;
	usdAmount: string;
	usdRate: number;
	customer?: Customer;
	kassirName?: string;
	orderNumber: string;
	date: Date;
	paidAmount?: number; // To'langan summa
	remainingDebt?: number; // Qolgan qarz (agar mavjud bo'lsa)
	filialLogo?: string | null;
	filialName?: string;
	filialAddress?: string;
	filialPhone?: string;
	hodimLayout?: boolean;
}
function formatDate(date: Date) {
	return date
		.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		})
		.replace(/\//g, '.');
}

export function renderReceiptHtml(props: ReceiptProps) {
	const {
		items,
		totalAmount,
		usdRate,
		customer,
		kassirName,
		orderNumber,
		date,
		paidAmount = 0,
		remainingDebt,
		filialLogo,
		filialName = 'Elegant',
		filialAddress = '',
		filialPhone = '',
	} = props;

	const totalInUsd = totalAmount / usdRate;
	const paidInUsd = paidAmount / usdRate;
	const remaining = remainingDebt !== undefined ? remainingDebt : Math.max(0, totalAmount - paidAmount);
	const remainingInUsd = remaining / usdRate;

	const formattedDate = formatDate(date);
	const formattedDateTime = `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU', {
		hour: '2-digit',
		minute: '2-digit',
	})}`;
	const customerName = (customer as any)?.name || 'Mijoz';
	const logoUrl = filialLogo
		? filialLogo.startsWith('http')
			? filialLogo
			: filialLogo.startsWith('/')
				? filialLogo
				: '/' + filialLogo
		: '/logo.png';

	const rows = items
		.map((it, i) => {
			const priceInUsd = Math.round(Number(it.price || 0) / usdRate);
			const totalPriceInUsd = Math.round(Number(it.totalPrice || 0) / usdRate);
			const model = (it as any).modelName || '-';
			const unit = it.unit || (it as any).unitCode || '-';
			const joy = (it as any).joy || '';
			return `
        <tr>
          <td style="border:1px solid #000;padding:6px;text-align:center">${i + 1}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center">${escapeHtml(model)}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center">${escapeHtml(String(it.name || '-'))}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center">${Number(it.quantity || 0)}</td>
					<td style="border:1px solid #000;padding:6px;text-align:center">${escapeHtml(unit)}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center">${priceInUsd}</td>
          <td style="border:1px solid #000;padding:6px;text-align:center">${totalPriceInUsd}</td>
        </tr>`;
		})
		.join('\n');

	// If hodimLayout requested, build a simplified rows string using JOY, MODEL, NOMI, TIP, SONI
	const hodimRows = items
		.map((it, i) => {
			const joy = escapeHtml(((it as any).joy as string) || '');
			const model = escapeHtml(((it as any).modelName as string) || '-');
			const name = escapeHtml(String(it.name || '-'));
			const tip = escapeHtml(((it as any).unit as string) || '');
			const soni = Number(it.quantity || 0);
			return `
					<tr style="background:#e6fff0">
						<td style="border:1px solid #000;padding:6px;text-align:left">${joy}</td>
						<td style="border:1px solid #000;padding:6px;text-align:left">${model}</td>
						<td style="border:1px solid #000;padding:6px;text-align:left">${name}</td>
						<td style="border:1px solid #000;padding:6px;text-align:center">${tip}</td>
						<td style="border:1px solid #000;padding:6px;text-align:center">${soni}</td>
					</tr>`;
		})
		.join('\n');

	if (!props.hodimLayout) {
		const totalCount = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
		return `<!doctype html>
	<html>
	<head>
		<meta charset="utf-8" />
		<title>Order ${orderNumber}</title>
		<style>
			/* Force color printing where supported */
			* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
			@media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
			@page { size: A4; margin: 15mm; }
			body { font-family: "Times New Roman", serif; margin:0; padding:0; background:#fff }
			.page { width:210mm; padding: 10mm; box-sizing: border-box }
			table { width:100%; border-collapse:collapse; margin-top:20px; font-size:14px }
			th, td { border:1px solid #000; padding:8px; }
			th { background:#2f8f6f; color:#fff; font-weight:bold }
			tr { background: transparent }
			tr:nth-child(odd) td { }
			.center { text-align:center }
			.right { text-align:right }
			.signature { margin-top:60px }
		</style>
	</head>
	<body>
		<div class="page">
			<div style="text-align:center;margin-bottom:10px">
				<div style="font-weight:bold">Buyurtma sanasi: <span style="color:#d33">${escapeHtml(formattedDateTime)}</span></div>
				<div style="font-weight:bold">Mijoz: <span style="color:#d33">${escapeHtml(customer?.name || '')}</span> ${escapeHtml((customer as any)?.phone || '')}</div>
			</div>

			<table>
				<thead>
					<tr>
						<th>JOY</th>
						<th>MODEL</th>
						<th>NOMI</th>
						<th>TIP</th>
						<th>SONI</th>
					</tr>
				</thead>
				<tbody>
					${hodimRows}
					<tr>
						<td colspan="4" style="font-weight:bold">Jami</td>
						<td style="text-align:center;font-weight:bold">${totalCount}</td>
					</tr>
				</tbody>
			</table>

			<div class="signature">
				<div style="width:200px;border-top:1px solid #000;padding-top:6px">Shafyor: ${escapeHtml(kassirName || '')}</div>
			</div>
		</div>
	</body>
	</html>`;
	}

	return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Receipt ${orderNumber}</title>
    <style>
      @page { size: A4 landscape; margin: 10mm; }
      body { font-family: "Times New Roman", serif; margin:0; padding:0; background:#fff }
      .page { width: 297mm; padding: 10mm; box-sizing: border-box }
      img.print-logo { display:block; width:120px; height:auto; margin-bottom:12px }
      table { width:100%; border-collapse:collapse; margin-top:25px; font-size:14px }
      th, td { border:1px solid #000; padding:6px; text-align:center }
      th { background:#f5f5f5; font-weight:bold }
    </style>
  </head>
  <body>
    <div id="receipt-print" class="page">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div style="width:140px;flex-shrink:0">
          <img class="print-logo" src="${logoUrl}" alt="Logo" onerror="this.style.display='none'" />
        </div>
        <div style="flex:1;text-align:center;padding:0 10px">
          <div style="font-size:20px;font-weight:bold;margin-bottom:6px">${formattedDate}</div>
          <div style="font-size:20px;font-weight:bold;color:red">${escapeHtml(customerName)}</div>
        </div>
        <div style="width:140px"></div>
      </div>
      <hr style="margin:20px 0 30px" />

      <div style="display:flex;justify-content:space-between;gap:40px;font-size:15px">
        <div style="width:48%">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:bold">Do'kon:</span><span style="text-align:right">${escapeHtml(filialName)}</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:bold">Firma:</span><span style="text-align:right">${escapeHtml(filialName)}</span></div>
          ${filialPhone ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:bold">Telefon:</span><span style="text-align:right">${escapeHtml(filialPhone)}</span></div>` : ''}
        </div>
        <div style="width:48%">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:bold">${escapeHtml(filialName)}</span><span></span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:bold;color:green">Dollar kursi:</span><span style="text-align:right;color:green;font-weight:bold">${Number(usdRate).toLocaleString()} so'm</span></div>
          ${filialAddress ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:bold">Manzil:</span><span style="text-align:right">${escapeHtml(filialAddress)}</span></div>` : ''}
          ${filialPhone ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:bold">Telefon:</span><span style="text-align:right">${escapeHtml(filialPhone)}</span></div>` : ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>MODEL</th>
            <th>NOMI</th>
            <th>SONI</th>
            <th>TIP</th>
            <th>NARXI ($)</th>
            <th>UMUMIY NARXI ($)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr>
            <td colspan="6" style="text-align:center"><b>Jami</b></td>
            <td style="text-align:center"><b>${totalInUsd.toFixed(2)}</b></td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top:30px;display:flex;justify-content:space-between;font-size:16px">
        <div style="width:60%">
          <div style="color:orange;font-weight:bold;font-size:18px">Ostatka ($): ${totalInUsd.toFixed(2)} $</div>
          <div>Olingan tovarlar summasi ($): ${totalInUsd.toFixed(2)} $</div>
          <div>Jami to'langan summa ($): ${paidInUsd.toFixed(2)} $</div>
        </div>
        <div style="width:38%;text-align:right">To'langan summa dollarda ($): ${paidInUsd.toFixed(2)} $</div>
      </div>

      <div style="color:red;font-weight:bold;font-size:20px;margin-top:20px">Qolgan qarz ($): ${remainingInUsd.toFixed(2)} $</div>
    </div>
  </body>
  </html>`;
}

function escapeHtml(str: string) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
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
	paidAmount = 0,
	remainingDebt,
	filialLogo,
	filialName = 'Elegant',
	filialAddress = '',
	filialPhone = '',
}: ReceiptProps) {
	const totalInUsd = totalAmount / usdRate;
	const paidInUsd = paidAmount / usdRate;
	const remaining = remainingDebt !== undefined ? remainingDebt : Math.max(0, totalAmount - paidAmount);
	const remainingInUsd = remaining / usdRate;

	// Format date as DD.MM.YYYY
	const formattedDate = date
		.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		})
		.replace(/\//g, '.');

	// Customer name or default
	const customerName = customer?.name || 'Mijoz';

	// Build logo URL from filialLogo if provided (backend path) else fallback to /logo.png
	const logoUrl = filialLogo
		? filialLogo.startsWith('http')
			? filialLogo
			: `${API_BASE_URL.replace('/api', '')}${filialLogo.startsWith('/') ? filialLogo : '/' + filialLogo}`
		: '/logo.png';

	return (
		<div
			id='receipt-print'
			style={{
				fontFamily: '"Times New Roman", serif',
				margin: 0,
				padding: 0,
				display: 'flex',
				justifyContent: 'center',
			}}
		>
			<style>{`
				@page { size: A4 landscape; margin: 10mm; }
				@media print {
					html, body { width: 297mm; height: 210mm; margin: 0; padding: 0; }
					body { background: #fff; }
					#receipt-print { background: #fff; padding: 0; }
					.page { box-shadow: none; width: 277mm; margin: 0 auto; padding: 10mm; page-break-after: avoid; page-break-inside: avoid; }
					img.print-logo { display: block; width: 100px; height: auto; margin: 0; }
				}
				/* Screen preview - scaled A4 landscape */
				#receipt-print {
					width: 100%;
					overflow: auto;
				}
				#receipt-print .page { 
					width: 794px; /* A4 landscape at 72dpi: 297mm */
					min-height: 560px; /* A4 landscape at 72dpi: 210mm */
					margin: 0 auto; 
					background: #fff; 
					padding: 24px 32px;
					box-sizing: border-box;
					box-shadow: 0 2px 8px rgba(0,0,0,0.15);
					border: 1px solid #e0e0e0;
				}
				img.print-logo { display: block; width: 80px; height: auto; margin-bottom: 6px; }
			`}</style>
			<div className='page'>
				{/* Logo top-left (place logo at /logo.png or adjust) */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						marginBottom: '8px',
					}}
				>
					<div style={{ width: '100px', flexShrink: 0 }}>
						<img
							className='print-logo'
							src={logoUrl}
							alt='Logo'
							onError={(e) => {
								(e.currentTarget as HTMLImageElement).style.display = 'none';
							}}
						/>
					</div>

					<div style={{ flex: 1, textAlign: 'center', padding: '0 8px' }}>
						<div className='date' style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
							{formattedDate}
						</div>
						<div className='client' style={{ fontSize: '16px', fontWeight: 'bold', color: 'red' }}>
							{customerName}
						</div>
					</div>

					<div style={{ width: '100px' }} />
				</div>

				<hr style={{ margin: '12px 0 16px' }} />

				{/* TOP INFO */}
				<div
					className='info'
					style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', fontSize: '12px' }}
				>
					{/* LEFT */}
					<div className='info-left' style={{ width: '48%' }}>
						<div
							className='row'
							style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
						>
							<span className='label' style={{ fontWeight: 'bold' }}>
								Do'kon:
							</span>
							<span className='value' style={{ textAlign: 'right' }}>
								{filialName}
							</span>
						</div>

						<div
							className='row'
							style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
						>
							<span className='label' style={{ fontWeight: 'bold' }}>
								Firma:
							</span>
							<span className='value' style={{ textAlign: 'right' }}>
								{filialName}
							</span>
						</div>

						{filialPhone && (
							<div
								className='row'
								style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
							>
								<span className='label' style={{ fontWeight: 'bold' }}>
									Telefon:
								</span>
								<span className='value' style={{ textAlign: 'right' }}>
									{filialPhone}
								</span>
							</div>
						)}
					</div>

					{/* RIGHT */}
					<div className='info-right' style={{ width: '48%' }}>
						<div
							className='row'
							style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
						>
							<span className='label' style={{ fontWeight: 'bold' }}>
								{filialName}
							</span>
							<span className='value' style={{ textAlign: 'right' }}></span>
						</div>

						<div
							className='row'
							style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
						>
							<span className='label green' style={{ fontWeight: 'bold', color: 'green' }}>
								Dollar kursi:
							</span>
							<span
								className='value green'
								style={{ textAlign: 'right', color: 'green', fontWeight: 'bold' }}
							>
								{usdRate.toLocaleString()} so'm
							</span>
						</div>

						{filialAddress && (
							<div
								className='row'
								style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
							>
								<span className='label' style={{ fontWeight: 'bold' }}>
									Manzil:
								</span>
								<span className='value' style={{ textAlign: 'right' }}>
									{filialAddress}
								</span>
							</div>
						)}

						{filialPhone && (
							<div
								className='row'
								style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
							>
								<span className='label' style={{ fontWeight: 'bold' }}>
									Telefon:
								</span>
								<span className='value' style={{ textAlign: 'right' }}>
									{filialPhone}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* TABLE */}
				<table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', fontSize: '11px' }}>
					<thead>
						<tr>
							<th
								style={{
									border: '1px solid #000',
									padding: '3px 4px',
									textAlign: 'center',
									background: '#f5f5f5',
									fontWeight: 'bold',
								}}
							>
								№
							</th>
							<th
								style={{
									border: '1px solid #000',
									padding: '3px 4px',
									textAlign: 'center',
									background: '#f5f5f5',
									fontWeight: 'bold',
								}}
							>
								MODEL
							</th>
							<th
								style={{
									border: '1px solid #000',
									padding: '3px 4px',
									textAlign: 'center',
									background: '#f5f5f5',
									fontWeight: 'bold',
								}}
							>
								NOMI
							</th>
							<th
								style={{
									border: '1px solid #000',
									padding: '3px 4px',
									textAlign: 'center',
									background: '#f5f5f5',
									fontWeight: 'bold',
								}}
							>
								SONI
							</th>
							<th
								style={{
									border: '1px solid #000',
									padding: '3px 4px',
									textAlign: 'center',
									background: '#f5f5f5',
									fontWeight: 'bold',
								}}
							>
								TIP
							</th>
							<th
								style={{
									border: '1px solid #000',
									padding: '3px 4px',
									textAlign: 'center',
									background: '#f5f5f5',
									fontWeight: 'bold',
								}}
							>
								NARXI ($)
							</th>
							<th
								style={{
									border: '1px solid #000',
									padding: '3px 4px',
									textAlign: 'center',
									background: '#f5f5f5',
									fontWeight: 'bold',
								}}
							>
								UMUMIY ($)
							</th>
						</tr>
					</thead>
					<tbody>
						{items.map((it, i) => {
							const priceInUsd = (it.price / usdRate).toFixed(0);
							const totalPriceInUsd = (it.totalPrice / usdRate).toFixed(0);
							return (
								<tr key={it.id}>
									<td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center' }}>
										{i + 1}
									</td>
									<td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center' }}>
										{(it as any).modelName || '-'}
									</td>
									<td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'left' }}>
										{it.name}
									</td>
									<td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center' }}>
										{it.quantity}
									</td>
									<td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'center' }}>
										{it.unit || it.unitCode || '-'}
									</td>
									<td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'right' }}>
										{priceInUsd}
									</td>
									<td style={{ border: '1px solid #000', padding: '2px 4px', textAlign: 'right' }}>
										{totalPriceInUsd}
									</td>
								</tr>
							);
						})}
						<tr>
							<td
								colSpan={6}
								style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'center' }}
							>
								<b>Jami</b>
							</td>
							<td style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'right' }}>
								<b>{totalInUsd.toFixed(2)}</b>
							</td>
						</tr>
					</tbody>
				</table>

				{/* SUMMARY */}
				<div
					className='summary'
					style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}
				>
					<div className='summary-left' style={{ width: '60%' }}>
						<div className='orange' style={{ color: 'orange', fontWeight: 'bold', fontSize: '18px' }}>
							Ostatka ($): {totalInUsd.toFixed(2)} $
						</div>
						<div>Olingan tovarlar summasi ($): {totalInUsd.toFixed(2)} $</div>
						<div>Jami to'langan summa ($): {paidInUsd.toFixed(2)} $</div>
					</div>

					<div className='summary-right' style={{ width: '38%', textAlign: 'right' }}>
						To'langan summa dollarda ($): {paidInUsd.toFixed(2)} $
					</div>
				</div>

				<div className='red' style={{ color: 'red', fontWeight: 'bold', fontSize: '20px', marginTop: '20px' }}>
					Qolgan qarz ($): {remainingInUsd.toFixed(2)} $
				</div>
			</div>
		</div>
	);
}
