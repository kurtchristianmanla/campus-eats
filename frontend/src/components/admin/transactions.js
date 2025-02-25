import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../utils/header';
import api from '../api/interceptor';
import Loading from '../utils/loading';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [openDetails, setOpenDetails] = useState(null); // To track which transaction is open

  const toggleDetails = (transactionId) => {
    setOpenDetails(openDetails === transactionId ? null : transactionId);
  };

  useEffect(() => {
    // Function to fetch transaction data
    const fetchTransactions = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await api.get('/admin/transactions', {
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

    fetchTransactions();
  }, []);

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
                navigateTo={'/admin'}
            />
            <p className="text-center text-red-500">{error}</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fd] flex flex-col items-center p-4">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

        {/* Header */}
        <header className="w-full flex items-center gap-2 sticky mb-2 top-0 bg-[#f8f9fd] z-10 fixed py-3">
            <button className="text-gray-600" onClick={() => navigate('/admin')}>
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
        <div className="container mx-auto p-4 text-xs">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Transaction List</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
                <thead>
                    <tr className="bg-gray-100 text-center">
                    <th className="px-4 py-2 border-b">Time</th>
                    <th className="px-4 py-2 border-b">Transaction ID</th>
                    <th className="px-4 py-2 border-b">User</th>
                    <th className="px-4 py-2 border-b">Transaction Type</th>
                    <th className="px-4 py-2 border-b">Amount</th>
                    <th className="px-0 py-2 border-b">Transaction Details</th>
                    <th className="px-4 py-2 border-b">Status</th>
                    <th className="px-4 py-2 border-b">User Balance After</th>
                    <th className="px-4 py-2 border-b">Seller Balance After</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((transaction) => (
                    <tr key={transaction.transactionId} className="hover:bg-gray-50 text-center">
                        <td className="px-4 py-2 border-b">{new Date(transaction.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2 border-b">{transaction.transactionId}</td>
                        <td className="px-4 py-2 border-b">{transaction.user.username}</td>
                        <td className="px-4 py-2 border-b">{transaction.type}</td>
                        <td className="px-4 py-2 border-b">{transaction.amount}</td>
                        
                        {/* Transaction Details */}
                        <td className="px-0 py-2 border-b text-xs w-48">
                            {transaction.details ? (
                                <>
                                    <button
                                        onClick={() => toggleDetails(transaction.transactionId)}
                                        className="text-blue-500 hover:underline focus:outline-none"
                                    >
                                        {openDetails === transaction.transactionId ? 'Hide Details' : 'Show Details'}
                                    </button>

                                    {(openDetails === transaction.transactionId) && (
                                    <div className="flex justify-center flex-col">
                                        <h1 className="text-left">
                                            <span>Store:</span> 
                                            <span className="ml-1">{transaction.details.store_name || 'N/A'}</span>
                                        </h1>
                                        <h1 className="text-left">Items:
                                            {Array.isArray(transaction.details.items) && transaction.details.items.length > 0 ? (
                                            <ul className="ml-4 list-none list-inside text-left">
                                                {transaction.details.items.map((item, index) => (
                                                <li key={index}>
                                                    x{item.quantity} {item.name} 
                                                </li>
                                                ))}
                                            </ul>
                                            ) : (
                                            <ul className="list-none ml-4">No items found</ul>
                                            )}
                                        </h1>
                                        {transaction.details.cancelledReason && (
                                            <>
                                                <h1 className="text-left">
                                                    <span>Reason: </span>
                                                    <span className="">{transaction.details.cancelledReason}</span>
                                                </h1>
                                            </>
                                        )}
                                    </div>
                                    )}
                                </>
                            ) : (
                                <span className="text-center">No details</span>
                            )}
                        </td>

                        <td className="px-4 py-2 border-b">{transaction.status}</td>
                        
                        <td className="px-4 py-2 border-b">{transaction.userBalanceAfter || 'N/A'}</td>
                        <td className="px-4 py-2 border-b">{transaction.sellerBalanceAfter || 'N/A'}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}

export default Transactions;
