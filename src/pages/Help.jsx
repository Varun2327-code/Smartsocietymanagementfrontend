import React, { useState } from "react";
import {
  FaPhone,
  FaEnvelope,
  FaChevronDown,
  FaChevronUp,
  FaTools,
  FaUsers,
  FaCalendarAlt,
  FaShieldAlt,
  FaExclamationCircle,
} from "react-icons/fa";

const Help = () => {
  const [openFAQ, setOpenFAQ] = useState(null);
  const [search, setSearch] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [issue, setIssue] = useState("");

  const faqs = [
    {
      category: "Family & Members",
      question: "How do I add a family member?",
      answer:
        "Go to the 'Family' section and click on 'Add Member'. Fill in the required details and submit.",
    },
    {
      category: "Maintenance & Complaints",
      question: "How do I submit a maintenance request?",
      answer:
        "Visit the 'Complain Desk' section, click on 'New Request', and describe your issue. You can also attach images if necessary.",
    },
    {
      category: "Events & Community",
      question: "How can I view upcoming events?",
      answer:
        "Go to the 'Events' section to see a list of all scheduled events with their date, time, and location.",
    },
    {
      category: "Security & Privacy",
      question: "Is my personal information secure?",
      answer:
        "Yes, all your data is encrypted and stored securely in Firebase, accessible only by authorized users.",
    },
  ];

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">Help Center</h1>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="🔍 Search help topics..."
          className="w-full p-3 mb-6 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <button className="p-4 bg-blue-100 hover:bg-blue-200 transition rounded-lg flex flex-col items-center shadow">
            <FaUsers className="text-2xl text-blue-600" />
            <span className="mt-2 text-sm">Family Help</span>
          </button>

          <button className="p-4 bg-orange-100 hover:bg-orange-200 transition rounded-lg flex flex-col items-center shadow">
            <FaTools className="text-2xl text-orange-600" />
            <span className="mt-2 text-sm">Maintenance</span>
          </button>

          <button className="p-4 bg-green-100 hover:bg-green-200 transition rounded-lg flex flex-col items-center shadow">
            <FaCalendarAlt className="text-2xl text-green-600" />
            <span className="mt-2 text-sm">Events</span>
          </button>

          <button className="p-4 bg-purple-100 hover:bg-purple-200 transition rounded-lg flex flex-col items-center shadow">
            <FaShieldAlt className="text-2xl text-purple-600" />
            <span className="mt-2 text-sm">Privacy</span>
          </button>
        </div>

        {/* FAQ Section */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">FAQs</h2>

        {filteredFaqs.length === 0 && (
          <p className="text-gray-500 italic">No matching FAQs found.</p>
        )}

        {filteredFaqs.map((faq, index) => (
          <div key={index} className="mb-4 border-b pb-4">
            <p className="text-sm text-blue-600 mb-1">{faq.category}</p>

            <button
              onClick={() => toggleFAQ(index)}
              className="flex justify-between items-center w-full text-left text-lg font-medium text-gray-700 hover:text-blue-500"
            >
              {faq.question}
              {openFAQ === index ? (
                <FaChevronUp className="text-blue-500" />
              ) : (
                <FaChevronDown className="text-gray-500" />
              )}
            </button>

            {openFAQ === index && (
              <p className="mt-2 text-gray-600">{faq.answer}</p>
            )}
          </div>
        ))}

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          {/* Contact Support */}
          <div className="bg-blue-100 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">
              Contact Support
            </h2>
            <p className="text-gray-700 mb-4">
              Need assistance? We're here to help!
            </p>

            <div className="flex items-center gap-4 mb-2">
              <FaPhone className="text-blue-600" />
              <p className="text-gray-800">+91 9322322321</p>
            </div>

            <div className="flex items-center gap-4">
              <FaEnvelope className="text-blue-600" />
              <p className="text-gray-800">support@society.com</p>
            </div>
          </div>

          {/* System Status + Tips */}
          <div className="bg-green-100 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              System Status
            </h2>

            <p className="text-gray-700 flex items-center gap-2">
              🟢 All systems functional
            </p>

            <button
              onClick={() => setShowReportModal(true)}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <FaExclamationCircle /> Report an Issue
            </button>

            <h2 className="text-xl font-bold text-green-700 mt-6 mb-3">
              Tips & Tricks
            </h2>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Use the Directory to find residents quickly.</li>
              <li>Enable notifications to stay updated.</li>
              <li>Use Chat & Polls for community engagement.</li>
              <li>Keep your contact information updated.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-md w-96">
            <h3 className="text-xl font-bold mb-3">Report an Issue</h3>
            <textarea
              className="w-full p-3 border rounded mb-4"
              rows="4"
              placeholder="Describe the issue..."
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
            ></textarea>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  alert("Issue Submitted!");
                  setShowReportModal(false);
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Help;
