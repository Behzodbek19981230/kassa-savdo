import { QRCodeSVG } from 'qrcode.react';
import { CartItem } from './types';
import { Customer } from './types';

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
  date
}: ReceiptProps) {
  return (
    <div className="bg-white p-6 max-w-sm mx-auto" style={{ fontFamily: 'monospace' }}>
      {/* Header */}
      <div className="text-center mb-4 border-b-2 border-gray-300 pb-4">
        <h1 className="text-2xl font-bold mb-2">KASSA MODULI</h1>
        <p className="text-sm text-gray-600">Savdo cheki</p>
        <p className="text-xs text-gray-500 mt-1">Order: #{orderNumber}</p>
      </div>

      {/* Date & Kassir */}
      <div className="mb-4 text-sm">
        <p className="flex justify-between">
          <span className="text-gray-600">Sana:</span>
          <span className="font-semibold">{date.toLocaleDateString('uz-UZ')}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-gray-600">Vaqt:</span>
          <span className="font-semibold">{date.toLocaleTimeString('uz-UZ')}</span>
        </p>
        {kassirName && (
          <p className="flex justify-between">
            <span className="text-gray-600">Sotuvchi:</span>
            <span className="font-semibold">{kassirName}</span>
          </p>
        )}
      </div>

      {/* Customer */}
      {customer && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-semibold mb-1">Mijoz:</p>
          <p className="text-sm">{customer.name}</p>
          {customer.phone && <p className="text-xs text-gray-600">{customer.phone}</p>}
        </div>
      )}

      {/* Items */}
      <div className="mb-4 border-b-2 border-gray-300 pb-4">
        <div className="text-sm space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold">{index + 1}. {item.name}</p>
                <p className="text-xs text-gray-600">
                  {item.quantity} {item.unit} × {item.price.toLocaleString()} UZS
                </p>
              </div>
              <p className="font-bold ml-2">{item.totalPrice.toLocaleString()} UZS</p>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="mb-4 space-y-2 text-sm">
        <div className="flex justify-between font-bold text-lg border-t-2 border-gray-300 pt-2">
          <span>Jami:</span>
          <span>{totalAmount.toLocaleString()} UZS</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>USD:</span>
          <span>{usdAmount} USD</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Kurs:</span>
          <span>1 USD = {usdRate.toLocaleString()} UZS</span>
        </div>
      </div>

      {/* QR Code */}
      <div className="text-center mb-4 pt-4 border-t-2 border-gray-300">
        <div className="inline-block p-3 bg-gray-50 rounded-lg">
          <QRCodeSVG
            value={`Order: ${orderNumber}\nTotal: ${totalAmount} UZS\nDate: ${date.toISOString()}`}
            size={120}
            level="M"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">QR kod orqali tekshiring</p>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
        <p>Rahmat!</p>
        <p className="mt-1">Qayta keling!</p>
      </div>
    </div>
  );
}
