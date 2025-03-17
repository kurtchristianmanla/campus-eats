import React, { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from "framer-motion";
import { fetchUserProfile, updateUserProfile, changeUserPassword } from '../api/userProfileAPI';
import Header from '../utils/header';
import CropperComponent from './cropper';
import Loading from './loading';

// const protocol = process.env.REACT_APP_PROTOCOL || "http";
// const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
// const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

// const address = `${protocol}://${host_ip}:${backend_port}`;

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const ProfileUser = (user_type_route) => {
    const [view, setView] = useState('profile');
    const [fileName, setFileName] = useState("No file chosen");

    const [user, setUser] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [storeName, setStoreName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');

    const [profilePicture, setProfilePicture] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const [showCropper, setShowCropper] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
    const [passwordChangeError, setPasswordChangeError] = useState('');
    const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');
    const [changeProfileError, setChangeProfileError] = useState('');
    const [changeProfileSuccess, setChangeProfileSuccess] = useState('');

    const token = localStorage.getItem('token');

    // Fetch user profile on component mount
    useEffect(() => {
        document.title = "Campus Eats | Profile";
        const fetchProfile = async () => {
            try {
                const data = await fetchUserProfile(token);
                setUser(data.user);
                setFirstName(data.user.first_name);
                setLastName(data.user.last_name);
                setStoreName(data.user.store_name)
                setUsername(data.user.username);
                setEmail(data.user.email);
                setProfilePicture(data.user.profile_picture);
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };

        // Disable scrolling and zooming
        document.body.style.overflow = 'hidden';
        document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

        fetchProfile();

        // Clean up the styles on component unmount
        return () => {
            document.body.style.overflow = 'auto';
            document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
        };
    }, [token]);

    // Handle profile picture upload
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        console.log(file);

        const maxSizeInMB = 5; // Set max size in MB
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

        if (file) {
            if (file.size > maxSizeInBytes) {
                alert(`File size exceeds ${maxSizeInMB} MB. Please select a smaller file.`);
                event.target.value = ''; // Clear the input
            } else {
                setFileName(file.name);
                setSelectedFile(file);
                setCroppedImage(null);
                setShowCropper(true);
            }
        } else {
            setFileName("No file chosen");
            setSelectedFile(null);
            setCroppedImage(null);
        }
    };
    
    // Handle the cropped image
    const handleCropComplete = (imageData) => {
      setCroppedImage(imageData); // Save the cropped image to state
      setShowCropper(false); // Hide the cropper after cropping
    };

    const toggleProfile = () => {
        setView("profile");
        setShowCropper(false);
    };

    // Toggle form visibility
    const toggleEditProfile = () => {
        setView("changeProfile");
        setSelectedFile(null);
        setFileName("No file chosen");
        setPasswordChangeError('');
        setPasswordChangeSuccess('');
        setChangeProfileError('');
        setChangeProfileSuccess('');
        setFirstName(user.first_name);
        setLastName(user.last_name);
        setUsername(user.username);
        setStoreName(user.store_name)
        setEmail(user.email);
    };

    const toggleChangePassword = () => {
        setView("changePassword");
        setPasswordChangeError('');
        setPasswordChangeSuccess('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const validateEmail = (email) => {
        const emailRegex = /^.+@phinmaed\.com$/;
        return emailRegex.test(email);
    };

    // Handle form submission to update the profile
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setChangeProfileError('');
        setChangeProfileSuccess('');
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('first_name', firstName);
        formData.append('last_name', lastName);
        formData.append('username', username);
        formData.append('email', email);
        formData.append('store_name', storeName)
        
        // if (selectedFile) {
        //     formData.append('profile_picture', selectedFile);
        // }

        // Validate email
        if (user.user_type === "customer") {
            if (!validateEmail(formData.email || email)) {
                setChangeProfileError('Email must end with \'@phinmaed.com\', provided by the university');
                setIsSubmitting(false);    
                // setLoading(false);
                return;
            }
        }

        // Upload the cropped image if it exists
        if (croppedImage) {
            const blob = await fetch(croppedImage).then((r) => r.blob());
            formData.append('profile_picture', blob, `${user.username}_profile.jpg`);
        } else if (selectedFile) {
            // Otherwise, upload the original file
            formData.append('profile_picture', selectedFile, `${user.username}_profile.jpg`);
        }

        try {
            const data = await updateUserProfile(token, formData);

            if (data && data.user) {
                setUser(data.user);
                setProfilePicture(data.user.profile_picture); // Update the profile picture displayed
                // alert('Profile updated successfully!');
                setChangeProfileSuccess('Profile updated successfully!');
                setIsSubmitting(false);    
            } else {
                // alert(`Error: ${errorData.message || 'Failed to update profile.'}`);
                setChangeProfileError('Failed to update profile.');
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setChangeProfileError( error.response.data.message || 'An error occurred during updating process. Please try again.');
            setIsSubmitting(false);
            // alert('Error updating profile. Please try again later.');
        }
    };

     // Handle password change submission
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordChangeError('');
        setPasswordChangeSuccess('');
        setIsPasswordSubmitting(true); // Set loading state to true

        if (newPassword !== confirmPassword) {
            setPasswordChangeError('New password and confirm password do not match.');
            setIsPasswordSubmitting(false);
            return;
        }

        if (newPassword === currentPassword) {
            setPasswordChangeError('New password and current password must not be the same.');
            setIsPasswordSubmitting(false);
            return;
        }

        try {
            await changeUserPassword(token, currentPassword, newPassword);

            setPasswordChangeSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (error) {
            console.error('Error changing password:', error);
            // const errorMessage = error.message || 'An error occurred. Please try again.';
            // setPasswordChangeError(errorMessage);
            let errorMessage = 'An error occurred. Please try again.';

            if (error.response) {
                // Extract message from backend response
                errorMessage = error.response.data.message || errorMessage;
            } else if (error.request) {
                errorMessage = 'No response from server. Please check your network.';
            } else {
                errorMessage = error.message;
            }

            setPasswordChangeError(errorMessage);
        } finally {
            setIsPasswordSubmitting(false); // Reset loading state
        }
    };

    if (!user) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-[#f8f9fd] flex flex-col items-center p-4">

            <Header
                headerName={'Profile'}
                navigateTo={`${user_type_route}`}
            />

            {view === 'changeProfile' && (
                    <CropperComponent
                        isVisible={showCropper}
                        file={selectedFile}
                        onCropComplete={handleCropComplete}
                        aspectRatio={1} // You can change aspect ratio as needed
                        className="my-1 z-10"
                    />
            )}

            {/* Dark overlay */}
            {showCropper && (
                <div
                    className={`fixed inset-0 bg-black ${
                        showCropper
                            ? "bg-opacity-50 pointer-events-auto"
                            : "bg-opacity-0 pointer-events-none"
                    } transition-opacity duration-300 z-10`} />
            )}

            {/* Profile Display */}
            {view === 'profile' && (
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex justify-center items-center mt-[-7rem] min-h-screen"
            >
                <div className="bg-gradient-to-br from-white via-white to-blue-200/50 shadow-lg rounded-lg w-full max-w-3xl 
                                hover:scale-105 transition-transform duration-300 relative">
                    
                    {/* Cover Photo */}
                    <div className="absolute top-0 left-0 w-full h-32 z-0">
                    <div className="w-full h-full bg-indigo-500 text-white text-6xl opacity-25 rounded-t-lg 
                        font-bold flex justify-center items-center overflow-hidden">
                            {profilePicture && (
                                <img
                                src={profilePicture}
                                alt="Profile"
                                className="object-cover w-full h-full"
                                />
                            )}
                        </div>
                    </div>
                    <div className="lg:flex flex-col sm:flex-row items-center sm:items-start relative z-10 p-6">

                        {/* Profile Picture */}
                        <div className="flex-shrink-0">
                            <div className="w-32 h-32 bg-indigo-500 text-white text-6xl font-bold flex justify-center 
                                        items-center rounded-full overflow-hidden mb-1 sm:mr-4 border-4 border-white">
                                {profilePicture ? (
                                    <img
                                    src={profilePicture}
                                    alt="Profile"
                                    className="object-cover w-full h-full"
                                    />
                                ) : (
                                    `${user.username.charAt(0).toUpperCase()}`
                                )}
                            </div>
                        </div>

                        {/* Info and Buttons */}
                        <div className="flex-1">
                            <div className="flex items-start flex-col">
                                <h1 className="text-2xl mr-1 font-bold">{`${user.username}`}</h1>
                                {user.user_type === 'seller' && (
                                    <h1 className="text-xs font-semibold">{`(${user.store_name})`}</h1>
                                )}
                            </div>
                            <p className="text-sm text-gray-600">
                                {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Name yet to be set'} ● {user.user_type}
                            </p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            {user.user_type === "seller" && (
                                <p className="text-sm text-green-600">Balance: UC {(user.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                            )}

                            <div className="mt-4 space-x-2 flex">
                                <button
                                onClick={toggleEditProfile}
                                className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-4 py-2 rounded 
                                            hover:from-orange-500 hover:to-orange-600 text-sm flex-1"
                                >
                                Edit Profile
                                </button>
                                <button
                                onClick={toggleChangePassword}
                                className="bg-gradient-to-br from-gray-500 via-gray-500 to-gray-400 text-white px-4 py-2 
                                            rounded hover:from-gray-600 hover:to-gray-500 text-sm whitespace-nowrap"
                                >
                                Change Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
            )}

            {view === 'changeProfile' && (    
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex justify-center items-center lg:mt-[-3rem] mt-[-6rem] w-full min-h-screen"
            >
                <div className="flex-1 bg-white shadow-lg rounded-lg p-6 max-w-[400px]">
                    {/* Update Profile Form */}
                    <form
                        onSubmit={handleProfileUpdate}
                        className="space-y-4 mb-2"
                    >

                        {/* Profile Picture Upload */}
                        <div>
                            <label className="block text-sm font-bold mb-2">Profile Picture:</label>
                            <div className="flex items-center">
                                <input
                                    id="fileInput"
                                    type="file"
                                    accept="image/*"
                                    maxLength="5MB"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <label
                                    htmlFor="fileInput"
                                    className="cursor-pointer px-4 py-2 bg-blue-500 text-white text-sm 
                                            w-max rounded-md shadow-sm hover:bg-blue-600 transition"
                                >
                                    Choose File
                                </label>
                                <span className="ml-3 text-gray-600 truncate max-w-[200px] 
                                            overflow-hidden text-ellipsis">{fileName}</span>
                                <span className="ml-3 text-blue-600 max-w-[200px] hover:underline cursor-pointer"
                                        onClick={() => {setShowCropper(true)}}
                                >
                                        {selectedFile ? 'View' : ''}
                                </span>
                            </div>
                        </div>

                        {/* First Name */}
                        <div>
                        <label className="block text-sm font-bold mb-1">First Name:</label>
                        <input
                            type="text"
                            placeholder='First Name'
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                                    focus:ring-2 focus:ring-blue-500 leading-tight placeholder-gray-300"
                        />
                        </div>

                        {/* Last Name */}
                        <div>
                        <label className="block text-sm font-bold mb-1">Last Name:</label>
                        <input
                            type="text"
                            placeholder='Last Name'
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                                    focus:ring-2 focus:ring-blue-500 leading-tight placeholder-gray-300"
                        />
                        </div>

                        {user.user_type === 'seller' && (
                            <div>
                                <label className="block text-sm font-bold mb-1">Store Name:</label>
                                <input
                                    type="text"
                                    placeholder='Store Name'
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                                            focus:ring-2 focus:ring-blue-500 leading-tight placeholder-gray-300"
                                    required
                                />
                            </div>
                        )}

                        {/* Username */}
                        <div>
                        <label className="block text-sm font-bold mb-1">Username:</label>
                        <input
                            type="text"
                            placeholder='Username'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                                    focus:ring-2 focus:ring-blue-500 leading-tight placeholder-gray-300"
                            required
                        />
                        </div>

                        {/* <div>
                        <label className="block text-sm font-bold mb-1">Email:</label>
                        <input
                            type="email"
                            placeholder='Email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                                    focus:ring-2 focus:ring-blue-500 leading-tight placeholder-gray-300"
                            required
                        />
                        </div> */}

                        {/* Buttons */}
                        <div className="flex space-x-2">
                            <button
                                type="submit"
                                className="w-2/3 bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded 
                                            hover:from-green-500 hover:to-blue-600"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Save Profile'}
                            </button>
                            <button
                                type="button"
                                onClick={toggleProfile}
                                className="w-1/3 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                    {changeProfileError && <p className="text-red-500 text-left text-xs mb-2">{changeProfileError}</p>}
                    {changeProfileSuccess && <p className="text-green-500 text-left text-xs mb-2">{changeProfileSuccess}</p>}
                </div>
            </motion.div>
            )}

            {view === 'changePassword' && (
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex justify-center items-center lg:mt-[-4rem] mt-[-6rem] w-full min-h-screen"
            >
                <div className="flex-1 bg-white shadow-lg rounded-lg p-6 max-w-[400px]">
                    <form onSubmit={handleChangePassword} className="space-y-4 mb-2">
                        <div>
                            <label htmlFor="current-password" className="block text-sm font-bold mb-1">Current Password:</label>
                            <div className="relative">
                                <input 
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    id="current-password"
                                    placeholder="Enter current password"
                                    value={currentPassword} 
                                    onChange={(e) => setCurrentPassword(e.target.value)} 
                                    className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                                    focus:ring-2 focus:ring-blue-500 leading-tight placeholder-gray-300" 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)} // Toggle password visibility
                                    className="absolute right-3 top-1/2 transform -translate-y-1/4 leading-tight 
                                    text-gray-500 hover:text-gray-700"
                                >
                                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />} {/* Eye icon */}
                                </button>    
                            </div>
                        </div>

                        <div>
                            <label htmlFor="new-password" className="block text-sm font-bold mb-1">New Password:</label>
                                <div className="relative">
                                    <input 
                                        type={showNewPassword ? 'text' : 'password'}
                                        id="new-password"
                                        placeholder="Enter new password"
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)} 
                                        className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                                        focus:ring-2 focus:ring-blue-500 leading-tight placeholder-gray-300" 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)} // Toggle password visibility
                                        className="absolute right-3 top-1/2 transform -translate-y-1/4 leading-tight 
                                        text-gray-500 hover:text-gray-700"
                                    >
                                        {showNewPassword ? <FaEyeSlash /> : <FaEye />} {/* Eye icon */}
                                    </button> 
                                </div>
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-bold mb-1">Confirm New Password:</label>
                            <div className="relative">
                                    <input 
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        id="confirm-password"
                                        placeholder="Confirm new password"
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)} 
                                        className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                                        focus:ring-2 focus:ring-blue-500 leading-tight placeholder-gray-300" 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)} // Toggle password visibility
                                        className="absolute right-3 top-1/2 transform -translate-y-1/4 leading-tight 
                                        text-gray-500 hover:text-gray-700"
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />} {/* Eye icon */}
                                    </button> 
                                </div>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                type="submit"
                                className="w-2/3 bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded hover:from-green-500 hover:to-blue-600"
                                disabled={isPasswordSubmitting} // Disable button while submitting
                            >
                                {isPasswordSubmitting ? 'Updating...' : 'Update Password'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setView("profile")}
                                className="w-1/3 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                    {passwordChangeError && <p className="text-red-500 text-left text-xs mb-2">{passwordChangeError}</p>}
                    {passwordChangeSuccess && <p className="text-green-500 text-left text-xs mb-2">{passwordChangeSuccess}</p>}
                </div>
            </motion.div>
            )}
        </div>
    );
};

export default ProfileUser;
