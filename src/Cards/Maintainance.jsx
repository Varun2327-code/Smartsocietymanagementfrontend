// src/pages/Maintainance.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudArrowUpIcon,
  CurrencyRupeeIcon,
  InboxIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  ReceiptPercentIcon
} from "@heroicons/react/24/outline";
import jsPDF from "jspdf";
import { db, auth } from "../firebase";
import {
  doc,
  updateDoc,
  addDoc,
  setDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const UPI_ID = "6367100290@superyes";

function formatCurrency(n) {
  return `₹${n?.toLocaleString?.() ?? n}`;
}

export default function Maintainance() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [qrFor, setQrFor] = useState(null);
  const [monthsToPay, setMonthsToPay] = useState(1);
  const [showBreakdown, setShowBreakdown] = useState(null);

  const billingBreakdown = {
    water: 400,
    security: 600,
    electricity: 300,
    elevator: 200,
    repairs: 500,
    sinkingFund: 500,
    other: 400
  };

  const baseAmount = Object.values(billingBreakdown).reduce((a, b) => a + b, 0);
  const gst = Math.round(baseAmount * 0.18);
  const totalMonthly = baseAmount + gst;

  const upiQRCodeUrl = (amount) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      `upi://pay?pa=${UPI_ID}&pn=SocietyMaintenance&am=${amount}`
    )}`;

  const defaultPaymentsFor = (uid) => ([
    { id: `mar2025_${uid}`, month: "Mar 2025", amount: 2900, status: "Paid", date: "Mar 5, 2025", userId: uid, breakdown: billingBreakdown },
    { id: `apr2025_${uid}`, month: "Apr 2025", amount: 2900, status: "Paid", date: "Apr 10, 2025", userId: uid, breakdown: billingBreakdown },
    { id: `may2025_${uid}`, month: "May 2025", amount: 2900, status: "Paid", date: "May 1, 2025", userId: uid, breakdown: billingBreakdown },
    { id: `jun2025_${uid}`, month: "Jun 2025", amount: 2900, status: "Unpaid", due: "Jun 10, 2025", userId: uid, breakdown: billingBreakdown },
  ]);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!auth.currentUser) return;
      setLoading(true);

      try {
        const q = query(collection(db, "payments"), where("userId", "==", auth.currentUser.uid));
        const snap = await getDocs(q);

        if (snap.empty) {
          const defaults = defaultPaymentsFor(auth.currentUser.uid);
          for (let p of defaults) {
            await setDoc(doc(db, "payments", p.id), p);
          }
          setPayments(defaults);
        } else {
          const docList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setPayments(docList.sort((a, b) => new Date(a.month) - new Date(b.month)));
        }
      } catch (err) {
        console.error("Error fetching payments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const totals = useMemo(() => {
    const totalRevenue = payments.reduce((s, b) => s + (Number(b.amount) || 0), 0);
    const collected = payments.filter(p => p.status === "Paid").reduce((s, b) => s + (Number(b.amount) || 0), 0);
    const pending = payments.filter(p => p.status !== "Paid").reduce((s, b) => s + (Number(b.amount) || 0), 0);
    const rate = totalRevenue ? Math.round((collected / totalRevenue) * 100) : 0;
    return { totalRevenue, collected, pending, rate };
  }, [payments]);

  const confirmPayment = async () => {
    if (!qrFor) return;
    const today = new Date().toLocaleDateString();
    setPayments(prev => prev.map(p => (p.id === qrFor.id ? { ...p, status: "Paid", date: today } : p)));
    setShowQR(false);

    try {
      await updateDoc(doc(db, "payments", qrFor.id), { status: "Paid", date: today, updatedAt: serverTimestamp() });
      generateReceipt({ ...qrFor, status: "Paid", date: today });
    } catch (err) {
      console.error("Payment confirmation failed:", err);
    }
  };

  const generateReceipt = (payment) => {
    const docPDF = new jsPDF();
    docPDF.setFillColor(63, 81, 181);
    docPDF.rect(0, 0, 210, 40, 'F');
    docPDF.setTextColor(255, 255, 255);
    docPDF.setFontSize(24);
    docPDF.setFont("helvetica", "bold");
    docPDF.text("MAINTENANCE RECEIPT", 105, 25, { align: "center" });

    docPDF.setTextColor(0, 0, 0);
    docPDF.setFontSize(10);
    docPDF.text(`Receipt No: RCT-${payment.id.substring(0, 8).toUpperCase()}`, 20, 50);
    docPDF.text(`Date: ${payment.date || new Date().toLocaleDateString()}`, 160, 50);

    docPDF.setDrawColor(200, 200, 200);
    docPDF.line(20, 55, 190, 55);

    docPDF.setFontSize(12);
    docPDF.text("Bill To:", 20, 65);
    docPDF.setFontSize(14);
    docPDF.text(auth.currentUser?.displayName || "Resident", 20, 75);
    docPDF.setFontSize(10);
    docPDF.text("Society: Grand Heights, Tower A-402", 20, 82);

    let y = 100;
    docPDF.setFillColor(245, 245, 245);
    docPDF.rect(20, y, 170, 10, 'F');
    docPDF.text("Description", 25, y + 7);
    docPDF.text("Amount (INR)", 160, y + 7);

    y += 20;
    const items = [
      ["Maintenance Charges", formatCurrency(baseAmount)],
      ["GST (18%)", formatCurrency(gst)],
      ["Late Fee/Penalty", formatCurrency(0)],
    ];

    items.forEach(item => {
      docPDF.text(item[0], 25, y);
      docPDF.text(item[1], 160, y);
      y += 10;
    });

    docPDF.line(20, y, 190, y);
    y += 10;
    docPDF.setFontSize(16);
    docPDF.text("Total Paid:", 25, y);
    docPDF.text(formatCurrency(payment.amount), 160, y);

    docPDF.setFontSize(8);
    docPDF.setTextColor(150, 150, 150);
    docPDF.text("This is a computer generated receipt and does not require a signature.", 105, 280, { align: "center" });

    docPDF.save(`Receipt_${payment.month}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Real-world Banner: Late Fees */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-3xl flex items-center gap-4"
        >
          <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-2xl text-amber-600">
            <ClockIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-amber-800 dark:text-amber-400">Punctuality Matters!</h4>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-500 opacity-80">Remember: A penalty of ₹10/day is applicable for payments made after the 10th of every month.</p>
          </div>
        </motion.div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white">
              Billing <span className="text-indigo-600">& Ledger</span>
            </h1>
            <p className="text-slate-500 font-medium">Transparent society accounts and maintenance tracking.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-black shadow-sm flex items-center gap-2">
              <DocumentArrowDownIcon className="w-5 h-5" /> EXPORT LEDGER
            </button>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-xl border border-slate-100 dark:border-slate-800"
          >
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
              <ReceiptPercentIcon className="w-8 h-8 text-indigo-500" /> Current Bill Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {Object.entries(billingBreakdown).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-lg font-black text-slate-700 dark:text-slate-200">{formatCurrency(val)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm font-black text-indigo-500 uppercase tracking-widest">Base Amount</span>
                <span className="text-lg font-black text-indigo-600">{formatCurrency(baseAmount)}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">GST (18%)</span>
                <span className="text-lg font-black text-slate-700 dark:text-slate-200">{formatCurrency(gst)}</span>
              </div>
            </div>

            <div className="mt-10 p-8 bg-slate-900 rounded-[2rem] text-white flex justify-between items-center">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Monthly Pay</p>
                <p className="text-4xl font-black">{formatCurrency(totalMonthly)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest leading-none mb-2">Next Due Date</p>
                <p className="text-xl font-black">10th {new Date().toLocaleString('default', { month: 'long' })}</p>
              </div>
            </div>
          </motion.div>

          {/* Advancement/Quick Pay */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden"
            >
              <h3 className="text-2xl font-black mb-4">Advance Pay</h3>
              <p className="text-indigo-100 text-sm mb-8 font-medium">Pay for multiple months in advance to avoid late fees.</p>

              <div className="space-y-6">
                <div className="flex gap-2">
                  {[1, 3, 6, 12].map(m => (
                    <button
                      key={m}
                      onClick={() => setMonthsToPay(m)}
                      className={`flex-1 py-3 rounded-2xl text-xs font-black transition ${monthsToPay === m ? 'bg-white text-indigo-600 shadow-xl' : 'bg-white/10 border border-white/20'}`}
                    >
                      {m}M
                    </button>
                  ))}
                </div>

                <div className="p-6 bg-white/10 rounded-[2rem] border border-white/20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black uppercase tracking-widest opacity-70">Months</span>
                    <span className="font-black">{monthsToPay}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest opacity-70">Total Due</span>
                    <span className="text-2xl font-black">{formatCurrency(totalMonthly * monthsToPay)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setQrFor({ id: 'ADVANCE', month: `${monthsToPay} Months Advance`, amount: totalMonthly * monthsToPay });
                    setShowQR(true);
                  }}
                  className="w-full py-5 bg-white text-indigo-700 rounded-[2rem] font-black shadow-lg hover:shadow-2xl transition"
                >
                  PAY SECURELY
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Payment History Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xl font-black underline decoration-indigo-500 decoration-4 underline-offset-8">Transaction Archive</h3>
            <span className="text-xs font-black text-slate-400 flex items-center gap-2">
              Showing last 12 months <ChevronRightIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-10 py-6">Billing Cycle</th>
                  <th className="px-10 py-6">Invoiced</th>
                  <th className="px-10 py-6">Status</th>
                  <th className="px-10 py-6">Payment Method</th>
                  <th className="px-10 py-6 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-10 py-8">
                      <p className="font-black text-slate-700 dark:text-slate-200">{p.month}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.id.substring(0, 8)}</p>
                    </td>
                    <td className="px-10 py-8 font-black text-slate-600 dark:text-slate-400">{formatCurrency(p.amount)}</td>
                    <td className="px-10 py-8">
                      <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${p.status === "Paid" ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-sm font-bold text-slate-500 italic">
                      {p.status === "Paid" ? "UPI • PhonePe" : "Awaiting Transaction"}
                    </td>
                    <td className="px-10 py-8 text-right">
                      {p.status === "Paid" ? (
                        <button
                          onClick={() => generateReceipt(p)}
                          className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          title="Download Invoice"
                        >
                          <CloudArrowUpIcon className="w-6 h-6" />
                        </button>
                      ) : (
                        <button className="text-red-500 font-black text-xs underline underline-offset-4 decoration-2">
                          PAY NOW
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && qrFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-950 rounded-[3rem] p-10 w-full max-w-md border border-slate-200 dark:border-slate-800 text-center relative shadow-2xl"
            >
              <button onClick={() => setShowQR(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition">
                <XMarkIcon className="w-8 h-8" />
              </button>

              <div className="mb-6 inline-block p-4 bg-indigo-50 rounded-[2rem]">
                <ReceiptPercentIcon className="w-12 h-12 text-indigo-600" />
              </div>

              <h2 className="text-3xl font-black mb-2 dark:text-white">Secure UPI</h2>
              <p className="text-slate-500 font-bold mb-8 uppercase tracking-widest text-[10px]">Grand Heights Residential Assoc.</p>

              <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[3rem] inline-block mb-8 border-2 border-dashed border-slate-200 dark:border-slate-800">
                <img src={upiQRCodeUrl(qrFor.amount)} alt="UPI QR" className="w-56 h-56 dark:invert" />
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex justify-between items-center px-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Amount</span>
                  <span className="text-2xl font-black text-indigo-600">{formatCurrency(qrFor.amount)}</span>
                </div>
                <div className="flex justify-between items-center px-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">VPA</span>
                  <span className="text-xs font-mono font-black border-b-2 border-indigo-200">{UPI_ID}</span>
                </div>
              </div>

              <button
                onClick={confirmPayment}
                className="w-full py-5 rounded-[2rem] bg-emerald-600 text-white font-black shadow-xl shadow-emerald-500/30 hover:bg-emerald-700 transition"
              >
                I HAVE PAID SUCCESSFULLY
              </button>

              <p className="mt-8 text-[10px] text-slate-400 font-bold leading-relaxed px-4">
                Note: Payment confirmation may take up to 24 hours to reflect if using a generic bank VPA. Society accounts are audited every weekend.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

