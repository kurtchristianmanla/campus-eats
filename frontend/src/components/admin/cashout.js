import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/outline';
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
  const [searchedPicture, setSearchedPicture] = useState(null);
  const [userBalance, setUserBalance] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Campus Eats | Cash Out";

    // Disable scrolling and zooming
    // document.body.style.overflow = 'hidden';
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
            setSearchedPicture(response.data.profile_picture);
        } else {
            setSuccessMessage("");
            setErrorMessage(response.data.message || 'User not found.');
            setUserBalance(null);
            setCashOutAmount('');
            
            setSearchedUserId('');
            setSearchedUsername('');
            setSearchedEmail('');
            setSearchedPicture(null);
        }
    } catch (error) {
        console.error('Error searching user:', error);
        setSuccessMessage("");
        setErrorMessage( error.response.data.message || 'An error occurred while searching for the user. Please try again.');
    } finally {
        setLoadingSearch(false);
    }
  };


  const handleCashOut = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoadingCashOut(true);

    if (!/^\d+(\.\d{1,2})?$/.test(cashOutAmount)) {
      setErrorMessage("Please enter a valid amount with up to 2 decimal places");
      return;
    }

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
          setErrorMessage("");
          setSuccessMessage('Cash out successful!');
          setUserBalance((prevBalance) => prevBalance - parseFloat(cashOutAmount));
          setAmountCredited(parseFloat(cashOutAmount));
          setCashOutAmount('');
          setSuccessWindow(true);
      } else {
          setErrorMessage(response.data.message || 'Cash out failed.');
          setSuccessMessage("");
      }
    } catch (error) {
        console.error('Error during cash out:', error.response.data.message);
        setSuccessMessage("");
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      {/* Header */}
      <Header
        headerName={'Cash Out'}
        navigateTo={'/admin'}
      />

      {/* Success Modal */}
      {successWindow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircleIcon className="h-16 w-16 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Cash Out Successful</h2>
              <p className="text-gray-600 mb-4">
                UC {amountCredited.toLocaleString("en-US", { minimumFractionDigits: 2 })} deducted from
              </p>
              <div className="bg-gray-50 rounded-lg p-3 w-full mb-6">
                <p className="font-medium text-gray-800">{searchedUsername}</p>
                <p className="text-sm text-gray-500">{searchedEmail}</p>
              </div>
              <div className="flex flex-col w-full space-y-3">
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={handleSuccessWindow}
                  className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  New Cash Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 max-w-md mx-auto w-full mt-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Search Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Find User</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Username or Email
                </label>
                <div className="w-full space-y-2">
                  {/* Input Field */}
                  <input
                    type="text"
                    id="search"
                    placeholder="Enter username or email"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />

                  {/* Search Button - Now below the input */}
                  <button
                    onClick={handleSearch}
                    disabled={loadingSearch || !searchInput}
                    className={`w-full py-2.5 px-4 bg-gradient-to-r from-orange-600 to-orange-400 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center ${
                      (loadingSearch || !searchInput) ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {loadingSearch ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching...
                      </>
                    ) : (
                      'Search User'
                    )}
                  </button>
                </div>
              </div>

              {/* User Info */}
              {userBalance !== null && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden">
                      {searchedPicture ? (
                        <img src={searchedPicture} alt="Profile" />
                        ) : (
                        <span className="text-orange-600 font-medium">
                        {searchedUsername.charAt(0).toUpperCase()}
                      </span>)}
                    </div>
                    <div>
                      <h3 className="font-medium text-[15px] text-gray-800">{searchedUsername}</h3>
                      <p className="text-[10px] text-gray-500">{searchedEmail}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Balance:</span>
                    <span className="font-semibold">
                      UC {userBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cash Out Form */}
          {userBalance !== null && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Cash Out</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    id="amount"
                    placeholder="0.00"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={cashOutAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                        setCashOutAmount(value);
                      }
                    }}
                  />
                </div>

                {errorMessage && (
                  <div className="flex items-center text-red-600 text-sm">
                    <XCircleIcon className="h-5 w-5 mr-1" />
                    {errorMessage}
                  </div>
                )}

                {!isConfirming ? (
                  <button
                    onClick={() => {
                      if (userBalance < cashOutAmount) {
                        setErrorMessage("Insufficient balance");
                      } else if (cashOutAmount) {
                        setIsConfirming(true);
                        setErrorMessage("");
                      } else {
                        setErrorMessage("Please enter an amount");
                      }
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-orange-400 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                  >
                    Cash Out
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCashOut}
                      disabled={loadingCashOut}
                      className={`flex-1 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors ${
                        loadingCashOut ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {loadingCashOut ? 'Processing...' : 'Confirm'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cashout;