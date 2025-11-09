
import React, { useState } from 'react';
import { RestaurantSettings, Order, MenuItem, Category, User } from '../types';
import { INITIAL_MENU_ITEMS, INITIAL_CATEGORIES } from '../constants';
import Modal from './Modal';
import { AddIcon, TrashIcon } from './Icons';

interface AdminPanelProps {
    settings: RestaurantSettings;
    setSettings: React.Dispatch<React.SetStateAction<RestaurantSettings>>;
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    currentUser: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ settings, setSettings, setOrders, setMenuItems, categories, setCategories, currentUser }) => {
    const [localSettings, setLocalSettings] = useState(settings);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [newNote, setNewNote] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numValue = (name === 'taxRate' || name === 'numberOfTables') ? parseFloat(value) : value;
        setLocalSettings(prev => ({ ...prev, [name]: numValue }));
    };

    const handleSaveSettings = () => {
        setSettings(localSettings);
        alert("Settings saved successfully!");
    };
    
    const showConfirmation = (message: string, onConfirm: () => void) => {
        setConfirmMessage(message);
        setConfirmAction(() => onConfirm);
        setIsConfirmModalOpen(true);
    };

    const handleConfirm = () => {
        if (confirmAction) {
          confirmAction();
        }
        setIsConfirmModalOpen(false);
        setConfirmAction(null);
    };

    const handleClearSalesData = () => {
        showConfirmation(
            "Are you sure you want to delete ALL sales data? This includes all past orders and financial records. This action cannot be undone.",
            () => {
                setOrders([]);
                alert("All sales data has been cleared.");
            }
        );
    };

    const handleResetMenu = () => {
        showConfirmation(
            "Are you sure you want to reset the menu? This will delete all current items and categories and restore the initial defaults. This action cannot be undone.",
            () => {
                setMenuItems(INITIAL_MENU_ITEMS);
                setCategories(INITIAL_CATEGORIES);
                alert("Menu has been reset to defaults.");
            }
        );
    };

    const handleAddNote = () => {
        if (newNote.trim() && !localSettings.commonNotes.includes(newNote.trim())) {
            setLocalSettings(prev => ({ ...prev, commonNotes: [...prev.commonNotes, newNote.trim()] }));
            setNewNote('');
        }
    };

    const handleDeleteNote = (noteToDelete: string) => {
        setLocalSettings(prev => ({ ...prev, commonNotes: prev.commonNotes.filter(n => n !== noteToDelete) }));
    };

    const handleCategoryAssignment = (categoryName: string, assignment: 'kitchen' | 'bar') => {
        setLocalSettings(prev => {
            const newAssignments = { ...prev.kotBotCategoryAssignments };
            if (assignment === 'kitchen') {
                if (!newAssignments.kitchen.includes(categoryName)) newAssignments.kitchen.push(categoryName);
                newAssignments.bar = newAssignments.bar.filter(c => c !== categoryName);
            } else { // bar
                if (!newAssignments.bar.includes(categoryName)) newAssignments.bar.push(categoryName);
                newAssignments.kitchen = newAssignments.kitchen.filter(c => c !== categoryName);
            }
            return { ...prev, kotBotCategoryAssignments: newAssignments };
        });
    };

    const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setLocalSettings(prev => ({
            ...prev,
            managerPermissions: {
                ...prev.managerPermissions,
                [name]: checked
            }
        }));
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 border-b pb-2">Restaurant Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Restaurant Name</label>
                        <input type="text" name="restaurantName" value={localSettings.restaurantName} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                        <input type="text" name="phone" value={localSettings.phone} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                        <input type="text" name="address" value={localSettings.address} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Receipt Footer Message</label>
                        <input type="text" name="footerMessage" value={localSettings.footerMessage} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 border-b pb-2">Financial Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency Symbol</label>
                        <input type="text" name="currencySymbol" value={localSettings.currencySymbol} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tax Rate (%)</label>
                        <input type="number" name="taxRate" value={localSettings.taxRate} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                </div>
            </div>
             <div>
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 border-b pb-2">POS Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Tables</label>
                        <input type="number" name="numberOfTables" value={localSettings.numberOfTables} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Common Note Management</label>
                        <div className="mt-1 flex gap-2">
                            <input
                                type="text"
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Add a new note..."
                                className="flex-grow block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600"
                            />
                            <button onClick={handleAddNote} className="flex-shrink-0 flex items-center gap-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-gray-700 transition-colors">
                                <AddIcon /> Add
                            </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {localSettings.commonNotes.map(note => (
                                <span key={note} className="flex items-center gap-2 bg-gray-200 dark:bg-gray-600 text-sm px-3 py-1 rounded-full">
                                    {note}
                                    <button onClick={() => handleDeleteNote(note)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">KOT/BOT Configuration</label>
                        <div className="mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md">
                            {categories.map(category => (
                                <div key={category.id} className="flex items-center justify-between py-1">
                                    <span>{category.name}</span>
                                    <div className="flex gap-2">
                                        <label className="flex items-center gap-1 text-sm">
                                            <input 
                                                type="radio" 
                                                name={`cat-assign-${category.id}`} 
                                                checked={localSettings.kotBotCategoryAssignments.kitchen.includes(category.name)} 
                                                onChange={() => handleCategoryAssignment(category.name, 'kitchen')}
                                            /> Kitchen
                                        </label>
                                        <label className="flex items-center gap-1 text-sm">
                                            <input 
                                                type="radio" 
                                                name={`cat-assign-${category.id}`} 
                                                checked={localSettings.kotBotCategoryAssignments.bar.includes(category.name)} 
                                                onChange={() => handleCategoryAssignment(category.name, 'bar')}
                                            /> Bar
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {currentUser.role === 'Admin' && (
                <div>
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4 border-b pb-2">Manager Permissions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <label className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Can Manage Menu</span>
                            <input type="checkbox" name="canManageMenu" checked={localSettings.managerPermissions?.canManageMenu ?? true} onChange={handlePermissionChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        </label>
                         <label className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Can View Sales Reports</span>
                            <input type="checkbox" name="canViewReports" checked={localSettings.managerPermissions?.canViewReports ?? true} onChange={handlePermissionChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        </label>
                         <label className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Can Manage Users</span>
                            <input type="checkbox" name="canManageUsers" checked={localSettings.managerPermissions?.canManageUsers ?? true} onChange={handlePermissionChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        </label>
                        <label className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Can Manage Customers</span>
                            <input type="checkbox" name="canManageCustomers" checked={localSettings.managerPermissions?.canManageCustomers ?? true} onChange={handlePermissionChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        </label>
                         <label className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Can Access Admin Panel</span>
                            <input type="checkbox" name="canAccessAdminPanel" checked={localSettings.managerPermissions?.canAccessAdminPanel ?? true} onChange={handlePermissionChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        </label>
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <button onClick={handleSaveSettings} className="bg-primary text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-emerald-600 transition-colors">
                    Save All Settings
                </button>
            </div>
            
            {currentUser.role === 'Admin' && (
                <div className="border-t pt-8 mt-8">
                     <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
                     <div className="p-4 border-2 border-dashed border-red-400 rounded-lg space-y-4">
                         <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <div>
                               <p className="font-bold">Clear All Sales Data</p>
                               <p className="text-sm text-gray-500">This will permanently delete all orders and financial records.</p>
                            </div>
                            <button onClick={handleClearSalesData} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-red-600 transition-colors flex-shrink-0">
                                Clear Data
                            </button>
                         </div>
                         <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <div>
                               <p className="font-bold">Reset Menu & Categories</p>
                               <p className="text-sm text-gray-500">This will restore the menu to its original default state.</p>
                            </div>
                            <button onClick={handleResetMenu} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-red-600 transition-colors flex-shrink-0">
                               Reset Menu
                            </button>
                         </div>
                     </div>
                </div>
            )}

             <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Confirm Action</h3>
                <p className="my-4 text-gray-600 dark:text-gray-300">{confirmMessage}</p>
                <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold">
                    Cancel
                </button>
                <button onClick={handleConfirm} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-semibold">
                    Confirm
                </button>
                </div>
            </Modal>
        </div>
    );
};

export default AdminPanel;
