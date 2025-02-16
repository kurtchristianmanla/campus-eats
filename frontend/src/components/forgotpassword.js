import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const protocol = process.env.REACT_APP_PROTOCOL || "http";
const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

const address = `${protocol}://${host_ip}:${backend_port}`;

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Campus Eats | Forgot Password";

        // Disable scrolling and zooming
        document.body.style.overflow = 'hidden';
        document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

        // Clean up the styles on component unmount
        return () => {
            document.body.style.overflow = 'auto';
            document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            alert("Please enter your email.");
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const response = await fetch(`${address}/user/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Password reset link has been sent to your email.');
            } else {
                setMessage(data.message || 'Failed to send password reset link.');
            }
        } catch (error) {
            console.error('Error sending reset email:', error);
            setMessage('An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/login'); // Redirect to the login page
      };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="mt-[-8rem] w-full max-w-sm bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Forgot Password</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Enter your email to request a password reset.
                </p>

                {message && (
                    <p className="mb-4 text-sm text-left text-red-500">{message}</p>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter email address"
                            className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                            focus:ring-2 focus:ring-blue-500 leading-tight placeholder-orange-300 mb-4"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    {/* <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white 
                        font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 
                        hover:from-orange-500 hover:to-orange-600"
                    >
                        {loading ? 'Sending...' : 'Send Email Link'}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="w-full mt-4 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400"
                    >
                        Cancel
                    </button> */}
                    <div className="flex justify-end gap-2 mt-4">
                        {/* Cancel Button */}
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="py-2 px-4 bg-gray-300 text-gray-800 font-semibold rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>

                        {/* Send Link Button */}
                        <button
                            type="submit"
                            disable={loading}
                            className="py-2 px-4 bg-gradient-to-r from-orange-400 to-orange-500 
                            text-white font-semibold rounded hover:bg-blue-700 hover:from-orange-500 hover:to-orange-600"
                        >
                            {loading ? 'Sending...' : 'Send Email Link'}
                        </button>
                        </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
