
import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Customer, Order, RestaurantSettings } from '../types';
import Modal from './Modal';
import { AddIcon, EditIcon, TrashIcon, SaveIcon, CancelIcon, SearchIcon, GeminiIcon } from './Icons';

interface CustomerManagerProps {
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    orders: Order[];
    settings: RestaurantSettings;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ customers, setCustomers, orders, settings }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({ name: '', phone: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone.includes(searchQuery)
        );
    }, [customers, searchQuery]);

    const handleOpenModal = (customer: Customer | null = null) => {
        setEditingCustomer(customer);
        setCurrentCustomer(customer || { name: '', phone: '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
        setCurrentCustomer({ name: '', phone: '' });
    };

    const handleSaveCustomer = () => {
        if (!currentCustomer.name?.trim() || !currentCustomer.phone?.trim()) {
            alert("Please fill in both name and phone number.");
            return;
        }

        if (editingCustomer) {
            setCustomers(current => current.map(c => c.id === editingCustomer.id ? { ...c, ...currentCustomer } as Customer : c));
        } else {
            const newCustomer: Customer = {
                id: `CUST-${Date.now()}`,
                name: currentCustomer.name.trim(),
                phone: currentCustomer.phone.trim(),
            };
            setCustomers(current => [...current, newCustomer]);
        }
        handleCloseModal();
    };

    const handleDeleteCustomer = (customerId: string) => {
        if (window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
            setCustomers(current => current.filter(c => c.id !== customerId));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentCustomer(prev => ({ ...prev, [name]: value }));
    };

    const handleAnalyzeCustomers = async () => {
        if (customers.length === 0 || orders.filter(o => o.status === 'paid' && o.customer).length === 0) {
            alert("Not enough customer or sales data to analyze.");
            return;
        }
        setIsAnalyzing(true);
        setAnalysisResult('');
        setIsAnalysisModalOpen(true);

        try {
            const customerData = customers.map(customer => {
                const customerOrders = orders.filter(o => o.customer?.id === customer.id && o.status === 'paid');
                const totalSpend = customerOrders.reduce((sum, o) => sum + o.total, 0);
                return {
                    name: customer.name,
                    visits: customerOrders.length,
                    totalSpend: totalSpend,
                };
            }).filter(c => c.visits > 0).sort((a, b) => b.totalSpend - a.totalSpend);

            if (customerData.length === 0) {
              setAnalysisResult("There's no sales data associated with any customers yet. Start assigning customers to orders to get insights!");
              setIsAnalyzing(false);
              return;
            }

            const prompt = `Analyze the following customer data for a restaurant. Identify the top 3 customers by total spending and by number of visits. Provide a brief, actionable insight for each category (e.g., "Consider a loyalty reward for..."). Be concise and professional.

            Customer Data Summary:
            ${customerData.map(c => `- ${c.name}: ${c.visits} visits, spent ${settings.currencySymbol}${c.totalSpend.toFixed(2)}`).join('\n')}
            `;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });

            setAnalysisResult(response.text);

        } catch (error) {
            console.error("Customer analysis failed:", error);
            setAnalysisResult("Sorry, I couldn't analyze the customer data at this time. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                 <div className="relative w-full sm:w-auto">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon/></span>
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button onClick={handleAnalyzeCustomers} className="flex items-center gap-2 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-purple-700 transition-colors">
                        <GeminiIcon /> Analyze Customers
                    </button>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-600 transition-colors w-full sm:w-auto justify-center">
                        <AddIcon /> Add Customer
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Phone</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map(customer => (
                            <tr key={customer.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{customer.name}</td>
                                <td className="px-6 py-4">{customer.phone}</td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                    <button onClick={() => handleOpenModal(customer)} className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" aria-label="Edit customer"><EditIcon /></button>
                                    <button onClick={() => handleDeleteCustomer(customer.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Delete customer"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredCustomers.length === 0 && <p className="text-center text-gray-500 py-8">No customers found.</p>}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                <h3 className="text-2xl font-bold mb-4">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                        <input type="text" name="name" value={currentCustomer.name || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                        <input type="tel" name="phone" value={currentCustomer.phone || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={handleCloseModal} className="flex items-center gap-2 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"><CancelIcon /> Cancel</button>
                    <button onClick={handleSaveCustomer} className="flex items-center gap-2 bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors"><SaveIcon /> Save</button>
                </div>
            </Modal>
             <Modal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)}>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><GeminiIcon /> AI Customer Analysis</h3>
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
        </div>
    );
};

export default CustomerManager;
