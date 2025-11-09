
import React, { useEffect, useRef } from 'react';
import { Order, KitchenStatus, RestaurantSettings } from '../types';

interface BarDisplayProps {
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    settings: RestaurantSettings;
    playNotificationSound: () => void;
    playNewOrderSound: () => void;
}

const BarDisplay: React.FC<BarDisplayProps> = ({ orders, setOrders, settings, playNotificationSound, playNewOrderSound }) => {
    
    const activeOrders = orders
        .map(order => {
            const barItems = order.items.filter(item => 
                settings.kotBotCategoryAssignments.bar.includes(item.menuItem.category)
            );

            if (barItems.length > 0) {
                return { ...order, items: barItems };
            }
            return null;
        })
        .filter((order): order is Order => order !== null && (order.status === 'active' || order.status === 'billed'));

    const prevOrdersRef = useRef<Map<string, number | undefined>>();

    useEffect(() => {
        const currentOrdersMap = new Map(activeOrders.map(o => [o.id, o.bot]));

        if (prevOrdersRef.current) { // Don't play on initial load
            const hasNewOrder = activeOrders.some(order => {
                const prevBot = prevOrdersRef.current!.get(order.id);
                // It's a new order if it wasn't there before, or if the BOT number has changed.
                return !prevOrdersRef.current!.has(order.id) || (order.bot !== undefined && order.bot !== prevBot);
            });
            
            if (hasNewOrder) {
                playNewOrderSound();
            }
        }
        
        prevOrdersRef.current = currentOrdersMap;
    }, [activeOrders, playNewOrderSound]);


    const handleStatusChange = (orderId: string, newStatus: KitchenStatus) => {
        const order = orders.find(o => o.id === orderId);
        if (order && order.kitchenStatus !== 'Ready' && newStatus === 'Ready') {
            playNotificationSound();
        }

        setOrders(currentOrders => 
            currentOrders.map(o => o.id === orderId ? { ...o, kitchenStatus: newStatus } : o)
        );
    };

    const OrderTicket: React.FC<{ order: Order }> = ({ order }) => {
        const statusColors: { [key in KitchenStatus]: string } = {
            Pending: 'bg-gray-500',
            Preparing: 'bg-yellow-500',
            Ready: 'bg-green-500',
        };
        const borderColor = order.status === 'billed' ? 'border-blue-500' : `border-${statusColors[order.kitchenStatus || 'Pending'].split('-')[1]}-500`;

        return (
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col h-full border-t-8 ${borderColor}`}>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                            {order.orderType === 'dine-in' ? `Table ${order.tableId?.replace('T','')}` : `Takeaway #${order.takeawayNumber}`}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Order ID: {order.id.slice(-6)}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${statusColors[order.kitchenStatus || 'Pending']}`}>
                        {order.kitchenStatus}
                    </span>
                </div>
                <ul className="flex-1 overflow-y-auto p-4 space-y-2 text-sm">
                    {order.items.map(item => (
                        <li key={item.cartItemId} className="pb-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                            <div className="flex justify-between">
                                <span className="font-bold text-gray-800 dark:text-gray-100">{item.quantity}x {item.menuItem.name}</span>
                            </div>
                            {item.note && <p className="text-xs italic text-red-500 ml-4">- {item.note}</p>}
                        </li>
                    ))}
                </ul>
                <div className="p-3 bg-gray-100 dark:bg-gray-900/50 mt-auto">
                    <div className="grid grid-cols-3 gap-2">
                        {(['Pending', 'Preparing', 'Ready'] as KitchenStatus[]).map(status => (
                             <button
                                key={status}
                                onClick={() => handleStatusChange(order.id, status)}
                                disabled={order.kitchenStatus === status || order.status === 'billed'}
                                className={`px-2 py-2 text-xs font-bold text-white rounded-md transition-colors ${statusColors[status]} 
                                ${order.kitchenStatus === status ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}
                                ${order.status === 'billed' ? 'opacity-50 cursor-not-allowed' : `hover:opacity-80`}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    };

    return (
        <div className="p-4">
             <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Bar Display</h2>
             {activeOrders.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-xl text-gray-500">No active bar orders.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeOrders.map(order => (
                        <OrderTicket key={order.id} order={order} />
                    ))}
                </div>
             )}
        </div>
    );
};

export default BarDisplay;
