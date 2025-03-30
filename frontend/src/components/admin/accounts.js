import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, ChevronDownIcon } from "@heroicons/react/outline";
import Header from '../utils/header.js';
import api from '../api/interceptor.js';

// const protocol = process.env.REACT_APP_PROTOCOL || "http";
// const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
// const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

// const address = `${protocol}://${host_ip}:${backend_port}`;

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const Accounts = () => {
    const [users, setUsers] = useState([]); // State to store user data
    const [loading, setLoading] = useState(true); // State for loading

    const [expandedId, setExpandedId] = useState(null);
    const navigate = useNavigate();

    const [confirmingId, setConfirmingId] = useState(null);
    const [filter, setFilter] = useState('all');

    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');

    // Fetch users from the backend
    useEffect(() => {
        document.title = "Campus Eats | Accounts";
        const fetchUsers = async () => {
            const token = localStorage.getItem('token');
            try {
                // Using Axios to make the GET request
                const response = await api.get('/admin/accounts', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setUsers(response.data); // Update state with user data
                setLoading(false); // Set loading to false
            } catch (error) {
                console.error('Error fetching users:', error);
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleDelete = async (userId) => {
        const token = localStorage.getItem('token');
        // Call the delete handler passed as prop to remove the user
        try {
            // Send a DELETE request to the backend to remove the user
            const response = await api.delete(`/admin/accounts/${userId}`, {
                headers: {
                    'Content-Type': 'application/json', // Specify that we're sending JSON
                    'Authorization': `Bearer ${token}`,
                },
            });
        
            if (response.status === 200) {
                // If deletion is successful, filter the deleted user from the state
                setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
                alert('User deleted successfully');
            } else {
                // Handle errors if the request fails
                alert(`Error: ${response.data.message || 'Failed to delete the user.'}`);
            }
        } catch (error) {
            // Catch any unexpected errors
            console.error('Error deleting user:', error);
            alert( error.response.data.message || 'Error deleting user. Please try again later.');
        }
    };

    const handleAddSeller = () => {
        console.log('Add Seller button clicked');
        navigate('/admin/addseller');
    };

    const handleSortChange = (e) => {
        const [field, direction] = e.target.value.split('-');
        setSortBy(field);
        setSortDirection(direction);
    };

    const filteredUsers = filter === 'all' 
        ? users 
        : users.filter(user => user.user_type === filter);

    const sortedAndFilteredUsers = [...filteredUsers].sort((a, b) => {
        // Handle cases where values might be null/undefined
        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';

        if (sortBy === 'balance') {
            return sortDirection === 'asc' 
                ? (aValue || 0) - (bValue || 0) 
                : (bValue || 0) - (aValue || 0);
        } 
        else if (sortBy === 'username') {
            const nameA = aValue.toLowerCase();
            const nameB = bValue.toLowerCase();
            return sortDirection === 'asc' 
                ? nameA.localeCompare(nameB) 
                : nameB.localeCompare(nameA);
        }
        else {
            // For dates (created_at, last_login)
            const dateA = new Date(aValue).getTime();
            const dateB = new Date(bValue).getTime();
            
            return sortDirection === 'asc' 
                ? dateA - dateB 
                : dateB - dateA;
        }
    });

    if (loading) {
        return <loading />;
    }

    return (
        <div className="min-h-screen bg-[#f8f9fd] flex flex-col items-center p-4">
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

            {/* Header */}
            <Header
                headerName={'Accounts'}
                navigateTo={'/admin'}
            />

            {/* Control Bar */}
            <div className="sticky top-14 z-10 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
                <div className="max-w-3xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Filter Section */}
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Filter by role</label>
                            <div className="flex space-x-2">
                                {[
                                    { value: 'all', label: 'All', color: 'blue' },
                                    { value: 'seller', label: 'Sellers', color: 'orange' },
                                    { value: 'customer', label: 'Customers', color: 'green' },
                                    { value: 'admin', label: 'Admins', color: 'purple' }
                                ].map((item) => (
                                    <button
                                        key={item.value}
                                        onClick={() => setFilter(item.value)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                                            filter === item.value
                                                ? `bg-${item.color}-100 text-${item.color}-800 border border-${item.color}-200`
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort Section */}
                        <div className="flex-1 max-w-xs">
                            <label htmlFor="sort-select" className="block text-xs font-medium text-gray-500 mb-1">Sort by</label>
                            <div className="relative">
                                <select
                                    id="sort-select"
                                    onChange={handleSortChange}
                                    value={`${sortBy}-${sortDirection}`}
                                    className="block w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                                >
                                    <option value="created_at-desc">Newest First</option>
                                    <option value="created_at-asc">Oldest First</option>
                                    <option value="last_login-desc">Recent Login First</option>
                                    <option value="last_login-asc">Oldest Login First</option>
                                    <option value="balance-desc">Highest Balance First</option>
                                    <option value="balance-asc">Lowest Balance First</option>
                                    <option value="username-asc">Name (A-Z)</option>
                                    <option value="username-desc">Name (Z-A)</option>
                                </select>
                                <ChevronDownIcon className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Cards */}
            <div className="flex-1 p-2 pb-20 max-w-3xl mx-auto w-full mt-2">
                {sortedAndFilteredUsers.map((account) => (
                    <div
                        key={account._id}
                        className={`mb-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all duration-200 hover:shadow-md ${
                            expandedId === account._id ? "ring-2 ring-blue-200" : ""
                        } ${
                            account.user_type === 'admin' ? "bg-gradient-to-br from-white to-purple-50" :
                            account.user_type === 'customer' ? "bg-gradient-to-br from-white to-green-50" :
                            account.user_type === 'seller' ? "bg-gradient-to-br from-white to-orange-50" : ""
                        }`}
                        onClick={() => toggleExpand(account._id)}
                    >
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                {account.profile_picture ? (
                                    <img
                                        src={account.profile_picture}
                                        alt="Profile"
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <span className="text-blue-600 font-medium">
                                        {account.username.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-gray-900 truncate">{account.username}</h3>
                                <div className="flex items-center">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        account.user_type === 'admin' ? 'bg-purple-100 text-purple-800' :
                                        account.user_type === 'customer' ? 'bg-green-100 text-green-800' :
                                        'bg-orange-100 text-orange-800'
                                    }`}>
                                        {account.user_type}
                                    </span>
                                    {account.user_type === 'seller' && account.store_name && (
                                        <span className="ml-2 text-xs text-gray-500 truncate">
                                            {account.store_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {account.user_type !== 'admin' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmingId(account._id);
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {/* Expanded Content */}
                        {expandedId === account._id && (
                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Email:</span>
                                    <span className="text-gray-900">{account.email}</span>
                                </div>
                                {account.user_type !== 'admin' && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Balance:</span>
                                        <span className="text-gray-900">
                                            UC {account.balance?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || '0.00'}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Last Login:</span>
                                    <span className="text-gray-900">
                                        {account.last_login ? new Date(account.last_login).toLocaleString() : "Never"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Created:</span>
                                    <span className="text-gray-900">
                                        {new Date(account.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                {confirmingId === account._id && (
                                    <div className="mt-3 flex justify-end space-x-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmingId(null);
                                            }}
                                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(account._id);
                                            }}
                                            className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                        >
                                            Confirm Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Seller Button */}
            <div className="fixed bottom-4 left-0 right-0 flex justify-center">
                <button
                    onClick={handleAddSeller}
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                    Add New Seller
                </button>
            </div>
        </div>
    );
};

export default Accounts;
