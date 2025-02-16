import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiDollarSign, FiArrowUp, FiArrowDown, FiClock, FiCheck, FiX, FiFilter } from 'react-icons/fi';

const SellerHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        // Assuming you have an endpoint to get transactions for the current seller
        const response = await axios.get('/api/transactions/seller');
        setTransactions(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load transaction history');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, []);
  
  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'cashout':
        return <FiArrowUp className="text-red-500" />;
      case 'top-up':
        return <FiArrowUp className="text-green-500" />;
      case 'pay':
        return <FiDollarSign className="text-blue-500" />;
      case 'hold':
        return <FiClock className="text-yellow-500" />;
      case 'release':
        return <FiCheck className="text-green-500" />;
      case 'refund':
        return <FiX className="text-red-500" />;
      default:
        return <FiDollarSign className="text-gray-500" />;
    }
  };
  
  const getStatusBadge = (status) => {
    let bgColor = '';
    switch (status) {
      case 'pending':
        bgColor = 'bg-yellow-100 text-yellow-800';
        break;
      case 'hold':
        bgColor = 'bg-blue-100 text-blue-800';
        break;
      case 'completed':
        bgColor = 'bg-green-100 text-green-800';
        break;
      case 'released':
        bgColor = 'bg-teal-100 text-teal-800';
        break;
      case 'refunded':
        bgColor = 'bg-red-100 text-red-800';
        break;
      default:
        bgColor = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Transaction History</h1>
        
        {/* Filter section */}
        <div className="flex items-center mb-6 overflow-x-auto pb-2">
          <FiFilter className="mr-2 text-gray-600" />
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium mr-2 ${
              filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {['cashout', 'top-up', 'pay', 'hold', 'release', 'refund'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-full text-sm font-medium mr-2 whitespace-nowrap ${
                filter === type ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Transaction list */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <motion.tr
                    key={transaction._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.transactionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        {getTransactionTypeIcon(transaction.type)}
                        <span className="ml-2 capitalize">{transaction.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₱{transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      (new Date(transaction.createdAt), 'MMM d, yyyy h:mm a')
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.details && transaction.details.orderId ? (
                        <div>
                          <p>Order: {transaction.details.orderId}</p>
                          {transaction.details.items && (
                            <div className="text-xs text-gray-400 mt-1">
                              {transaction.details.items.map((item, idx) => (
                                <p key={idx}>{item.name} x{item.quantity}</p>
                              ))}
                            </div>
                          )}
                          {transaction.details.cancelledReason && (
                            <p className="text-xs text-red-500 mt-1">
                              Reason: {transaction.details.cancelledReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SellerHistory;