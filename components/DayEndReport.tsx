
import React, { useMemo } from 'react';
import { DaySession, Order, RestaurantSettings, PaymentMethod } from '../types';
import Modal from './Modal';
import { PrintIcon, CancelIcon, SaveIcon } from './Icons';

interface DayEndReportProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    session: DaySession;
    orders: Order[];
    settings: RestaurantSettings;
}

const DayEndReport: React.FC<DayEndReportProps> = ({ isOpen, onClose, onConfirm, session, orders, settings }) => {
    
    const sessionOrders = useMemo(() => {
        return orders.filter(o => new Date(o.date) >= session.startTime && o.status === 'paid');
    }, [orders, session]);

    const summary = useMemo(() => {
        const totalRevenue = sessionOrders.reduce((sum, o) => sum + o.total, 0);
        const totalTax = sessionOrders.reduce((sum, o) => sum + o.tax, 0);
        const totalDiscounts = sessionOrders.reduce((sum, o) => sum + (o.totalDiscountAmount || 0), 0);
        const paymentMethods: { [key in PaymentMethod]: number } = { cash: 0, card: 0, bank: 0 };
        sessionOrders.forEach(o => {
            if (o.paymentMethod) {
                paymentMethods[o.paymentMethod] += o.total;
            }
        });
        const salesByType = {
            'dine-in': sessionOrders.filter(o => o.orderType === 'dine-in').reduce((sum, o) => sum + o.total, 0),
            'takeaway': sessionOrders.filter(o => o.orderType === 'takeaway').reduce((sum, o) => sum + o.total, 0),
        };

        return { totalRevenue, totalTax, totalDiscounts, paymentMethods, salesByType, orderCount: sessionOrders.length };
    }, [sessionOrders]);

    const handlePrint = () => {
        const printContent = document.getElementById('day-end-report-content');
        if (printContent) {
            const originalContent = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContent;
            window.location.reload(); // To re-attach React listeners
        }
    };
    

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
            <div id="day-end-report-content">
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">End of Day Report (Z-Report)</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Session started by {session.startedBy} at {session.startTime.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Report generated at {new Date().toLocaleString()}</p>
                </div>
                <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="text-center pb-2 border-b-2 border-dashed">
                        <p className="text-gray-600 dark:text-gray-300">Total Sales</p>
                        <p className="text-3xl font-bold text-primary">{settings.currencySymbol}{summary.totalRevenue.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{summary.orderCount} orders</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                         <h4 className="font-semibold mb-1">Financial Summary</h4>
                         <div className="flex justify-between"><span>Total Tax:</span><span>{settings.currencySymbol}{summary.totalTax.toFixed(2)}</span></div>
                         <div className="flex justify-between"><span>Total Discounts:</span><span>{settings.currencySymbol}{summary.totalDiscounts.toFixed(2)}</span></div>
                       </div>
                       <div>
                         <h4 className="font-semibold mb-1">Sales by Type</h4>
                         <div className="flex justify-between"><span>Dine-In:</span><span>{settings.currencySymbol}{summary.salesByType['dine-in'].toFixed(2)}</span></div>
                         <div className="flex justify-between"><span>Takeaway:</span><span>{settings.currencySymbol}{summary.salesByType.takeaway.toFixed(2)}</span></div>
                       </div>
                    </div>
                     <div>
                         <h4 className="font-semibold mb-1">Sales by Payment Method</h4>
                         <div className="flex justify-between"><span>Cash:</span><span>{settings.currencySymbol}{summary.paymentMethods.cash.toFixed(2)}</span></div>
                         <div className="flex justify-between"><span>Card:</span><span>{settings.currencySymbol}{summary.paymentMethods.card.toFixed(2)}</span></div>
                         <div className="flex justify-between"><span>Bank Transfer:</span><span>{settings.currencySymbol}{summary.paymentMethods.bank.toFixed(2)}</span></div>
                       </div>
                </div>
            </div>
             <div className="mt-6 flex justify-between gap-3 no-print">
                <button onClick={handlePrint} className="flex items-center gap-2 w-full justify-center bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                    <PrintIcon /> Print Report
                </button>
                <button onClick={onConfirm} className="flex items-center w-full justify-center gap-2 bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
                    <SaveIcon /> Confirm & End Day
                </button>
            </div>
        </Modal>
    );
};

export default DayEndReport;
