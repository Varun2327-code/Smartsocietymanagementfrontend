// src/pages/Maintainance.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudArrowUpIcon, CurrencyRupeeIcon, InboxIcon, ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";
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
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const UPI_ID = "6367100290@superyes"; // update if needed

function formatCurrency(n) {
  return `₹${n?.toLocaleString?.() ?? n}`;
}

function nextMonthLabelAndDueDate(latestMonthLabel) {
  // latestMonthLabel example: "Jun 2025" or "June 2025"
  const parseMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const m = latestMonthLabel?.split?.(" ")?.[0] ?? "";
  const year = Number(latestMonthLabel?.split?.(" ")?.[1]) || new Date().getFullYear();
  const monthIndex = Object.keys(parseMap).find(k => k.toLowerCase().startsWith((m||"").slice(0,3).toLowerCase()));
  const base = monthIndex ? parseMap[Object.keys(parseMap).find(k => k.toLowerCase().startsWith(m.slice(0,3).toLowerCase()))] : new Date().getMonth();
  const dt = new Date(year, base + 1, 1);
  const label = dt.toLocaleString("default", { month: "short" }) + " " + dt.getFullYear();
  // due date default: 10th of month
  const dueDate = new Date(dt.getFullYear(), dt.getMonth(), 10).toLocaleDateString();
  return { label, dueDate };
}

export default function Maintainance() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [qrFor, setQrFor] = useState(null);
  const [showAutoBanner, setShowAutoBanner] = useState(false);

  // UPI QR base generator
  const upiQRCodeUrl = (amount) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      `upi://pay?pa=${UPI_ID}&pn=SocietyMaintenance&am=${amount}`
    )}`;

  // default payments used if none exist (local)
  const defaultPaymentsFor = (uid) => ([
    { id: `mar2025_${uid}`, month: "Mar 2025", amount: 29000, status: "Paid", date: "Mar 5, 2025", userId: uid },
    { id: `apr2025_${uid}`, month: "Apr 2025", amount: 15000, status: "Paid", date: "Apr 10, 2025", userId: uid },
    { id: `may2025_${uid}`, month: "May 2025", amount: 13000, status: "Paid", date: "May 1, 2025", userId: uid },
    { id: `jun2025_${uid}`, month: "Jun 2025", amount: 12000, status: "Unpaid", due: "Jun 10, 2025", userId: uid },
  ]);

  // -------------------------
  // Fetch payments for user; create default if none
  // -------------------------
  useEffect(() => {
    const fetchPayments = async () => {
      if (!auth.currentUser) return;
      setLoading(true);

      try {
        const q = query(collection(db, "payments"), where("userId", "==", auth.currentUser.uid));
        const snap = await getDocs(q);

        if (snap.empty) {
          // create default docs in Firestore (first-time)
          const defaults = defaultPaymentsFor(auth.currentUser.uid);
          for (let p of defaults) {
            await setDoc(doc(db, "payments", p.id), p);
          }
          setPayments(defaults);
        } else {
          const docList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setPayments(docList);
        }
      } catch (err) {
        console.error("Error fetching payments:", err);
        // fallback: use local defaults (non-destructive)
        setPayments(defaultPaymentsFor(auth.currentUser?.uid ?? "local"));
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // -------------------------
  // Derived stats for cards + charts
  // -------------------------
  const totals = useMemo(() => {
    const totalRevenue = payments.reduce((s, b) => s + (Number(b.amount) || 0), 0);
    const collected = payments.filter(p => p.status === "Paid").reduce((s, b) => s + (Number(b.amount) || 0), 0);
    const pending = payments.filter(p => p.status !== "Paid").reduce((s, b) => s + (Number(b.amount) || 0), 0);
    const rate = totalRevenue ? Math.round((collected / totalRevenue) * 100) : 0;
    return { totalRevenue, collected, pending, rate };
  }, [payments]);

  const barData = useMemo(() => {
    const labels = payments.map(p => p.month);
    const data = payments.map(p => Number(p.amount) || 0);
    return {
      labels,
      datasets: [{ label: "Maintenance (₹)", data, backgroundColor: "rgba(59,130,246,0.9)" }],
    };
  }, [payments]);

  const pieData = useMemo(() => {
    const paid = payments.filter(p => p.status === "Paid").reduce((s, b) => s + (Number(b.amount) || 0), 0);
    const unpaid = payments.filter(p => p.status !== "Paid").reduce((s, b) => s + (Number(b.amount) || 0), 0);
    return { labels: ["Paid", "Pending"], datasets: [{ data: [paid, unpaid], backgroundColor: ["#10B981", "#F59E0B"] }] };
  }, [payments]);

  // -------------------------
  // Auto-generate next bill if all paid
  // -------------------------
  useEffect(() => {
    if (!payments.length) return;
    const unpaid = payments.some(p => p.status !== "Paid");
    if (!unpaid) {
      // create a next-month bill automatically after a short delay (non-intrusive)
      const timer = setTimeout(async () => {
        // Determine latest month label from last entry
        const last = payments[payments.length - 1];
        const candidate = nextMonthLabelAndDueDate(last?.month || new Date().toLocaleString("default", { month: "short" }) + " " + new Date().getFullYear());
        const newId = `${candidate.label.replace(" ", "")}_${auth.currentUser?.uid ?? "local"}`;
        // avoid duplicates
        if (payments.find(p => p.id === newId)) return;
        const newBill = {
          id: newId,
          month: candidate.label,
          amount: Math.round((totals.totalRevenue / Math.max(payments.length,1)) || 12000),
          status: "Unpaid",
          due: candidate.dueDate,
          userId: auth.currentUser?.uid ?? "local",
        };
        try {
          await setDoc(doc(db, "payments", newBill.id), newBill);
          setPayments(prev => [...prev, newBill]);
          setShowAutoBanner(true);
          setTimeout(() => setShowAutoBanner(false), 5000);
        } catch (err) {
          console.error("Auto-generate bill failed:", err);
        }
      }, 1400);

      return () => clearTimeout(timer);
    }
  }, [payments, totals.totalRevenue]);

  // Manual generate (button)
  const generateNextBillNow = async () => {
    const last = payments[payments.length - 1];
    const candidate = nextMonthLabelAndDueDate(last?.month || new Date().toLocaleString("default", { month: "short" }) + " " + new Date().getFullYear());
    const newId = `${candidate.label.replace(" ", "")}_${auth.currentUser?.uid ?? "local"}`;
    if (payments.find(p => p.id === newId)) {
      alert("Next bill already exists.");
      return;
    }
    const newBill = {
      id: newId,
      month: candidate.label,
      amount: Math.round((totals.totalRevenue / Math.max(payments.length,1)) || 12000),
      status: "Unpaid",
      due: candidate.dueDate,
      userId: auth.currentUser?.uid ?? "local",
    };
    try {
      await setDoc(doc(db, "payments", newBill.id), newBill);
      setPayments(prev => [...prev, newBill]);
      alert("Next bill generated: " + newBill.month);
    } catch (err) {
      console.error(err);
      alert("Failed to generate bill.");
    }
  };

  // -------------------------
  // Pay flow (open QR modal, then confirm)
  // -------------------------
  const openPayModalFor = (payment) => {
    setQrFor(payment);
    setShowQR(true);
  };

  const confirmPayment = async () => {
    if (!qrFor) return;
    const today = new Date().toLocaleDateString();
    // optimistic UI
    setPayments(prev => prev.map(p => (p.id === qrFor.id ? { ...p, status: "Paid", date: today } : p)));
    setShowQR(false);

    try {
      await updateDoc(doc(db, "payments", qrFor.id), { status: "Paid", date: today, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error("update payment failed:", err);
    }

    try {
      await addDoc(collection(db, "payment_history"), {
        userId: auth.currentUser?.uid ?? "local",
        month: qrFor.month,
        amount: qrFor.amount,
        status: "Paid",
        paymentDate: serverTimestamp(),
        method: "UPI",
      });
    } catch (err) {
      console.error("add history failed:", err);
    }

    // Generate receipt
    generateReceipt({ ...qrFor, status: "Paid", date: today });
    setQrFor(null);
  };

  // -------------------------
  // PDF receipt
  // -------------------------
  const generateReceipt = (payment) => {
    const docPDF = new jsPDF();
    docPDF.setFontSize(18);
    docPDF.text("Maintenance Payment Receipt", 20, 20);
    docPDF.setFontSize(12);
    docPDF.text(`Month: ${payment.month}`, 20, 40);
    docPDF.text(`Amount: ₹${payment.amount}`, 20, 50);
    docPDF.text(`Status: ${payment.status}`, 20, 60);
    docPDF.text(`Date: ${payment.date}`, 20, 70);
    docPDF.text("Thank you for your payment!", 20, 90);
    docPDF.save(`Receipt_${payment.month}.pdf`);
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <button onClick={() => (window.location.href = "/")} className="px-3 py-2 rounded-md bg-white shadow text-sm">← Back</button>
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-700">Maintenance Overview</h1>
          <div></div>
        </div>

        {/* metrics + actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/70 backdrop-blur border border-gray-100 shadow">
              <div className="text-sm text-gray-500">Total Revenue</div>
              <div className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(totals.totalRevenue)}</div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-green-50 to-green-100 border border-green-100 shadow">
              <div className="text-sm text-green-700">Collected</div>
              <div className="mt-2 text-xl font-bold text-green-800">{formatCurrency(totals.collected)}</div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-100 shadow">
              <div className="text-sm text-yellow-700">Pending</div>
              <div className="mt-2 text-xl font-bold text-yellow-800">{formatCurrency(totals.pending)}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 border border-gray-100 shadow flex flex-col justify-between">
            <div>
              <div className="text-sm text-gray-500">Collection Rate</div>
              <div className="mt-2 text-2xl font-bold text-blue-700">{totals.rate}%</div>
              <div className="text-xs text-gray-400 mt-1">Auto next bill: {payments.length ? payments[payments.length-1].month : "--"}</div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => generateNextBillNow()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg">Generate Next Bill</button>
              <button onClick={() => { if (payments.length) openPayModalFor(payments.find(p => p.status !== "Paid")); }} className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">Pay</button>
            </div>
          </div>
        </div>

        {/* charts + pay/upload */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-4 rounded-xl bg-white/80 border border-gray-100 shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Monthly Trend</h3>
              <div className="text-xs text-gray-500">Last {payments.length} months</div>
            </div>
            <div className="h-56">
              <Bar data={barData} options={{ maintainAspectRatio:false }} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/80 border border-gray-100 shadow flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Collection Breakdown</h3>
              <div className="h-40"><Pie data={pieData} options={{ maintainAspectRatio:false }} /></div>
            </div>

            <div className="p-3 rounded-lg bg-white shadow-sm border">
              <div className="text-sm text-gray-600">Upload Receipt (optional)</div>
              <label className="mt-2 flex items-center gap-3 cursor-pointer border border-dashed p-3 rounded-md hover:bg-blue-50">
                <CloudArrowUpIcon className="h-6 w-6 text-blue-500" />
                <div>
                  <div className="text-sm text-blue-700">Click to upload</div>
                  <div className="text-xs text-gray-400">Images accepted (.jpg, .png)</div>
                </div>
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* payments table */}
        <div className="bg-white/90 rounded-xl p-4 border border-gray-100 shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Payment History</h3>
            <div className="text-sm text-gray-500">{payments.length} records</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 border-b">
                <tr>
                  <th className="py-2 text-left">Month</th>
                  <th className="text-left">Amount</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Date / Due</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium">{p.month}</td>
                    <td>{formatCurrency(p.amount)}</td>
                    <td className={p.status === "Paid" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{p.status}</td>
                    <td>{p.date || p.due || "--"}</td>
                    <td className="space-x-2">
                      {p.status !== "Paid" ? (
                        <button onClick={() => openPayModalFor(p)} className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs">Pay</button>
                      ) : (
                        <button onClick={() => generateReceipt(p)} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-xs">Receipt</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* fine + contact */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
            <div className="flex gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              <div>
                <div className="font-semibold text-red-700">Fine Notice</div>
                <div className="text-sm text-red-600">A late fine of ₹500 will be applied for unpaid maintenance after due date.</div>
              </div>
            </div>
          </div>

          <div className="bg-white/90 p-4 rounded-xl border shadow text-center">
            <InboxIcon className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
            <div className="font-medium">Need help or clarification?</div>
            <div className="mt-3">
              <a href="mailto:varun@gmail.com" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">Contact Office</a>
            </div>
          </div>
        </div>
      </div>

      {/* Auto banner */}
      <AnimatePresence>
        {showAutoBanner && (
          <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} className="fixed right-6 top-6 bg-green-600 text-white px-4 py-2 rounded shadow">
            New bill generated automatically
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && qrFor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => { setShowQR(false); setQrFor(null); }} />
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md z-10">
              <button onClick={() => { setShowQR(false); setQrFor(null); }} className="absolute right-3 top-3 p-1 rounded hover:bg-gray-100"><XMarkIcon className="w-5 h-5" /></button>
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">Pay {qrFor.month}</div>
                <div className="text-sm text-gray-500 mb-4">Amount: {formatCurrency(qrFor.amount)}</div>
                <img src={upiQRCodeUrl(qrFor.amount)} alt="upi" className="mx-auto w-40 h-40 mb-4" />
                <div className="text-xs text-gray-400 mb-4">UPI ID: {UPI_ID}</div>
                <div className="flex gap-2 justify-center">
                  <button onClick={confirmPayment} className="bg-green-600 text-white px-4 py-2 rounded-lg">I have paid</button>
                  <button onClick={() => { setShowQR(false); setQrFor(null); }} className="bg-gray-100 px-4 py-2 rounded-lg">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
