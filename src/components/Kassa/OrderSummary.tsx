
interface OrderSummaryProps {
    totalAmount: number;
}

export function OrderSummary({
    totalAmount
}: OrderSummaryProps) {

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-blue-50/30 p-4">

            {/* Totals Section */}
            <div className="mt-4 space-y-4">


                {/* Total Display */}
                <div className="flex justify-between items-end px-2 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200">
                    <span className="text-gray-700 font-semibold">Yig'indi</span>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-blue-700">
                            {totalAmount.toLocaleString()}{' '}
                            <span className="text-sm font-normal text-blue-500">UZS</span>
                        </div>
                    </div>
                </div>



            </div>
        </div>);

}