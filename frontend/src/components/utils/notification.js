import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);
    const notificationSound = new Audio('/test/notification.wav');
    notificationSound.preload = "auto"; // Ensure the sound is loaded early

    const showNotification = (title, body) => {
        if (Notification.permission === 'granted') {
            notificationSound.currentTime = 0; // Restart the sound
            notificationSound.play(); 

            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, { 
                    body,
                    silent: true
                });
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                showNotification(title, body);
                }
            });
        }
    };

    return (
        <NotificationContext.Provider value={{ notification, setNotification, showNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);