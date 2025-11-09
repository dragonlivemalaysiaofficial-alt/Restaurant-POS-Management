import React from 'react';
import { Order, RestaurantSettings } from '../types';

interface KOTPrintProps {
  order: Order;
  settings: RestaurantSettings;
  type: 'KOT' | 'BOT';
  ticketNumber: number;
}

const KOTPrint: React.FC<KOTPrintProps> = ({ order, settings, type, ticketNumber }) => {
  const items = order.items.filter(item => {
    const assignments = settings.kotBotCategoryAssignments;
    if (type === 'KOT') {
      return assignments.kitchen.includes(item.menuItem.category);
    }
    return assignments.bar.includes(item.menuItem.category);
  });

  if (items.length === 0) return null;

  return (
    <div className="hidden print-area">
      <div className="p-4 bg-white text-black text-sm font-mono" style={{ width: '80mm', margin: '0 auto' }}>
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold">{type} #{ticketNumber}</h1>
        </div>
        <div className="mb-2 text-xs border-t border-b border-dashed border-black py-2">
          {order.orderType === 'dine-in' && <p className="font-bold text-base">Table: {order.tableId?.replace('T', '')}</p>}
          {order.orderType === 'takeaway' && order.takeawayNumber && <p className="font-bold text-base">Takeaway #: {order.takeawayNumber}</p>}
          <p>Time: {new Date().toLocaleTimeString()}</p>
          <p>Server: {order.createdBy}</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-dashed border-black">
              <th className="text-left pb-1 text-lg">QTY</th>
              <th className="text-left pb-1 text-lg">ITEM</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
             <React.Fragment key={item.cartItemId}>
                <tr className="font-bold text-base">
                  <td className="pt-2 w-1/4 align-top">{item.quantity}x</td>
                  <td className="pt-2 w-3/4">{item.menuItem.name}</td>
                </tr>
                {item.note && (
                  <tr>
                    <td></td>
                    <td className="text-sm italic font-semibold pb-2 border-b border-dashed border-black">
                      --{">"} {item.note}
                    </td>
                  </tr>
                )}
                {!item.note && (
                    <tr>
                        <td colSpan={2} className="pb-2 border-b border-dashed border-black"></td>
                    </tr>
                )}
             </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KOTPrint;