import React from 'react';
import { Order, RestaurantSettings } from '../types';
import { LogoIcon } from './Icons';

interface BillPrintProps {
  order: Order;
  settings: RestaurantSettings;
  options: {
    billType: 'detailed' | 'summary';
    showCustomer: boolean;
  }
}

const BillPrint: React.FC<BillPrintProps> = ({ order, settings, options }) => {
  return (
    <div className="hidden print-area">
      <div className="p-6 bg-white text-black text-sm font-mono" style={{ width: '80mm', margin: '0 auto' }}>
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <LogoIcon />
          </div>
          <h1 className="text-xl font-bold">{settings.restaurantName}</h1>
          <p>{settings.address}</p>
          <p>Tel: {settings.phone}</p>
        </div>
        {options.showCustomer && order.customer && (
          <div className="mb-4 border-t border-dashed border-black pt-2">
            <p className="font-bold">Customer:</p>
            <p>{order.customer.name}</p>
            <p>{order.customer.phone}</p>
          </div>
        )}
        <div className="mb-4 border-t border-b border-dashed border-black py-2">
          <p>Order ID: <span className="font-bold">{order.id.slice(-6)}</span></p>
          <p>Order Type: <span style={{textTransform: 'capitalize'}}>{order.orderType}</span></p>
          {order.orderType === 'dine-in' && <p>Table: {order.tableId?.replace('T', '')}{order.splitBillNumber ? ` (Bill ${order.splitBillNumber} of ${order.totalSplitBills})` : ''}</p>}
          {order.orderType === 'takeaway' && order.takeawayNumber && <p>Takeaway #: {order.takeawayNumber}</p>}
          <p>Date: {order.date.toLocaleString()}</p>
          <p>Server: {order.createdBy}</p>
          {order.paymentMethod && <p>Payment: <span style={{textTransform: 'capitalize'}}>{order.paymentMethod}</span></p>}
        </div>
        {options.billType === 'detailed' && (
          <table className="w-full mb-4">
            <thead>
              <tr className="border-b-2 border-dashed border-black">
                <th className="text-left pb-1">Item</th>
                <th className="text-center pb-1">Qty</th>
                <th className="text-right pb-1">Price</th>
                <th className="text-right pb-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
              <React.Fragment key={item.cartItemId}>
                  <tr >
                    <td className="pt-1">{item.menuItem.name}</td>
                    <td className="text-center pt-1">{item.quantity}</td>
                    <td className="text-right pt-1">{settings.currencySymbol}{item.menuItem.price.toFixed(2)}</td>
                    <td className="text-right pt-1">{settings.currencySymbol}{(item.menuItem.price * item.quantity).toFixed(2)}</td>
                  </tr>
                  {item.note && (
                    <tr>
                      <td colSpan={4} className="text-xs italic pl-2 pb-1 border-b border-dashed border-black">
                        Note: {item.note}
                      </td>
                    </tr>
                  )}
                  {!item.note && (
                      <tr>
                          <td colSpan={4} className="pb-1 border-b border-dashed border-black"></td>
                      </tr>
                  )}
              </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
        <div className="space-y-1">
          <div className="flex justify-between"><span className="font-semibold">Subtotal:</span><span>{settings.currencySymbol}{order.subtotal.toFixed(2)}</span></div>
          {order.discounts && order.discounts.length > 0 && (
             order.discounts.map(d => (
                <div key={d.id} className="flex justify-between">
                    <span className="font-semibold">Discount ({d.description}):</span>
                    <span>-{settings.currencySymbol}{(d.type === 'percentage' ? order.subtotal * (d.value / 100) : d.value).toFixed(2)}</span>
                </div>
             ))
          )}
           {order.totalDiscountAmount && order.totalDiscountAmount > 0 && (
             <div className="flex justify-between"><span className="font-semibold">Total Discount:</span><span>-{settings.currencySymbol}{order.totalDiscountAmount.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between"><span className="font-semibold">Tax ({order.taxRate}%):</span><span>{settings.currencySymbol}{order.tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-lg border-t-2 border-dashed border-black pt-1 mt-1">
            <span>TOTAL:</span>
            <span>{settings.currencySymbol}{order.total.toFixed(2)}</span>
          </div>
        </div>

        {order.orderType === 'dine-in' && (
          <div className="mt-6 border-t border-dashed border-black pt-4 space-y-4">
            <div className="flex justify-between">
              <span className="font-semibold">Tip:</span>
              <span>_________________</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Total:</span>
              <span>_________________</span>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <p>{settings.footerMessage}</p>
        </div>
      </div>
    </div>
  );
};

export default BillPrint;