import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../utils/header';
import api from '../api/interceptor';

const Cashout = () => {
  const [searchInput, setSearchInput] = useState('');
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingCashOut, setLoadingCashOut] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [successWindow, setSuccessWindow] = useState(false);
  const [amountCredited, setAmountCredited] = useState(0);

  const [searchedUserId, setSearchedUserId] = useState('');
  const [searchedUsername, setSearchedUsername] = useState('');
  const [searchedEmail, setSearchedEmail] = useState('');
  const [userBalance, setUserBalance] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Campus Eats | Cash Out";

    // Disable scrolling and zooming
    document.body.style.overflow = 'hidden';
    document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

    // Clean up the styles on component unmount
    return () => {
      document.body.style.overflow = 'auto';
      document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
    };
  }, []);

  const handleSearch = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoadingSearch(true);

    const query = searchInput;
    const token = localStorage.getItem('token');

    try {
        const response = await api.get('/admin/search-user', {
            params: {
                query: query,
            },
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`,
            },
        });

        if (response.status === 200) {
            setUserBalance(response.data.balance);
            setSearchedUserId(response.data.id);
            setSearchedUsername(response.data.username);
            setSearchedEmail(response.data.email);
        } else {
            setErrorMessage(response.data.message || 'User not found.');
            setUserBalance(null);
            setCashOutAmount('');
            
            setSearchedUserId('');
            setSearchedUsername('');
            setSearchedEmail('');
        }
    } catch (error) {
        console.error('Error searching user:', error);
        setErrorMessage( error.response.data.message || 'An error occurred while searching for the user. Please try again.');
    } finally {
        setLoadingSearch(false);
    }
  };


  const handleCashOut = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoadingCashOut(true);

    const token = localStorage.getItem('token');
    try {
      const response = await api.post(`/admin/cashout`, {
          query: searchedUserId,
          amount: parseFloat(cashOutAmount),
      }, {
          headers: {
              'Content-Type': 'application/json',
              "Authorization": `Bearer ${token}`,
          },
      });
  
      if (response.status === 200) {
          setSuccessMessage('Cash out successful!');
          setUserBalance((prevBalance) => prevBalance - parseFloat(cashOutAmount));
          setAmountCredited(parseFloat(cashOutAmount));
          setCashOutAmount('');
          setSuccessWindow(true);
      } else {
          setErrorMessage(response.data.message || 'Cash out failed.');
      }
    } catch (error) {
        console.error('Error during cash out:', error.response.data.message);
        setErrorMessage(error.response.data.message || 'An error occurred during the cash out process. Please try again.');
    } finally {
        setLoadingCashOut(false);
        setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    setIsConfirming(false); // Reset to show the "Cash out" button again
  };

  const handleSuccessWindow = () => {
    setSuccessWindow(false);
    setAmountCredited(0);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fd] flex flex-col items-center p-4">
      <Header
                headerName={'Cash Out'}
                navigateTo={'/admin'}
            />

      {successWindow && (
            <div className="min-h-screen mt-[6rem] bg-[#f8f9fd] flex flex-col items-center p-4">
                {/* Success Content */}
                <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
                    <div className="w-20 h-20 flex items-center justify-center bg-green-100 rounded-full mb-6">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-12 h-12 text-green-600"
                    >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                        />
                    </svg>
                    </div>

                    <h2 className="text-xl font-bold text-gray-800 text-center mb-4">Credit is successfully deducted</h2>
                    <p className="text-sm text-gray-600 text-center mb-1">
                    Recipient: <span className="font-semibold">{searchedUsername}</span>
                    </p>
                    <p className="text-sm text-gray-600 text-center mb-6">
                    Amount: <span className="font-semibold">₱{amountCredited.toFixed(2)}</span>
                    </p>

                    <button
                    onClick={() => navigate('/admin')}
                    className="w-full mb-2 py-3 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-md hover:scale-105 transform transition duration-300 font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50"
                    >
                    Go back to dashboard
                    </button>
                    <button
                    onClick={handleSuccessWindow}
                    className="w-full py-3 bg-gray-400 text-white rounded-md hover:scale-105 transform transition duration-300 font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50"
                    >
                    Cash Out More
                    </button>
                </div>
            </div>
      )}
            
      <div className="flex-1 mt-[3rem] space-y-4 w-full h-auto max-h-[470px] 
                        max-w-sm bg-white p-6 rounded-lg shadow-md">

        <div className="mb-4">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">Username or Email</label>
          <input
            type="text"
            id="search"
            placeholder="Enter username or email"
            className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 leading-tight placeholder-orange-300"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            onClick={handleSearch}
            className={`p-3 mt-4 w-full bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-md hover:scale-105 transform transition duration-300 font-semibold shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 ${loadingSearch ? 'cursor-not-allowed' : ''}`}
            disabled={loadingSearch}
          >
            {loadingSearch ? 'Searching...' : 'Search'}
          </button>
        </div>

        {userBalance !== null && (
          <>
            <div className="mb-4 bg-gray-100 rounded-lg shadow-inner p-3">
              <p className="text-sm font-medium text-gray-700">Username: <span className="font-bold">{searchedUsername}</span></p>
              <p className="text-sm font-medium text-gray-700">Email: <span className="font-bold">{searchedEmail}</span></p>
              <p className="text-sm font-medium text-gray-700">Current Balance: <span className="font-bold">₱{userBalance.toFixed(2)}</span></p>
            </div>

            <div className="mb-4">
              <label htmlFor="topup" className="block text-sm font-medium text-gray-700">Cash Out Amount</label>
              <input
                type="number"
                id="topup"
                placeholder="Enter amount"
                className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 leading-tight placeholder-orange-300"
                value={cashOutAmount}
                onChange={(e) => setCashOutAmount(e.target.value)}
              />
              {!isConfirming ? (
                <button
                  onClick={() => setIsConfirming(true)} // Show confirm/cancel buttons
                  className={`p-3 mt-4 w-full bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-md hover:scale-105 transform transition duration-300 font-semibold shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 ${loadingCashOut ? 'cursor-not-allowed' : ''}`}
                  disabled={loadingCashOut || !cashOutAmount}
                >
                  {loadingCashOut ? 'Processing...' : 'Cash Out'}
                </button>
              ) : (
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleCashOut}
                    className="p-3 w-2/3 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-md hover:scale-105 transform transition duration-300 font-semibold shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-3 w-1/3 bg-gray-400 text-white rounded-md hover:scale-105 transform transition duration-300 font-semibold shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {errorMessage && <p className="text-red-500 text-left text-xs mb-4">{errorMessage}</p>}
        {successMessage && <p className="text-green-500 text-left text-xs mb-4">{successMessage}</p>}
      </div>
    </div>
  );
};

export default Cashout;