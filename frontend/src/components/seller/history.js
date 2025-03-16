import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../utils/header';
import api from '../api/interceptor';
import Loading from '../utils/loading';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNotification } from '../utils/notification';
import { io } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [seller, setSeller] = useState(null);
    const navigate = useNavigate();

    const [socket, setSocket] = useState(null); 
    const { showNotification } = useNotification();

    // Extract sellerId from the token stored in localStorage
    const token = localStorage.getItem('token');
    const sellerId = token ? jwtDecode(token).user_id : null;

    // Function to fetch transaction data
    const fetchTransactions = async () => {
        const token = localStorage.getItem('token');
        try {
        const response = await api.get('/seller/transactions', {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });
    
        setTransactions(response.data); // Update state with transaction data
        setLoading(false); // Set loading to false
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setError( error.response.data.message || 'Error fetching transactions.');
            setLoading(false); // Set loading to false even if there's an error
        }
    };

    // Function to fetch transaction data
    const fetchSellerData = async () => {
        const token = localStorage.getItem('token');
        try {
        const response = await api.get('/seller/manage-orders', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    
        setSeller(response.data.user);
        setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError('Error fetching orders.');
            setLoading(false);
        }
    };

    useEffect(() => {
        
        fetchTransactions();
        fetchSellerData();

    }, []);

    useEffect(() => {
        document.title = "Campus Eats | Transaction History";

        // Initialize the Socket.IO connection
        const socketConnection = io(address);
        setSocket(socketConnection);

        // Join the seller-specific room
        socketConnection.emit('joinSellerRoom', sellerId);

        const receiveNewOrder = (data) => {
            if (data.sellerId === sellerId) {
                showNotification('New Order Received!', `Order #${data.newOrder.orderNumber}`, 'seller');
                toast.info(
                    'New Order Received!'
                );
                console.log('New Order Received:', data.newOrder.orderNumber);
            }
        };

        const orderStatusChanged = (data) => {
            if (data.order.sellerId === sellerId) {
                showNotification('Order Status Updated!', `Order #${data.order.orderNumber}`, 'seller');
            }
        };

        const warningOverdueOrders = (data) => {
            if (data.order.sellerId === sellerId) {
                toast.info(
                    data.message, {
                    duration: 5000,
                });
            }
        };

        // Listen for new orders
        socketConnection.on('newOrder', receiveNewOrder);
        socketConnection.on('updateOrder', orderStatusChanged);
        socketConnection.on('overdueOrder', warningOverdueOrders);

        // Clean up the socket connection when the component unmounts
        return () => {
            socketConnection.off('newOrder', receiveNewOrder); // Remove the listener
            socketConnection.off('updateOrder', orderStatusChanged);
            socketConnection.off('overdueOrder', warningOverdueOrders);
            socketConnection.disconnect(); // Disconnect the socket
        };
    }, [sellerId, showNotification]);

    const calculateRunningBalance = (transactions) => {
        // Sort transactions in chronological order (oldest first)
        const sortedTransactions = transactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        let balance = 0;
        const transactionsWithBalance = sortedTransactions.map((transaction) => {
            switch (transaction.type) {
                case 'top-up':
                case 'pay':
                    balance += transaction.amount;
                    break;
                case 'cashout':
                    balance -= transaction.amount;
                    break;
                default:
                    break;
            }
            return { ...transaction, balance };
        });

        // Reverse the order for display (latest first)
        return transactionsWithBalance.reverse();
    };

    const transactionsWithBalance = calculateRunningBalance(transactions);

    const getTransactionLabel = (type) => {
        switch (type) {
            case 'pay':
                return 'Order Payment';
            case 'cashout':
                return 'Withdrawal';
            case 'top-up':
                return 'Deposit';
            default:
                return type; // Fallback for other types
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString(); // Includes both date and time
    };

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#f8f9fd] flex flex-col items-center p-4">
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

                {/* Header */}
                <Header
                    headerName={'Transactions'}
                    navigateTo={'/seller'}
                />
                <p className="text-center text-red-500">{error}</p>
            </div>
        );
    }

  return (
    <div className="min-h-screen bg-[#f8f9fd] flex flex-col items-center p-4">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

        {/* Header */}
        <header className="w-full flex items-center gap-2 sticky top-0 bg-[#f8f9fd] z-10 fixed py-3">
            <button className="text-gray-600" onClick={() => navigate('/seller')}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-6 h-6"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-700">Transactions</h1>
        </header>
        <div className="container mx-auto p-4 text-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 -mt-2">
                {seller?.store_name || "Seller"}<span className='text-orange-500'> Transactions</span></h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
                <thead>
                    <tr className="bg-gray-100 text-center">
                        <th className="py-2 px-4 border-b">Transaction ID</th>
                        <th className="py-2 px-4 border-b">Type</th>
                        <th className="py-2 px-4 border-b">Amount</th>
                        <th className="py-2 px-4 border-b">Balance</th>
                        <th className="py-2 px-1 border-b">Order Number</th>
                        <th className="py-2 px-4 border-b">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {transactionsWithBalance.map((transaction, index) => (
                        <motion.tr
                            key={transaction._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-gray-50 text-center text-[10px]"
                        >
                            <td className="py-2 px-4 border-b">{transaction.transactionId}</td>
                            <td className="py-2 px-4 border-b">{getTransactionLabel(transaction.type)}</td>
                            <td className="py-2 px-4 border-b">UC {transaction.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                            <td className="py-2 px-4 border-b">UC {(transaction.type !== 'pay' ? transaction.userBalanceAfter?.toLocaleString("en-US", { minimumFractionDigits: 2 }) : transaction.sellerBalanceAfter?.toLocaleString("en-US", { minimumFractionDigits: 2 })) || "N/A"}</td>
                            <td className="py-2 px-1 border-b">
                                {transaction.details?.orderNumber || 'N/A'}
                            </td>
                            <td className="py-2 px-4 border-b">
                                {formatDate(transaction.createdAt)}
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}

export default Transactions;
