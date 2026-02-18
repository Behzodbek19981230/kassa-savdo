import { API_BASE_URL } from '../../constants';

interface DebtRepaymentReceiptProps {
    date: string;
    clientName: string;
    filialName?: string;
    exchangeRate: number;
    filialAddress?: string;
    filialPhone?: string;
    filialLogo?: string | null;
    oldDebt: number; // Ostatka ($)
    paidAmountDollar: number; // To'langan summa dollarda ($)
    totalPaidAmountDollar: number; // Jami to'langan summa ($)
    remainingDebt: number; // Qolgan qarz ($)
}

export function DebtRepaymentReceipt({
    date,
    clientName,
    filialName = "Elegant",
    exchangeRate,
    filialAddress,
    filialPhone,
    filialLogo,
    oldDebt,
    paidAmountDollar,
    totalPaidAmountDollar,
    remainingDebt,
}: DebtRepaymentReceiptProps) {
    // Format date as YYYY-MM-DD
    const formattedDate = date ? new Date(date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).replace(/\//g, '-') : '';

    // Logo URL ni yaratish
    const logoUrl = filialLogo 
        ? (filialLogo.startsWith('http') 
            ? filialLogo 
            : `${API_BASE_URL.replace('/api', '')}${filialLogo.startsWith('/') ? filialLogo : '/' + filialLogo}`)
        : null;

    return (
        <div id='debt-receipt-print' style={{ background: '#fff', fontFamily: '"Times New Roman", serif', margin: 0, padding: '20px 0' }}>
            <style>{`
				@media print {
					body {
						background: #fff;
					}
					#debt-receipt-print {
						background: #fff;
						padding: 0;
					}
					.page {
						box-shadow: none;
						width: 100%;
					}
				}
			`}</style>
            <div className='page' style={{ width: '100%', margin: 'auto', background: '#fff', padding: '30px 40px' }}>
                {/* Header with Date and Client Name */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    {/* Left - Logo */}
                    <div style={{ width: '180px', flexShrink: 0 }}>
                        {logoUrl ? (
                            <img 
                                src={logoUrl} 
                                alt="Logo" 
                                style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: '120px', 
                                    objectFit: 'contain',
                                    borderRadius: '8px'
                                }} 
                            />
                        ) : (
                            <div style={{ 
                                border: '2px solid #d4af37', 
                                padding: '15px', 
                                textAlign: 'center',
                                background: 'linear-gradient(135deg, #f5e6d3 0%, #fff8e7 100%)',
                                borderRadius: '8px',
                                minHeight: '120px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d4af37', fontFamily: 'serif', marginBottom: '5px' }}>ELEGANT</div>
                                <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>ORIGINAL</div>
                                <div style={{ fontSize: '9px', color: '#666' }}>FINE PORCELAIN</div>
                                <div style={{ fontSize: '9px', color: '#666' }}>MADE IN CHINA</div>
                            </div>
                        )}
                    </div>

                    {/* Center - Date and Client */}
                    <div style={{ flex: 1, textAlign: 'center', padding: '0 20px' }}>
                        <div className='date' style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>
                            {formattedDate}
                        </div>
                        <div className='client' style={{ fontSize: '22px', fontWeight: 'bold', color: 'red' }}>
                            {clientName}
                        </div>
                    </div>

                    {/* Right - Empty space for balance */}
                    <div style={{ width: '180px' }}></div>
                </div>

                <hr style={{ margin: '15px 0 20px' }} />

                {/* TOP INFO - Horizontal Layout */}
                <div className='info' style={{ display: 'flex', justifyContent: 'space-between', gap: '30px', fontSize: '14px', marginBottom: '30px' }}>
                    {/* LEFT */}
                    <div className='info-left' style={{ flex: 1 }}>
                        <div className='row' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span className='label' style={{ fontWeight: 'bold' }}>Do'kon:</span>
                            <span className='value' style={{ textAlign: 'right' }}>{filialName || 'Elegant'},</span>
                        </div>

                        <div className='row' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span className='label' style={{ fontWeight: 'bold' }}>Firma:</span>
                            <span className='value' style={{ textAlign: 'right' }}>{filialName || 'Elegant'},</span>
                        </div>

                        {filialPhone && (
                            <>
                                <div className='row' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span className='label' style={{ fontWeight: 'bold' }}>Telefon nomer:</span>
                                    <span className='value' style={{ textAlign: 'right' }}>{filialPhone},</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* RIGHT */}
                    <div className='info-right' style={{ flex: 1 }}>
                        <div className='row' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span className='label' style={{ fontWeight: 'bold', color: 'green' }}>Dollar kursi:</span>
                            <span className='value' style={{ textAlign: 'right', color: 'green', fontWeight: 'bold' }}>
                                {exchangeRate.toLocaleString()} so'm
                            </span>
                        </div>

                        {filialAddress && (
                            <div className='row' style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span className='label' style={{ fontWeight: 'bold' }}>Manzil:</span>
                                <span className='value' style={{ textAlign: 'right' }}>
                                    {filialAddress}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Debt Calculation Section */}
                <div className='debt-section' style={{ marginTop: '30px' }}>
                    <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
                        To'langan qarz hisobi:
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '16px', gap: '40px' }}>
                        {/* Left side */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: 'orange', fontWeight: 'bold' }}>Ostatka ($):</span>
                                <span style={{ color: 'orange', fontWeight: 'bold' }}>
                                    {oldDebt.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                                </span>
                            </div>
                        </div>

                        {/* Right side */}
                        <div style={{ flex: 1, textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: 'blue', fontWeight: 'bold' }}>To'langan summa dollarda ($):</span>
                                <span style={{ fontWeight: 'bold' }}>
                                    {paidAmountDollar.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '15px', fontSize: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ fontWeight: 'bold' }}>Jami to'langan summa ($):</span>
                            <span style={{ fontWeight: 'bold' }}>
                                {totalPaidAmountDollar.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                            </span>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', fontSize: '20px', fontWeight: 'bold' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'red' }}>Qolgan qarz ($):</span>
                            <span style={{ color: 'red' }}>
                                {remainingDebt.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
