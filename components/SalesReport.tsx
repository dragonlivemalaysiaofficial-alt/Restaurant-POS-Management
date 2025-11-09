
import React, { useMemo, useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Order, PaymentMethod, MenuItem, User, RestaurantSettings, Category, Customer } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { PrintIcon, UsersIcon, ReportIcon, DownloadIcon, SettingsIcon, GeminiIcon, CustomerIcon, BanIcon } from './Icons';
import SalesReportPrint from './SalesReportPrint';
import UserManager from './UserManager';
import AdminPanel from './AdminPanel';
import Modal from './Modal';
import CustomerManager from './CustomerManager';

interface SalesReportProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  settings: RestaurantSettings;
  setSettings: React.Dispatch<React.SetStateAction<RestaurantSettings>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

type ReportView = 'dashboard' | 'users' | 'customers' | 'admin' | 'cancellations';
type DateRangePreset = 'today' | 'month' | 'year' | 'custom';

const SalesReport: React.FC<SalesReportProps> = ({ orders, setOrders, menuItems, setMenuItems, categories, setCategories, settings, setSettings, users, setUsers, currentUser, customers, setCustomers }) => {
  const [activeView, setActiveView] = useState<ReportView>('dashboard');
  const [isPrinting, setIsPrinting] = useState(false);
  
  const today = new Date();
  const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({
    start: new Date(today.setHours(0, 0, 0, 0)),
    end: new Date(new Date().setHours(23, 59, 59, 999)),
  });
  const [activePreset, setActivePreset] = useState<DateRangePreset>('today');
  
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const filteredPaidOrders = useMemo(() => {
    return orders.filter(o => 
      o.status === 'paid' && 
      o.date >= dateRange.start && 
      o.date <= dateRange.end
    );
  }, [orders, dateRange]);

  useEffect(() => {
    if (isPrinting) {
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 500);
    }
  }, [isPrinting]);
  
  const setDatePreset = (preset: DateRangePreset) => {
    const now = new Date();
    let start = new Date(), end = new Date();

    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'custom':
        // Don't change the date range, user will use inputs
        break;
    }
    setActivePreset(preset);
    if (preset !== 'custom') {
      setDateRange({ start, end });
    }
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const newDate = new Date(e.target.value);
    if (type === 'start') {
        newDate.setHours(0, 0, 0, 0);
        setDateRange(prev => ({ ...prev, start: newDate }));
    } else {
        newDate.setHours(23, 59, 59, 999);
        setDateRange(prev => ({ ...prev, end: newDate }));
    }
    setActivePreset('custom');
  };

  const salesOverTime = useMemo(() => {
    const data: { [key: string]: { sales: number, discounts: number } } = {};
    const diffDays = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 3600 * 24);

    filteredPaidOrders.forEach(order => {
      let key;
      if (diffDays <= 31) { // Group by day
        key = order.date.toLocaleDateString('en-CA'); // YYYY-MM-DD
      } else { // Group by month
        key = order.date.toLocaleString('default', { month: 'short', year: 'numeric' });
      }
      if (!data[key]) {
        data[key] = { sales: 0, discounts: 0 };
      }
      data[key].sales += order.total;
      data[key].discounts += order.totalDiscountAmount || 0;
    });

    return Object.keys(data).map(key => ({
      name: key,
      sales: data[key].sales,
      discounts: data[key].discounts,
    })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [filteredPaidOrders, dateRange]);

  const topSellingItems = useMemo(() => {
      const itemCounts: { [key: string]: { name: string, count: number } } = {};
      filteredPaidOrders.forEach(order => {
          order.items.forEach(item => {
              if (!itemCounts[item.menuItem.id]) {
                  itemCounts[item.menuItem.id] = { name: item.menuItem.name, count: 0 };
              }
              itemCounts[item.menuItem.id].count += item.quantity;
          });
      });
      return Object.values(itemCounts).sort((a,b) => b.count - a.count).slice(0, 5);
  }, [filteredPaidOrders]);

  const peakHoursData = useMemo(() => {
    const hourlySales: { [key: number]: number } = {};
    for (let i = 0; i < 24; i++) hourlySales[i] = 0;
    filteredPaidOrders.forEach(order => {
        const hour = order.date.getHours();
        hourlySales[hour] += order.total;
    });
    return Object.keys(hourlySales).map(hour => ({
        name: `${parseInt(hour)}:00`,
        sales: hourlySales[parseInt(hour)],
    }));
  }, [filteredPaidOrders]);

  const totalRevenue = useMemo(() => filteredPaidOrders.reduce((sum, order) => sum + order.total, 0), [filteredPaidOrders]);
  const totalOrdersCount = filteredPaidOrders.length;
  const totalDiscounts = useMemo(() => filteredPaidOrders.reduce((sum, order) => sum + (order.totalDiscountAmount || 0), 0), [filteredPaidOrders]);
  const totalTax = useMemo(() => filteredPaidOrders.reduce((sum, order) => sum + order.tax, 0), [filteredPaidOrders]);

  const revenueByPaymentMethod = useMemo(() => {
    const initialData: { [key in PaymentMethod]: number } = { cash: 0, card: 0, bank: 0 };
    return filteredPaidOrders.reduce((acc, order) => {
      if (order.paymentMethod) {
        acc[order.paymentMethod] += order.total;
      }
      return acc;
    }, initialData);
  }, [filteredPaidOrders]);

  const pieChartData = [
    { name: 'Cash', value: revenueByPaymentMethod.cash },
    { name: 'Card', value: revenueByPaymentMethod.card },
    { name: 'Bank', value: revenueByPaymentMethod.bank },
  ].filter(d => d.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6'];
  
  const getReportTitle = () => {
      const start = dateRange.start.toLocaleDateString();
      const end = dateRange.end.toLocaleDateString();
      if (start === end) return `Daily Sales Report for ${start}`;
      return `Sales Report from ${start} to ${end}`;
  };

  const handleAnalyzeReport = async () => {
    if (filteredPaidOrders.length === 0) {
        alert("No data available to analyze for the selected period.");
        return;
    }
    setIsAnalyzing(true);
    setAnalysisResult('');
    setIsAnalysisModalOpen(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Analyze the following restaurant sales data for the period "${getReportTitle()}". Provide a concise summary (2-3 paragraphs) with key insights and potential suggestions for improvement. Be friendly and encouraging.
        
        Data:
        - Total Revenue: ${settings.currencySymbol}${totalRevenue.toFixed(2)}
        - Total Orders: ${totalOrdersCount}
        - Total Discounts: ${settings.currencySymbol}${totalDiscounts.toFixed(2)}
        - Top 5 Selling Items: ${topSellingItems.map(i => `${i.name} (${i.count} sold)`).join(', ') || 'N/A'}
        - Peak Hours (by revenue): ${peakHoursData.filter(h => h.sales > 0).sort((a,b) => b.sales - a.sales).slice(0, 3).map(h => `${h.name}`).join(', ') || 'N/A'}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt
        });

        setAnalysisResult(response.text);
    } catch (error) {
        console.error("Analysis failed:", error);
        setAnalysisResult("Sorry, I couldn't analyze the report at this time. Please check the API key and try again.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const renderDashboard = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 text-center">
        <div className="bg-emerald-50 dark:bg-emerald-900/50 p-4 rounded-lg">
            <h3 className="text-lg text-gray-600 dark:text-gray-300">Total Revenue</h3>
            <p className="text-3xl font-bold text-primary">{settings.currencySymbol}{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg">
            <h3 className="text-lg text-gray-600 dark:text-gray-300">Total Orders</h3>
            <p className="text-3xl font-bold text-blue-500">{totalOrdersCount}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/50 p-4 rounded-lg">
            <h3 className="text-lg text-gray-600 dark:text-gray-300">Total Discounts</h3>
            <p className="text-3xl font-bold text-secondary">{settings.currencySymbol}{totalDiscounts.toFixed(2)}</p>
        </div>
         <div className="bg-indigo-50 dark:bg-indigo-900/50 p-4 rounded-lg">
            <h3 className="text-lg text-gray-600 dark:text-gray-300">Total Tax Collected</h3>
            <p className="text-3xl font-bold text-indigo-500">{settings.currencySymbol}{totalTax.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Sales Over Time</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={salesOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="name" className="text-xs"/>
                <YAxis tickFormatter={(value) => `${settings.currencySymbol}${value}`} className="text-xs" />
                <Tooltip
                  formatter={(value: number, name: string) => [`${settings.currencySymbol}${value.toFixed(2)}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                  contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: '1px solid #4b5563', color: '#f3f4f6' }}
                  labelStyle={{ color: '#f9fafb' }}
                />
                <Legend />
                <Bar dataKey="sales" fill="#10b981" />
                <Bar dataKey="discounts" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Revenue by Payment Method</h3>
           <div style={{ width: '100%', height: 300 }}>
             <ResponsiveContainer>
                <PieChart>
                  {/* FIX: Coerce entry.percent to a number to prevent TypeScript errors. The unary plus operator (+) ensures the value is numeric before multiplication. */}
                  <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(entry) => `${entry.name} ${((+entry.percent || 0) * 100).toFixed(0)}%`}>
                    {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${settings.currencySymbol}${value.toFixed(2)}`} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: '1px solid #4b5563' }}/>
                  <Legend />
                </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Top 5 Selling Items</h3>
           <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
              {topSellingItems.length > 0 ? topSellingItems.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center py-2 border-b dark:border-gray-600 last:border-b-0">
                      <span className="font-medium text-gray-800 dark:text-gray-100">{index + 1}. {item.name}</span>
                      <span className="font-bold text-primary">{item.count} sold</span>
                  </div>
              )) : <p className="text-gray-500 text-center">No sales data for this period.</p>}
           </div>
        </div>
        <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Peak Hours (by Revenue)</h3>
             <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <LineChart data={peakHoursData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis tickFormatter={(value) => `${settings.currencySymbol}${value}`} className="text-xs" />
                        <Tooltip formatter={(value: number) => [`${settings.currencySymbol}${value.toFixed(2)}`, 'Sales']} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: '1px solid #4b5563' }} />
                        <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
             </div>
        </div>
      </div>
    </>
  );

  const renderCancellationsView = () => {
    const cancelledOrders = orders.filter(o => 
        o.status === 'cancelled' && 
        new Date(o.date) >= dateRange.start && 
        new Date(o.date) <= dateRange.end
    );

    const totalCancelledValue = cancelledOrders.reduce((sum, order) => sum + order.total, 0);

    return (
        <div>
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/50 rounded-lg text-center">
                <h4 className="text-lg text-gray-600 dark:text-gray-300">Total Cancelled Value</h4>
                <p className="text-3xl font-bold text-red-500">{settings.currencySymbol}{totalCancelledValue.toFixed(2)}</p>
                <p className="text-sm text-gray-500">{cancelledOrders.length} bills cancelled in this period</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Order Details</th>
                            <th scope="col" className="px-6 py-3">Items</th>
                            <th scope="col" className="px-6 py-3">Value</th>
                            <th scope="col" className="px-6 py-3">Reason</th>
                            <th scope="col" className="px-6 py-3">Cancelled By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cancelledOrders.map(order => (
                            <tr key={order.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                <td className="px-6 py-4">
                                    <p className="font-semibold text-gray-900 dark:text-white">ID: {order.id.slice(-6)}</p>
                                    <p className="text-xs">{new Date(order.date).toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <ul className="list-disc list-inside text-xs">
                                        {order.items.map(item => <li key={item.cartItemId}>{item.quantity}x {item.menuItem.name}</li>)}
                                    </ul>
                                </td>
                                <td className="px-6 py-4 font-bold">{settings.currencySymbol}{order.total.toFixed(2)}</td>
                                <td className="px-6 py-4 max-w-xs">{order.cancellationReason}</td>
                                <td className="px-6 py-4">{order.cancelledBy}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {cancelledOrders.length === 0 && <p className="text-center py-8 text-gray-500">No bills were cancelled in this period.</p>}
            </div>
        </div>
    );
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 no-print">
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Reports & Admin</h2>
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <button
                    onClick={() => setActiveView('dashboard')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'dashboard' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-600 dark:text-gray-300'}`}
                >
                    <ReportIcon /> Dashboard
                </button>
                {(currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
                  <>
                    <button
                        onClick={() => setActiveView('cancellations')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'cancellations' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        <BanIcon /> Cancellations
                    </button>
                    {(currentUser.role === 'Admin' || settings.managerPermissions?.canManageCustomers) &&
                        <button
                            onClick={() => setActiveView('customers')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'customers' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                            <CustomerIcon /> Customers
                        </button>
                    }
                    {(currentUser.role === 'Admin' || settings.managerPermissions?.canManageUsers) &&
                        <button
                            onClick={() => setActiveView('users')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'users' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                            <UsersIcon /> Users
                        </button>
                    }
                  </>
                )}
                {(currentUser.role === 'Admin' || (currentUser.role === 'Manager' && settings.managerPermissions?.canAccessAdminPanel)) && (
                     <button
                        onClick={() => setActiveView('admin')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'admin' ? 'bg-white dark:bg-gray-700 shadow text-primary' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        <SettingsIcon /> Admin
                    </button>
                )}
            </div>
        </div>

        {activeView === 'dashboard' || activeView === 'cancellations' ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex flex-wrap items-center gap-2">
                {(['today', 'month', 'year'] as DateRangePreset[]).map(preset => (
                  <button key={preset} onClick={() => setDatePreset(preset)} className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize ${activePreset === preset ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'}`}>{preset}</button>
                ))}
                <div className="flex items-center gap-2">
                  <input type="date" value={dateRange.start.toISOString().split('T')[0]} onChange={(e) => handleCustomDateChange(e, 'start')} className="p-1.5 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600" />
                  <span className="text-gray-500">-</span>
                  <input type="date" value={dateRange.end.toISOString().split('T')[0]} onChange={(e) => handleCustomDateChange(e, 'end')} className="p-1.5 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600" />
                </div>
              </div>
              {activeView === 'dashboard' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAnalyzeReport}
                    disabled={filteredPaidOrders.length === 0}
                    className="flex items-center gap-2 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed"
                    title="Analyze this report with AI"
                  >
                    <GeminiIcon /> <span className="hidden sm:inline">Analyze Report</span>
                  </button>
                  <button
                    onClick={() => setIsPrinting(true)}
                    disabled={filteredPaidOrders.length === 0}
                    className="flex items-center gap-2 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    <PrintIcon /> <span className="hidden sm:inline">Print</span>
                  </button>
                  <button
                    onClick={() => setIsPrinting(true)}
                    disabled={filteredPaidOrders.length === 0}
                    className="flex items-center gap-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    title="This opens the print dialog. Use your browser's 'Save as PDF' option to download the report."
                  >
                    <DownloadIcon /> <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              )}
            </div>
            {activeView === 'dashboard' && renderDashboard()}
            {activeView === 'cancellations' && renderCancellationsView()}
          </>
        ) : activeView === 'users' ? (
          <UserManager users={users} setUsers={setUsers} currentUser={currentUser} />
        ) : activeView === 'customers' ? (
          <CustomerManager customers={customers} setCustomers={setCustomers} orders={orders} settings={settings} />
        ) : (
          <AdminPanel settings={settings} setSettings={setSettings} setOrders={setOrders} setMenuItems={setMenuItems} categories={categories} setCategories={setCategories} currentUser={currentUser} />
        )}
      </div>
      {isPrinting && <SalesReportPrint 
          orders={filteredPaidOrders} 
          settings={settings} 
          title={getReportTitle()}
          summary={{
              revenue: totalRevenue,
              orders: totalOrdersCount,
              discounts: totalDiscounts,
              tax: totalTax
          }}
      />}
      <Modal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)}>
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><GeminiIcon /> AI Report Analysis</h3>
        {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-48">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-500">Analyzing data...</p>
            </div>
        ) : (
            <div className="prose prose-sm dark:prose-invert max-h-96 overflow-y-auto whitespace-pre-wrap font-sans">
                {analysisResult}
            </div>
        )}
      </Modal>
    </>
  );
};

export default SalesReport;
