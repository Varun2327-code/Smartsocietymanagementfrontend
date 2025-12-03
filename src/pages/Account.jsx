import React from "react";
import {
  FaWallet,
  FaQrcode,
  FaCreditCard,
  FaPlus,
  FaTrash,
  FaHistory,
  FaRupeeSign,
} from "react-icons/fa";
import { motion } from "framer-motion";

const FinancialDashboard = () => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const paymentHistory = [
    { date: "2025-03-15", amount: "₹29,000", status: "Completed" },
    { date: "2025-04-10", amount: "₹15,000", status: "Pending" },
    { date: "2025-05-01", amount: "₹13,000", status: "Completed" },
    { date: "2025-06-10", amount: "₹12,000", status: "Completed" },
  ];

  const upcomingBills = [
    { name: "Water Bill", amount: "₹300", due: "Due in 4 days" },
    { name: "Gas Bill", amount: "₹540", due: "Due in 10 days" },
    { name: "Clubhouse Membership", amount: "₹1200", due: "Due in 18 days" },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="p-6 space-y-8 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-blue-800">Financial Dashboard</h1>
        <p className="text-gray-600">Manage your wallet, payments, and bills</p>
      </motion.div>

      {/* Wallet Card */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white p-6 rounded-2xl shadow-xl flex justify-between items-center"
      >
        <div>
          <p className="text-sm opacity-80">Available Balance</p>
          <p className="text-4xl font-bold">₹ 2,000.00</p>
        </div>
        <button className="bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-gray-100 transition">
          Add Funds
        </button>
      </motion.div>

      {/* Grid - UPI & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* UPI Payment */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-xl border"
        >
          <div className="flex items-center mb-4">
            <FaQrcode className="text-green-600 text-3xl mr-4" />
            <div>
              <h2 className="text-xl font-bold">UPI Payment</h2>
              <p className="text-gray-500 text-sm">Scan to pay instantly</p>
            </div>
          </div>

          <div className="flex justify-center">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=scanKarle@upiID"
              alt="UPI QR"
              className="rounded-xl shadow"
            />
          </div>

          <p className="text-center text-sm text-gray-500 mt-3">
            UPI ID: <span className="font-semibold">scanKarLe@upiID</span>
          </p>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-xl border"
        >
          <div className="flex items-center mb-4">
            <FaCreditCard className="text-purple-600 text-3xl mr-4" />
            <div>
              <h2 className="text-xl font-bold">Payment Methods</h2>
              <p className="text-gray-500 text-sm">Manage your cards</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Visa */}
            <div className="bg-blue-600 text-white px-4 py-3 rounded-xl flex justify-between items-center">
              <div>Visa •••• 1234</div>
              <FaTrash />
            </div>

            {/* MasterCard */}
            <div className="bg-orange-500 text-white px-4 py-3 rounded-xl flex justify-between items-center">
              <div>MasterCard •••• 6578</div>
              <FaTrash />
            </div>

            {/* Add New */}
            <button className="w-full border border-gray-300 py-3 rounded-xl flex justify-center items-center space-x-2 hover:bg-gray-100">
              <FaPlus />
              <span>Add New Card</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Maintenance Due */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl p-6 shadow-xl border"
      >
        <div className="flex items-center mb-4">
          <FaRupeeSign className="text-yellow-600 text-3xl mr-4" />
          <div>
            <h2 className="text-xl font-bold">Maintenance Due</h2>
            <p className="text-gray-500 text-sm">View & pay pending dues</p>
          </div>
        </div>

        <div className="flex justify-between">
          <div>
            <p className="text-gray-700 font-medium text-lg">Pending Amount</p>
            <p className="text-3xl font-bold text-red-600">₹ 3,200</p>
            <p className="text-sm text-gray-500 mt-1">Due Date: 10 Dec 2025</p>
            <p className="text-sm text-gray-500">Late fee: ₹100/day</p>
          </div>

          <button className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold">
            Pay Maintenance
          </button>
        </div>
      </motion.div>

      {/* Upcoming Bills */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl p-6 shadow-xl border"
      >
        <div className="flex items-center mb-4">
          <FaHistory className="text-indigo-600 text-3xl mr-4" />
          <div>
            <h2 className="text-xl font-bold">Upcoming Bills</h2>
            <p className="text-gray-500 text-sm">Stay ahead of payments</p>
          </div>
        </div>

        <div className="space-y-3">
          {upcomingBills.map((bill, index) => (
            <div
              key={index}
              className="flex justify-between bg-gray-50 p-4 rounded-xl border"
            >
              <div>
                <p className="font-semibold text-gray-800">{bill.name}</p>
                <p className="text-gray-500 text-sm">{bill.due}</p>
              </div>
              <p className="text-blue-600 font-semibold">{bill.amount}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Ledger Summary */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl p-6 shadow-xl border"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Annual Ledger Summary
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-xl text-center shadow">
            <p className="text-sm text-gray-500">Total Maintenance (2025)</p>
            <p className="text-xl font-bold text-blue-700">₹48,000</p>
          </div>

          <div className="p-4 bg-green-50 rounded-xl text-center shadow">
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-xl font-bold text-green-700">₹44,000</p>
          </div>

          <div className="p-4 bg-red-50 rounded-xl text-center shadow">
            <p className="text-sm text-gray-500">Outstanding</p>
            <p className="text-xl font-bold text-red-700">₹4,000</p>
          </div>
        </div>
      </motion.div>

      {/* Payment History */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl p-6 shadow-xl border"
      >
        <div className="flex items-center mb-4">
          <FaHistory className="text-orange-600 text-3xl mr-4" />
          <div>
            <h2 className="text-xl font-bold">Payment History</h2>
            <p className="text-gray-500 text-sm">Your past transactions</p>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Date</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paymentHistory.map((item, i) => (
                <tr key={i} className="border-b">
                  <td className="p-3">{item.date}</td>
                  <td className="p-3">{item.amount}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-xl text-white text-sm ${
                        item.status === "Completed"
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 flex space-x-3">
                    <button className="text-blue-600 hover:underline text-sm">
                      Download Receipt
                    </button>
                    <button className="text-red-600 hover:underline text-sm">
                      Raise Dispute
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FinancialDashboard;
