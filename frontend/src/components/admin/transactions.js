import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, toZonedTime } from 'date-fns-tz';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Tooltip } from 'react-tooltip';
import Header from '../utils/header';
import api from '../api/interceptor';
import Loading from '../utils/loading';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [openDetails, setOpenDetails] = useState(null); // To track which transaction is open
  const [activeTab, setActiveTab] = useState('payment'); // Default active tab

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
        setError(error.response?.data?.message || 'Error fetching transactions.');
        setLoading(false); // Set loading to false even if there's an error
      }
    };

    fetchTransactions();
  }, []);

  // Define the tabs with more formal names for transaction types
  const tabs = [
    { id: 'payment', label: 'Purchases', type: 'pay' },
    { id: 'withdrawal', label: 'Withdrawals', type: 'cashout' },
    { id: 'deposit', label: 'Deposits', type: 'top-up' },
  ];
  
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Format: YYYY-MM-DD
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25); // Default to 100 items per page 
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const sortedTransactions = transactions.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt); // Sort from latest to oldest
  });

  const groupedTransactions = sortedTransactions.reduce((acc, transaction) => {
    const type = transaction.type.toLowerCase();
    let tabType;
    if (type === 'pay') tabType = 'payment';
    else if (type === 'cashout') tabType = 'withdrawal';
    else if (type === 'top-up') tabType = 'deposit';
    else tabType = 'other'; // Handle any unexpected types
    
    if (!acc[tabType]) {
      acc[tabType] = [];
    }
    acc[tabType].push(transaction);
    return acc;
  }, {});

  const convertToLocalTime = (utcDate) => {
    const timeZone = 'Asia/Manila'; // Philippine timezone
    return toZonedTime(utcDate, timeZone);
  };

  const filteredTransactions = groupedTransactions[activeTab]?.filter((transaction) => {
        
    if (!selectedDate) return true; // Show all transactions if no date is selected

    // Convert the transaction's createdAt to local time (Philippines)
    const localTransactionDate = convertToLocalTime(new Date(transaction.createdAt));

    // Format the local date as YYYY-MM-DD for comparison
    const formattedTransactionDate = format(localTransactionDate, 'yyyy-MM-dd');

    // Compare with the selected date
    return formattedTransactionDate === selectedDate;
  });
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions?.slice(indexOfFirstItem, indexOfLastItem);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };
  
  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };
  
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to the first page when changing items per page
  };

  const statusTooltips = {
    refunded: "Refunded means the money was successfully deducted but returned to the customer.",
    pending: "Pending means the transaction is still being processed.",
    released: "Released means the money was returned to the customer by the system.",
    hold: "Hold means the money is deducted from the customer and is on hold by the system."
  };

  const handleDownloadPDF = () => {
    // Filter transactions based on date range (if applicable)
    const filteredTransactions = transactions.filter((transaction) => {
        const localTransactionDate = convertToLocalTime(new Date(transaction.createdAt));
        const formattedTransactionDate = format(localTransactionDate, 'yyyy-MM-dd');
        return formattedTransactionDate === selectedDate;
    });

     // Group transactions by type
    const groupedTransactions = filteredTransactions.reduce((acc, transaction) => {
        const type = transaction.type.toLowerCase();
        let tabType;
        if (type === 'pay') tabType = 'Purchases';
        else if (type === 'cashout') tabType = 'Withdrawals';
        else if (type === 'top-up') tabType = 'Deposits';
        else tabType = 'Other'; // Handle any unexpected types

        if (!acc[tabType]) {
        acc[tabType] = [];
        }
        acc[tabType].push(transaction);
        return acc;
    }, {});

    // Create a new PDF instance
    const doc = new jsPDF();

    // Add header to the PDF
    doc.setFontSize(18);
    doc.setTextColor(255, 165, 0);
    doc.setFont('helvetica', 'bold');
    doc.text("Campus Eats - Transaction History", 14, 20); // Title
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(
        `Selected Date: ${
          selectedDate
            ? format(convertToLocalTime(new Date(selectedDate)), 'MMMM d, yyyy')
            : 'No Date Selected'
        }`,
        14,
        30
    ); // Date selected

    let startY = 40;
  
    // Iterate over each group and add a section to the PDF
    Object.entries(groupedTransactions).forEach(([type, transactions]) => {
        const columns =
            type === 'Purchases'
                ? [
                    { title: "Time", dataKey: "time" },
                    { title: "Transaction ID", dataKey: "transactionId" },
                    { title: "User", dataKey: "user" },
                    { title: "Amount", dataKey: "amount" },
                    { title: "Status", dataKey: "status" },
                    { title: "Customer Balance", dataKey: "customerBalance" },
                    { title: "Seller Balance", dataKey: "sellerBalance" },
                ]
                : [
                    { title: "Time", dataKey: "time" },
                    { title: "Transaction ID", dataKey: "transactionId" },
                    { title: "User", dataKey: "user" },
                    { title: "Amount", dataKey: "amount" },
                    { title: "Status", dataKey: "status" },
                    { title: "User Balance", dataKey: "customerBalance" },
                ];

        // Add section header
        doc.setFontSize(14);
        doc.text(`${type}`, 14, startY);
        startY += 4; // Move down for the table

        // Map the transactions to the table rows
        const rows = transactions.map((transaction) => [
        format(convertToLocalTime(new Date(transaction.createdAt)), 'MM/dd/yyyy, h:mm:ss a'),
        transaction.transactionId,
        transaction.user.username,
        transaction.amount,
        transaction.status,
        transaction.userBalanceAfter || 'N/A',
        transaction.sellerBalanceAfter || 'N/A',
        ]);

        // Add the table to the PDF
        autoTable(doc, {
        head: [columns.map((col) => col.title)],
        body: rows,
        headStyles: {
            fillColor: [62, 115, 230], // RGB values for a green color
            textColor: [255, 255, 255], // White text
            fontStyle: 'bold', // Bold text
            fontSize: 12,
        },
        bodyStyles: {
          fontSize: 9, // Smaller font size for the body
          textColor: [0, 0, 0], // Black text
          fontStyle: 'normal', // Normal font style
        },
        startY: startY,
        styles: {
            halign: 'center', // Center align text horizontally
            valign: 'middle', // Center align text vertically
        },
        });

        // Update startY for the next section
        startY = doc.lastAutoTable.finalY + 10;
    });

    const currentDate = format(convertToLocalTime(new Date(selectedDate)), 'yyyy-MM-dd'); // Format: YYYY-MM-DD
    const fileName = `transaction_history_${currentDate}.pdf`;

    // Save the PDF with the new file name
    doc.save(fileName);
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
          navigateTo={'/admin'}
        />
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fd] flex flex-col items-center p-4">
      {/* Header and Tabs */}
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
      <div className="container mx-auto p-4 text-[10px]">
        <h2 className="text-2xl font-semibold -mt-4 text-gray-800 mb-4">Transaction List</h2>
  
        {/* Tabs - Now based on transaction type */}
        <div className="flex space-x-4 mb-4 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1); // Reset to the first page when switching tabs
              }}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
  
        {/* Items Per Page Dropdown */}
        <div className="mb-4 flex flex-row items-center">
            <label htmlFor="dateFilter" className="mr-2">Filter by date:</label>
            <input
                type="date"
                id="dateFilter"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-1 border border-gray-300 rounded"
            />

            <label htmlFor="itemsPerPage" className="mx-2">Items per page:</label>
            <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="p-1 border border-gray-300 rounded"
            >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
            </select>

            <button
                onClick={handleDownloadPDF}
                className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
                Download (PDF)
            </button>
        </div>
  
        {/* Render transactions for the active tab */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-100 text-center">
                <th className="px-4 py-2 border-b">Time</th>
                <th className="px-4 py-2 border-b">Transaction ID</th>
                <th className="px-4 py-2 border-b">User</th>
                {/* <th className="px-0 py-2 border-b">Transaction Type</th> */}
                <th className="px-4 py-2 border-b">Amount</th>
                {activeTab === 'payment' && (
                    <th className="px-0 py-2 border-b">Transaction Details</th>
                )}
                <th className="px-4 py-2 border-b">Status</th>
                <th className="px-4 py-2 border-b">{activeTab === 'payment' ? "Customer Balance" : "User Balance"}</th>
                {activeTab === 'payment' && (
                    <th className="px-4 py-2 border-b">Seller Balance</th>
                )}
              </tr>
            </thead>
            <tbody>
              {currentTransactions.map((transaction) => (
                <tr key={transaction.transactionId} className="hover:bg-gray-50 text-center">
                  <td className="px-4 py-2 border-b">
                    {format(convertToLocalTime(new Date(transaction.createdAt)), 'MM/dd/yyyy, h:mm:ss a')}
                  </td>
                  <td className="px-4 py-2 border-b">{transaction.transactionId}</td>
                  <td className="px-4 py-2 border-b">{transaction.user.username}</td>
                  {/* <td className="px-0 py-2 border-b">{transaction.type}</td> */}
                  <td className="px-4 py-2 border-b">{transaction.amount}</td>
                  {activeTab === 'payment' && (
                    <td
                        className={`px-0 py-2 border-b ${
                        openDetails === transaction.transactionId ? 'min-w-48' : 'min-w-24'
                        }`}
                    >
                    {/* Transaction Details */}
                    {transaction.details ? (
                        <>
                        <button
                            onClick={() => toggleDetails(transaction.transactionId)}
                            className="text-orange-500 hover:underline focus:outline-none"
                        >
                            {openDetails === transaction.transactionId ? 'Hide Details' : 'Show Details'}
                        </button>
                        {(openDetails === transaction.transactionId) && (
                            <div className="flex justify-center flex-col">
                            <h1 className="text-left">
                                <span>Store:</span>
                                <span className="ml-1">{transaction.details.store_name || 'N/A'}</span>
                            </h1>
                            <h1 className="text-left">
                                <span>Order Number:</span>
                                <span className="ml-1">{transaction.details.orderNumber || 'N/A'}</span>
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
                )}
                  <td className="px-4 py-2 border-b">
                    <div className="flex items-center justify-center">
                        {transaction.status}
                        {statusTooltips[transaction.status] && transaction.status !== "completed" && (
                            <button
                                data-tooltip-id={`${transaction.status}-tooltip`}
                                data-tooltip-content={statusTooltips[transaction.status]}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="w-4 h-4"
                                >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                                />
                                </svg>
                            </button>
                        )}
                        <Tooltip id={`${transaction.status}-tooltip`} place="top" type="dark" effect="solid" />
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b">{transaction.userBalanceAfter || 'N/A'}</td>

                  {activeTab === "payment" && (
                    <td className="px-4 py-2 border-b">{transaction.sellerBalanceAfter || 'N/A'}</td>
                )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-orange-500 text-white rounded disabled:bg-gray-300"
          >
            Previous
          </button>
          <span>Page {currentPage}</span>
          <button
            onClick={handleNextPage}
            disabled={indexOfLastItem >= filteredTransactions.length}
            className="px-4 py-2 bg-orange-500 text-white rounded disabled:bg-gray-300"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Transactions;