import React, { useState, FormEvent, useEffect } from 'react';
import { User } from '../types';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, users, setUsers }) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // Initialize default users if none exist
  useEffect(() => {
    if (users.length === 0) {
      const defaultUsers: User[] = [
        { id: 'user-1', name: 'Admin User', username: 'admin', pin: '1234', role: 'Admin' },
        { id: 'user-2', name: 'Manager User', username: 'manager', pin: '1234', role: 'Manager' },
        { id: 'user-3', name: 'Waiter User', username: 'waiter', pin: '1234', role: 'Waiter' },
        { id: 'user-4', name: 'Cashier User', username: 'cashier', pin: '1234', role: 'Cashier' },
      ];
      setUsers(defaultUsers);
    }
  }, [users, setUsers]);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const user = users.find(u => u.username === username && u.pin === pin);
    if (user) {
      onLoginSuccess(user);
    } else {
      setError('Invalid username or PIN.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">Restaurant POS</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">Please log in to continue</p>
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">Welcome Back!</h2>
              {error && <p className="text-center text-sm text-red-600 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">PIN</label>
                <input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                  pattern="\d*"
                  maxLength={6}
                />
              </div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                Log In
              </button>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-4">
                Please contact an administrator to create an account or to reset your PIN.
              </p>
            </form>
        </div>
    </div>
  );
};

export default AuthPage;