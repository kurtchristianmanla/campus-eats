import React from 'react';
import Header from './header';
import { motion } from 'framer-motion';

const UsePolicy = (user_type_route) => {
    return (
        <div className="min-h-screen bg-[#f8f9fd] p-6">
            <Header
                headerName={'Use Policy'}
                navigateTo={`${user_type_route}`}
            />

            <div className="max-w-4xl mx-auto bg-white rounded-lg p-8 relative overflow-hidden">

                <motion.div
                    className="absolute -top-12 -right-32 opacity-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 0.5, duration: 1, ease: "easeInOut" }}
                >
                    <img
                        src="/test/campus-eats-logo.png"
                        alt="Campus Eats Logo"
                        className="w-72 h-72 object-contain opacity-30 blur-sm"
                    />
                </motion.div>

                <motion.h1
                    className="text-2xl font-bold text-left mb-8 text-orange-600"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
                >
                    Use Policy for CampusEats
                </motion.h1>

                {/* Section 1: Introduction */}
                <motion.section
                    className="mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.8, ease: "easeInOut" }}
                >
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">1. Introduction</h2>
                    <p className="text-gray-600 leading-relaxed text-sm">
                        Welcome to CampusEats. This Use Policy outlines the terms and conditions governing the use of our web app, including the built-in payment system that allows users to load and manage a balance for transactions. By using our platform, you agree to comply with this policy.
                    </p>
                </motion.section>

                {/* Section 2: Account Registration & Security */}
                <motion.section
                    className="mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.8, ease: "easeInOut" }}
                >
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">2. Account Registration & Security</h2>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                        <li>Users must create an account to access the services.</li>
                        <li>Sellers are only allowed to register via administrator supervision.</li>
                        <li>Customers are always available to register; a <span className="font-medium">phinmaed.com</span> email address is required to register.</li>
                        <li>A digital wallet comes with the creation of an account.</li>
                        <li>It is the user’s responsibility to maintain the security of their login credentials.</li>
                        <li>CampusEats is not liable for unauthorized transactions resulting from compromised accounts.</li>
                        <li>All Customer accounts are susceptible to automatic account deletion after 6 months of inactivity. A notice will be emailed to the account holder two weeks before the account’s expiry.</li>
                        <li>Any remaining UniCash balance will be voided after account deletion.</li>
                    </ul>
                </motion.section>

                {/* Section 3: Loading Balance */}
                <motion.section
                    className="mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8, duration: 0.8, ease: "easeInOut" }}
                >
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">3. Loading Balance</h2>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                        <li>Users can add UniCash (UC), the CampusEats’ system-wide tender, to their account balance using approved payment methods.</li>
                        <li>UCs loaded into the balance are non-transferable to other accounts.</li>
                        <li>A verification process may be required to prevent fraud.</li>
                        <li>Any accidents and mishaps during loading of UniCash, which result in loading an account over the requested amount, may be cashed out by the user immediately.</li>
                    </ul>
                </motion.section>

                {/* Section 4: Using Balance for Payments */}
                <motion.section
                    className="mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1, duration: 0.8, ease: "easeInOut" }}
                >
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">4. Using Balance for Payments</h2>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                        <li>The account balance can be used for purchases within the app.</li>
                        <li>Users must ensure they have sufficient funds before completing a transaction.</li>
                        <li>If the balance is insufficient, users may not proceed with their transaction.</li>
                    </ul>
                </motion.section>

                {/* Section 5: Concessionaire Responsibilities */}
                <motion.section
                    className="mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2, duration: 0.8, ease: "easeInOut" }}
                >
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">5. Concessionaire Responsibilities</h2>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                        <li>All sellers are required to adhere to all food, health, and hygiene standards.</li>
                        <li>In a scenario where a seller was not able to prepare an order within the expected time, a refund will be issued for the order.</li>
                    </ul>
                </motion.section>

                {/* Section 6: Refunds & Disputes */}
                <motion.section
                    className="mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.4, duration: 0.8, ease: "easeInOut" }}
                >
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">6. Refunds & Disputes</h2>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                        <li>Order cancellations can only be made on or before the “preparation” phase of the order.</li>
                        <li>If an order issue arises (e.g., missing or incorrect items), users may request a resolution through customer support.</li>
                    </ul>
                </motion.section>

                {/* Section 7: Cashing Out for Sellers */}
                <motion.section
                    className="mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.6, duration: 0.8, ease: "easeInOut" }}
                >
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">7. Cashing Out for Sellers</h2>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                        <li>Only concessionaires are allowed to cash out their UCs to authorized administrators.</li>
                        <li>A verification process may be required to prevent fraud.</li>
                    </ul>
                </motion.section>

                {/* Section 8: Fraud Prevention & Abuse */}
                <motion.section
                    className="mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.8, duration: 0.8, ease: "easeInOut" }}
                >
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">8. Fraud Prevention & Abuse</h2>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                        <li>Any suspicious activity, such as unauthorized transactions, fraudulent chargebacks, or misuse of promotions, may result in account suspension.</li>
                        <li>CampusEats reserves the right to investigate and take appropriate action, including legal measures if necessary.</li>
                    </ul>
                </motion.section>

                {/* Section 9: Modifications to the Policy */}
                <motion.section
                    className="mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2, duration: 0.8, ease: "easeInOut" }}
                >
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">9. Modifications to the Policy</h2>
                    <ul className="list-disc list-inside text-gray-600 space-y-2 text-sm">
                        <li>CampusEats reserves the right to update this policy at any time.</li>
                        <li>Users will be notified of significant changes via email or app notifications.</li>
                    </ul>
                </motion.section>

                {/* Section 10: Contact & Support */}
                <motion.section
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.2, duration: 0.8, ease: "easeInOut" }}
                >
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">10. Contact & Support</h2>
                    <p className="text-gray-600 leading-relaxed text-sm">
                        For any questions or concerns regarding this policy, please contact <a href="mailto:campuseatsproduction@gmail.com" className="text-orange-500 hover:underline">campuseatsproduction@gmail.com</a>.
                    </p>
                </motion.section>
            </div>
        </div>
    );
};

export default UsePolicy;