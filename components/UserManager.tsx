import React, { useState } from 'react';
import { User, UserRole } from '../types';
import Modal from './Modal';
import { AddIcon, EditIcon, TrashIcon, SaveIcon, CancelIcon, ResetIcon } from './Icons';

interface UserManagerProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    currentUser: User;
}

const UserManager: React.FC<UserManagerProps> = ({ users, setUsers, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newUser, setNewUser] = useState<Partial<User>>({ name: '', username: '', pin: '', role: 'Waiter' });

    const handleOpenModal = (user: User | null = null) => {
        setEditingUser(user);
        if (user) {
            setNewUser(user);
        } else {
            setNewUser({ name: '', username: '', pin: '', role: 'Waiter' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setNewUser({ name: '', username: '', pin: '', role: 'Waiter' });
    };

    const handleSaveUser = () => {
        if (!newUser.name || !newUser.username || !newUser.role) {
            alert("Please fill in all fields.");
            return;
        }

        if (editingUser) { // Editing existing user
            setUsers(currentUsers => currentUsers.map(u => u.id === editingUser.id ? { ...u, ...newUser } as User : u));
        } else { // Creating new user
            if (!newUser.pin || !/^\d{4,6}$/.test(newUser.pin)) {
                alert("PIN must be 4 to 6 digits.");
                return;
            }
            if (users.some(u => u.username.toLowerCase() === newUser.username?.toLowerCase())) {
                alert("Username already exists.");
                return;
            }
            const userToAdd: User = {
                id: `user-${Date.now()}`,
                name: newUser.name,
                username: newUser.username,
                pin: newUser.pin,
                role: newUser.role,
            };
            setUsers(currentUsers => [...currentUsers, userToAdd]);
        }
        handleCloseModal();
    };

    const handleDeleteUser = (userId: string) => {
        if (userId === currentUser.id) {
            alert("You cannot delete your own account.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
        }
    };
    
    const handleResetPin = (userId: string) => {
        if (window.confirm("Are you sure you want to reset this user's PIN to '1234'?")) {
            setUsers(currentUsers => currentUsers.map(u => u.id === userId ? { ...u, pin: '1234' } : u));
            alert("User's PIN has been reset to 1234.");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">User Management</h3>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-600 transition-colors">
                    <AddIcon /> Add User
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Username</th>
                            <th scope="col" className="px-6 py-3">Role</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{user.name}</td>
                                <td className="px-6 py-4">{user.username}</td>
                                <td className="px-6 py-4">{user.role}</td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                    <button onClick={() => handleOpenModal(user)} className="text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50" aria-label="Edit user"><EditIcon /></button>
                                    <button onClick={() => handleResetPin(user.id)} className="text-yellow-500 hover:text-yellow-700 p-2 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/50" aria-label="Reset PIN"><ResetIcon /></button>
                                    {currentUser.id !== user.id && (
                                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Delete user"><TrashIcon /></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                <h3 className="text-2xl font-bold mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                        <input type="text" name="name" value={newUser.name || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                        <input type="text" name="username" value={newUser.username || ''} onChange={handleInputChange} disabled={!!editingUser} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:disabled:bg-gray-600" />
                    </div>
                    {!editingUser && (
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">PIN (4-6 digits)</label>
                            <input type="password" name="pin" value={newUser.pin || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600" pattern="\d{4,6}" />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <select name="role" value={newUser.role || 'Waiter'} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600">
                             <option value="Waiter">Waiter</option>
                             <option value="Cashier">Cashier</option>
                             <option value="Manager">Manager</option>
                             <option value="Admin">Admin</option>
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={handleCloseModal} className="flex items-center gap-2 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"><CancelIcon /> Cancel</button>
                    <button onClick={handleSaveUser} className="flex items-center gap-2 bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors"><SaveIcon /> Save</button>
                </div>
            </Modal>
        </div>
    );
};

export default UserManager;
