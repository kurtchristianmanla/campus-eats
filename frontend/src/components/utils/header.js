import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ headerName, navigateTo, bgColor = '[#f8f9fd]' }) => {
    const navigate = useNavigate();

    return (
        <header className={`w-full flex items-center gap-2 sticky mb-2 top-0 bg-${bgColor} z-10 fixed py-3`}>
                <button className="text-gray-600" onClick={() => navigate(navigateTo)}>
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
                <h1 className="text-lg font-bold text-gray-800">{headerName}</h1>
        </header>
    )
}

export default Header;