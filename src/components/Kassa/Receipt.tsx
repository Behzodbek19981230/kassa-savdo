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
    paidAmount?: number; // To'langan summa
    remainingDebt?: number; // Qolgan qarz (agar mavjud bo'lsa)
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
}: ReceiptProps) {
    const totalInUsd = totalAmount / usdRate;
    const paidInUsd = paidAmount / usdRate;
    const remaining = remainingDebt !== undefined ? remainingDebt : Math.max(0, totalAmount - paidAmount);
    const remainingInUsd = remaining / usdRate;

    // Format date as DD.MM.YYYY
    const formattedDate = date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).replace(/\//g, '.');

    // Customer name or default
    const customerName = customer?.name || 'Mijoz';

    return (
        <div id='receipt-print' style={{ background: '#2b2b2b', fontFamily: '"Times New Roman", serif', margin: 0, padding: '40px 0' }}>
            <style>{`
				@media print {
					body {
						background: #fff;
					}
					#receipt-print {
						background: #fff;
						padding: 0;
					}
					.page {
						box-shadow: none;
						width: 100%;
					}
				}
			`}</style>
            <div className='page' style={{ width: '900px', margin: 'auto', background: '#fff', padding: '40px 50px' }}>
                {/* Date */}
                <div className='date' style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold' }}>
                    {formattedDate}
                </div>

                {/* Client */}
                <div className='client' style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', color: 'red', marginTop: '5px' }}>
                    {customerName}
                </div>

                <hr style={{ margin: '20px 0 30px' }} />

                {/* TOP INFO */}
                <div className='info' style={{ display: 'flex', justifyContent: 'space-between', gap: '40px', fontSize: '15px' }}>
                    {/* LEFT */}
                    <div className='info-left' style={{ width: '48%' }}>
                        <div className='row' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span className='label' style={{ fontWeight: 'bold' }}>Do'kon:</span>
                            <span className='value' style={{ textAlign: 'right' }}>Elegant</span>
                        </div>

                        <div className='row' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span className='label' style={{ fontWeight: 'bold' }}>Firma:</span>
                            <span className='value' style={{ textAlign: 'right' }}>Elegant</span>
                        </div>

                        <div className='row' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span className='label' style={{ fontWeight: 'bold' }}>Telefon nomer1:</span>
                            <span className='value' style={{ textAlign: 'right' }}>+99899-811-00-23</span>
                        </div>

                        <div className='row' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span className='label' style={{ fontWeight: 'bold' }}></span>
                            <span className='value' style={{ textAlign: 'right' }}>+99890-812-94-44</span>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className='info-right' style={{ width: '48%' }}>
                        <div className='row' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span className='label' style={{ fontWeight: 'bold' }}>Supermarket 1-2 Do'kon</span>
                            <span className='value' style={{ textAlign: 'right' }}></span>
                        </div>

                        <div className='row' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span className='label green' style={{ fontWeight: 'bold', color: 'green' }}>Dollar kursi:</span>
                            <span className='value green' style={{ textAlign: 'right', color: 'green', fontWeight: 'bold' }}>
                                {usdRate.toLocaleString()} so'm
                            </span>
                        </div>

                        <div className='row' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span className='label' style={{ fontWeight: 'bold' }}>Manzil:</span>
                            <span className='value' style={{ textAlign: 'right' }}>Toshkent viloyati, Chirchiq shahri</span>
                        </div>

                        <div className='row' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span className='label' style={{ fontWeight: 'bold' }}>Telefon:</span>
                            <span className='value' style={{ textAlign: 'right' }}>+99899-793-62-87</span>
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '25px', fontSize: '14px' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', background: '#f5f5f5', fontWeight: 'bold' }}>№</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', background: '#f5f5f5', fontWeight: 'bold' }}>MODEL</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', background: '#f5f5f5', fontWeight: 'bold' }}>NOMI</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', background: '#f5f5f5', fontWeight: 'bold' }}>SONI</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', background: '#f5f5f5', fontWeight: 'bold' }}>TIP</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', background: '#f5f5f5', fontWeight: 'bold' }}>NARXI ($)</th>
                            <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', background: '#f5f5f5', fontWeight: 'bold' }}>UMUMIY NARXI ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((it, i) => {
                            const priceInUsd = (it.price / usdRate).toFixed(0);
                            const totalPriceInUsd = (it.totalPrice / usdRate).toFixed(0);
                            return (
                                <tr key={it.id}>
                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{i + 1}</td>
                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{(it as any).modelName || '-'}</td>
                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{it.name}</td>
                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{it.quantity}</td>
                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{it.unit || it.unitCode || '-'}</td>
                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{priceInUsd}</td>
                                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>{totalPriceInUsd}</td>
                                </tr>
                            );
                        })}
                        <tr>
                            <td colSpan={6} style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                                <b>Jami</b>
                            </td>
                            <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
                                <b>{totalInUsd.toFixed(2)}</b>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* SUMMARY */}
                <div className='summary' style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
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
