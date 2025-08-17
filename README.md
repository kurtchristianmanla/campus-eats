#  **Campus Eats: Consolidated System for Food Ordering, Queueing, and Payment Management**

A progressive web-based system for efficient food ordering, queuing, and payment management

🚀 Live Demo

[Campus Eats – Hosted App](https://campus-eats-iota.vercel.app/login)  
[Campus Eats – Live Queueing](https://campus-eats-iota.vercel.app/live-queue) (Real-Time Queue Monitor)

⚠️ Project Notice

This project is archived and no longer actively maintained.  
The Redis instance previously used for caching and queue management has expired, so the live system is not currently functional.  

However, the project can still be run if a new Redis database is set up and properly configured.

📱 Mobile-First PWA

This system is built as a Progressive Web App (PWA) with a mobile-first UI design for an optimized experience on smartphones.  
The desktop version is functional but not yet fully refined.

📌 Features

 User registration and login  
 Digital wallet with top-up system  
 Food ordering  
 Queue management with real-time updates  
 Seller POS interface  
 Admin dashboard for monitoring  
 Food Recommendation System (Hybrid: Content-Based + Collaborative Filtering)

🤖 AI Integration

This project integrates **Groq's Llama 3.1 8B Instant** model via the Chat Completions API.  
It is used for generating food tags dynamically from menu items.

🛠️ Tech Stack

Frontend: React + Tailwind CSS, hosted on Vercel  
Backend: Node.js + Express, hosted on Render  
Database: MongoDB Atlas  
Cache/Queue: Redis (required for full functionality)  
Storage: Cloudinary (for images)  

📂 Repository Structure

/frontend      → UI files  
/backend       → Server and API logic  
/docs          → Screenshots of live demo

👨‍💻 Author

Kurt Christian Manla – BS Computer Engineering, PHINMA – University of Pangasinan
