import React from 'react';
import { Order, RestaurantSettings } from '../types';

interface SalesReportPrintProps {
  orders: Order[];
  settings: RestaurantSettings;
  title: string;
  summary: {
      revenue: number;
      orders: number;
      discounts: number;
      tax: number;
  };
}

const SalesReportPrint: React.FC<SalesReportPrintProps> = ({ orders, settings, title, summary }) => {
  return (
    <div className="hidden print-area">
      <div className="p-6 bg-white text-black text-sm font-sans">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{settings.restaurantName}</h1>
          <p className="text-xs">{settings.address} | {settings.phone}</p>
          <h2 className="text-lg font-semibold mt-4 border-t border-b py-2 border-black">{title}</h2>
          <p className="text-xs mt-1">Generated on: {new Date().toLocaleString()}</p>
        </div>
        
        <div className="mb-6 p-4 border-2 border-black">
            <h3 className="text-md font-bold text-center mb-2 underline">Report Summary</h3>
            <table className="w-full text-sm">
                <tbody>
                    <tr>
                        <td className="font-semibold pr-4">Total Revenue:</td>
                        <td className="text-right">{settings.currencySymbol}{summary.revenue.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td className="font-semibold pr-4">Total Orders:</td>
                        <td className="text-right">{summary.orders}</td>
                    </tr>
                    <tr>
                        <td className="font-semibold pr-4">Total Discounts Given:</td>
                        <td className="text-right">{settings.currencySymbol}{summary.discounts.toFixed(2)}</td>
                    </tr>
                     <tr>
                        <td className="font-semibold pr-4">Total Tax Collected:</td>
                        <td className="text-right">{settings.currencySymbol}{summary.tax.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <h3 className="text-md font-bold mb-2 underline">Transaction Details</h3>
        {orders.map((order, index) => (
          <div key={order.id} className={`py-4 ${index < orders.length - 1 ? 'border-b-2 border-dashed border-black' : ''}`}>
            <div className="mb-2 grid grid-cols-2 text-xs gap-x-4">
              <p><span className="font-bold">Order ID:</span> {order.id}</p>
              <p><span className="font-bold">Type:</span> <span style={{textTransform: 'capitalize'}}>{order.orderType}</span> {order.orderType === 'dine-in' ? `(Table ${order.tableId?.replace('T','')})` : `(#${order.takeawayNumber})`}</p>
              <p><span className="font-bold">Date:</span> {new Date(order.date).toLocaleString()}</p>
              <p><span className="font-bold">Server:</span> {order.createdBy}</p>
              {order.paymentMethod && <p><span className="font-bold">Payment:</span> <span style={{textTransform: 'capitalize'}}>{order.paymentMethod}</span></p>}
              {order.customer && <p><span className="font-bold">Customer:</span> {order.customer.name}</p>}
            </div>

            <table className="w-full mb-2 text-xs">
              <thead>
                <tr className="border-y border-black">
                  <th className="text-left py-1">Item</th>
                  <th className="text-center py-1">Qty</th>
                  <th className="text-right py-1">Price</th>
                  <th className="text-right py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                 <React.Fragment key={item.cartItemId}>
                    <tr>
                        <td className="pt-1">{item.menuItem.name}</td>
                        <td className="text-center pt-1">{item.quantity}</td>
                        <td className="text-right pt-1">{settings.currencySymbol}{item.menuItem.price.toFixed(2)}</td>
                        <td className="text-right pt-1">{settings.currencySymbol}{(item.menuItem.price * item.quantity).toFixed(2)}</td>
                    </tr>
                    {item.note && (
                      <tr>
                        <td colSpan={4} className="text-xs italic pl-2 pb-1">
                          Note: {item.note}
                        </td>
                      </tr>
                    )}
                 </React.Fragment>
                ))}
              </tbody>
            </table>
            
            <div className="space-y-1 text-xs mt-2 flex justify-end">
                <div className="w-1/2">
                    <div className="flex justify-between"><span>Subtotal:</span><span>{settings.currencySymbol}{order.subtotal.toFixed(2)}</span></div>
                     {order.discounts.map(d => (
                        <div key={d.id} className="flex justify-between">
                            <span>Discount ({d.description}):</span>
                            <span>-{settings.currencySymbol}{(d.type === 'percentage' ? order.subtotal * (d.value/100) : d.value).toFixed(2)}</span>
                        </div>
                     ))}
                    <div className="flex justify-between"><span>Tax ({order.taxRate}%):</span><span>{settings.currencySymbol}{order.tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold border-t border-black pt-1 mt-1">
                        <span>Order Total:</span>
                        <span>{settings.currencySymbol}{order.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
          </div>
        ))}

        <div className="text-center mt-8 text-xs">
            <p>*** End of Report ***</p>
        </div>
      </div>
    </div>
  );
};

export default SalesReportPrint;
