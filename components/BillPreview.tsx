
import React from 'react';
import { Order, RestaurantSettings } from '../types';
import { LogoIcon } from './Icons';

interface BillPreviewProps {
  order: Order;
  settings: RestaurantSettings;
}

const BillPreview: React.FC<BillPreviewProps> = ({ order, settings }) => {
  return (
    <div className="p-4 bg-white text-black text-sm font-mono border border-gray-300 rounded-lg w-full max-w-xs mx-auto">
      <div className="text-center mb-4">
        <div className="flex justify-center mb-1">
          <LogoIcon />
        </div>
        <h1 className="text-lg font-bold">{settings.restaurantName}</h1>
        <p className="text-xs">{settings.address}</p>
        <p className="text-xs">Tel: {settings.phone}</p>
      </div>
       {order.customer && (
        <div className="mb-2 border-t border-dashed border-black pt-1 text-xs">
            <p className="font-bold">Customer:</p>
            <p>{order.customer.name}</p>
            <p>{order.customer.phone}</p>
        </div>
       )}
      <div className="mb-2 border-t border-b border-dashed border-black py-1">
        <p className="text-xs">Order ID: <span className="font-bold">{order.id.slice(-6)}</span></p>
        <p className="text-xs">Order Type: <span style={{textTransform: 'capitalize'}}>{order.orderType}</span></p>
        {order.orderType === 'dine-in' && <p className="text-xs">Table: {order.tableId?.replace('T', '')}{order.splitBillNumber ? ` (Bill ${order.splitBillNumber} of ${order.totalSplitBills})` : ''}</p>}
        {order.orderType === 'takeaway' && order.takeawayNumber && <p className="text-xs">Takeaway #: {order.takeawayNumber}</p>}
        <p className="text-xs">Date: {order.date.toLocaleString()}</p>
        <p className="text-xs">Server: {order.createdBy}</p>
        {order.paymentMethod && <p className="text-xs">Payment: <span style={{textTransform: 'capitalize'}}>{order.paymentMethod}</span></p>}
      </div>
      <table className="w-full mb-2 text-xs">
        <thead>
          <tr className="border-b-2 border-dashed border-black">
            <th className="text-left pb-1">Item</th>
            <th className="text-center pb-1">Qty</th>
            <th className="text-right pb-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map(item => (
          <React.Fragment key={item.cartItemId}>
              <tr>
                <td className="pt-1 w-3/5 break-words">{item.menuItem.name}</td>
                <td className="text-center pt-1">{item.quantity}</td>
                <td className="text-right pt-1">{settings.currencySymbol}{(item.menuItem.price * item.quantity).toFixed(2)}</td>
              </tr>
              {item.note && (
                <tr>
                  <td colSpan={3} className="text-xs italic pl-2 pb-1 border-b border-dashed border-black">
                    Note: {item.note}
                  </td>
                </tr>
              )}
              {!item.note && (
                  <tr>
                      <td colSpan={3} className="pb-1 border-b border-dashed border-black"></td>
                  </tr>
              )}
          </React.Fragment>
          ))}
        </tbody>
      </table>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between"><span>Subtotal:</span><span>{settings.currencySymbol}{order.subtotal.toFixed(2)}</span></div>
        {order.totalDiscountAmount && order.totalDiscountAmount > 0 && (
          <div className="flex justify-between"><span>Total Discount:</span><span>-{settings.currencySymbol}{order.totalDiscountAmount.toFixed(2)}</span></div>
        )}
        <div className="flex justify-between"><span>Tax ({order.taxRate}%):</span><span>{settings.currencySymbol}{order.tax.toFixed(2)}</span></div>
        <div className="flex justify-between font-bold text-base border-t-2 border-dashed border-black pt-1 mt-1">
          <span>TOTAL:</span>
          <span>{settings.currencySymbol}{order.total.toFixed(2)}</span>
        </div>
      </div>
      <div className="text-center mt-4 text-xs">
        <p>{settings.footerMessage}</p>
      </div>
    </div>
  );
};

export default BillPreview;