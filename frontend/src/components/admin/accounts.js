import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrashIcon } from "@heroicons/react/outline";
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

    const filteredUsers = filter === 'all' 
        ? users 
        : users.filter(user => user.user_type === filter);

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

            {/* Filter Buttons */}
            <div className="fixed sticky top-8 left-0 right-0 -mt-4 bg-[#f8f9fd] w-full z-10 text-xs">
                <div className="flex justify-center space-x-4 py-3 text-xs">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                            filter === 'all' 
                                ? 'bg-blue-500 text-white shadow-lg hover:bg-blue-600' 
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('seller')}
                        className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                            filter === 'seller' 
                                ? 'bg-orange-500 text-white shadow-lg hover:bg-orange-600' 
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                    >
                        Sellers
                    </button>
                    <button
                        onClick={() => setFilter('customer')}
                        className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                            filter === 'customer' 
                                ? 'bg-green-500 text-white shadow-lg hover:bg-green-600' 
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                    >
                        Customers
                    </button>
                    <button
                        onClick={() => setFilter('admin')}
                        className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                            filter === 'admin' 
                                ? 'bg-purple-500 text-white shadow-lg hover:bg-purple-600' 
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                    >
                        Admins
                    </button>
                </div>
            </div>

            {/* Account Cards */}
            <div className="flex-1 space-y-4 w-[22rem] overflow-y-auto pb-20 scrollbar-hide">
                {filteredUsers.map((account) => (
                    <div
                        key={account._id}
                        className={`bg-white rounded-lg shadow-md border p-4 cursor-pointer transition-all duration-300 relative 
                            ${expandedId === account._id ? "shadow-lg border-pink-200" : "" }
                            ${account.user_type === 'admin' && "bg-gradient-to-br from-white via-white to-purple-300/30" }
                            ${account.user_type === 'customer' && "bg-gradient-to-br from-white via-white to-green-300/30" }
                            ${account.user_type === 'seller' && "bg-gradient-to-br from-white via-white to-orange-300/30" }
                        `}
                        onClick={() => toggleExpand(account._id)}
                    >
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-indigo-500 text-white font-bold flex 
                                            justify-center items-center overflow-hidden rounded-full">
                                {account.profile_picture ? (
                                    <img
                                    src={account.profile_picture}
                                    alt="Profile"
                                    className="object-cover w-full h-full"
                                    />
                                ) : (
                                    `${account.username.charAt(0).toUpperCase()}`
                                )}
                            </div>
                            <div className="ml-4">
                                <h2 className="text-lg font-medium">{account.username}</h2>
                                <p className="text-sm text-gray-500">{account.user_type}</p>
                            </div>
                        </div>

                        {/* Expandable Content */}
                        <div
                            className={`mt-4 text-gray-700 overflow-hidden max-h-0 transition-all duration-500 ease-in-out ${
                                expandedId === account._id ? "max-h-[500px] px-2 opacity-100" : "max-h-0 opacity-0"
                            }`}
                        >
                            {/* Store Name For Sellers */}
                            {account.user_type === 'seller' && (
                                <p>
                                    <span className="font-medium">Store Name:</span> {account.store_name} ({account.is_selling ? 'Open' : 'Closed'})
                                </p>
                            )}
                            <p>
                                <span className="font-medium">Email:</span> {account.email}
                            </p>
                            {account.user_type !== 'admin' && (<p>
                                <span className="font-medium">Balance:</span> ₱{account.balance.toFixed(2)}
                            </p>)}
                            <p>
                                <span className="font-medium">Last Login:</span>{" "}
                                {account.last_login ? new Date(account.last_login).toLocaleString() : "Not logged in yet"}
                            </p>
                            <p>
                                <span className="font-medium">Created At:</span>{" "}
                                {new Date(account.created_at).toLocaleString()}
                            </p>

                            {/* Delete Icon */}
                            {account.user_type !== 'admin' && (
                                // <button
                                //     onClick={(e) => {
                                //         e.stopPropagation(); // Prevent the card from expanding when clicking the delete icon
                                //         handleDelete(account._id); // Delete user
                                //     }}
                                //     className="absolute top-4 right-4 text-red-600 hover:text-red-800"
                                // >
                                //     <TrashIcon className="w-6 h-6" />
                                // </button>
                                <>
                                    {confirmingId === account._id ? (
                                        <div className="mt-4 flex justify-end gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent card expansion
                                                    handleDelete(account._id); // Confirm delete
                                                }}
                                                className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-600 
                                                    text-white rounded hover:from-red-500 hover:to-red-700"
                                            >
                                                Confirm Deletion
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent card expansion
                                                    setConfirmingId(null); // Cancel delete
                                                }}
                                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent card expansion
                                                setConfirmingId(account._id); // Show confirmation buttons
                                            }}
                                            className="absolute top-4 right-4 text-red-600 hover:text-red-800"
                                        >
                                            <TrashIcon className="w-6 h-6" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Seller Button */}
            <div className="fixed bottom-0 center-0 p-4 z-20">
                <button
                    onClick={handleAddSeller}
                    className="w-full px-10 py-3 rounded-lg bg-gradient-to-r from-orange-400 to-red-500 
                        text-white text-lg font-semibold shadow-md hover:scale-105 transform transition duration-300"
                >
                    ADD A SELLER
                </button>
            </div>
        </div>
    );
};

export default Accounts;
