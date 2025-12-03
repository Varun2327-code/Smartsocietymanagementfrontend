import React, { useEffect, useMemo, useState } from "react";
import {
  FiChevronLeft,
  FiDownload,
  FiSearch,
  FiSun,
  FiMoon,
  FiPlus,
  FiPrinter,
  FiFilter,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiFileText,
} from "react-icons/fi";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const mockBills = [
  {
    id: 1,
    month: "January 2024",
    amount: 2500,
    dueDate: "2024-01-31",
    status: "paid",
    paidDate: "2024-01-15",
    units: [
      { unit: "A-101", amount: 2500, paid: true },
      { unit: "B-202", amount: 2500, paid: true },
    ],
    notes: "Monthly maintenance",
    receiptUrl: null,
  },
  {
    id: 2,
    month: "February 2024",
    amount: 2400,
    dueDate: "2024-02-28",
    status: "pending",
    paidDate: null,
    units: [
      { unit: "A-101", amount: 2400, paid: false },
      { unit: "B-202", amount: 2400, paid: false },
    ],
    notes: "Short month adjustment",
    receiptUrl: null,
  },
  {
    id: 3,
    month: "March 2024",
    amount: 2300,
    dueDate: "2024-03-31",
    status: "overdue",
    paidDate: null,
    units: [
      { unit: "A-101", amount: 2300, paid: false },
      { unit: "B-202", amount: 2300, paid: false },
      { unit: "C-303", amount: 2300, paid: false },
    ],
    notes: "Late payment notice sent",
    receiptUrl: null,
  },
];

const mockPayments = [
  { id: 1, unit: "A-101", amount: 2500, month: "January 2024", paymentDate: "2024-01-15", paymentMethod: "Online Transfer" },
  { id: 2, unit: "B-202", amount: 2500, month: "January 2024", paymentDate: "2024-01-16", paymentMethod: "UPI" },
];

const STATUS_COLORS = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
};

const Maintenance = () => {
  // UI state
  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState("billing");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [bills, setBills] = useState(mockBills); // replace with API data
  const [payments, setPayments] = useState(mockPayments); // replace with API data
  const [expandedRows, setExpandedRows] = useState({});
  const [filters, setFilters] = useState({ month: "all", status: "all", q: "" });

  // Derived stats
  const totals = useMemo(() => {
    const totalRevenue = bills.reduce((s, b) => s + (b.amount || 0), 0);
    const collected = bills.filter(b => b.status === "paid").reduce((s, b) => s + (b.amount || 0), 0);
    const pending = bills.filter(b => b.status === "pending").reduce((s, b) => s + (b.amount || 0), 0);
    const overdue = bills.filter(b => b.status === "overdue").reduce((s, b) => s + (b.amount || 0), 0);
    const collectionRate = totalRevenue === 0 ? 0 : Math.round((collected / totalRevenue) * 100);
    return { totalRevenue, collected, pending, overdue, collectionRate };
  }, [bills]);

  // Chart data (last 6 months — derived here from bills; replace with actual monthly series)
  const barData = useMemo(() => {
    // For demo generate labels & amounts from bills array
    const labels = bills.map(b => b.month);
    const data = bills.map(b => b.amount);
    return {
      labels,
      datasets: [
        {
          label: "Collected per month",
          data,
          backgroundColor: "rgba(59,130,246,0.8)", // blue-500
        },
      ],
    };
  }, [bills]);

  const pieData = useMemo(() => {
    return {
      labels: ["Collected", "Pending", "Overdue"],
      datasets: [
        {
          data: [totals.collected, totals.pending, totals.overdue],
          backgroundColor: ["#34D399", "#FBBF24", "#F87171"],
        },
      ],
    };
  }, [totals]);

  useEffect(() => {
    // apply dark class to body
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  // Filtered lists
  const filteredBills = useMemo(() => {
    const { month, status, q } = filters;
    return bills.filter(b => {
      if (month !== "all" && b.month.toLowerCase() !== month.toLowerCase()) return false;
      if (status !== "all" && b.status !== status) return false;
      if (q && !(`${b.month} ${b.notes} ${b.units.map(u => u.unit).join(" ")}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [bills, filters]);

  // Toggle expand
  const toggleExpand = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Actions
  const markAsPaid = (billId) => {
    // Replace with API call to update status
    setBills(prev => prev.map(b => (b.id === billId ? { ...b, status: "paid", paidDate: new Date().toISOString().slice(0,10) } : b)));
  };

  const sendReminder = (billId) => {
    // Replace with actual notification logic
    alert("Reminder sent to units for bill id: " + billId);
  };

  // Export helpers
  const exportCSV = (rows, filename = "bills.csv") => {
    const headers = ["Month", "Amount", "Due Date", "Status", "Paid Date", "Units", "Notes"];
    const csvRows = [headers.join(",")];
    rows.forEach(r => {
      const units = r.units.map(u => u.unit).join("|");
      const line = [r.month, r.amount, r.dueDate, r.status, r.paidDate || "", `"${units}"`, `"${r.notes || ""}"`];
      csvRows.push(line.join(","));
    });
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const printAsPDF = async (selector = "#maintenance-root", filename = "maintenance.pdf") => {
    const element = document.querySelector(selector);
    if (!element) {
      window.print();
      return;
    }
    // Use html2canvas + jsPDF
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  };

  // Placeholder generate bill handler
  const handleGenerateBill = (formData) => {
    // Replace with API call to create bills for selected units
    const newBill = {
      id: Date.now(),
      month: formData.month,
      amount: Number(formData.amountPerUnit || 0),
      dueDate: formData.dueDate,
      status: "pending",
      paidDate: null,
      units: formData.units || [{ unit: "A-101", amount: Number(formData.amountPerUnit || 0), paid: false }],
      notes: formData.notes,
    };
    setBills(prev => [newBill, ...prev]);
    setShowGenerateModal(false);
  };

  return (
    <div id="maintenance-root" className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
            <FiChevronLeft />
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">Maintenance Overview</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-md overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
            <input
              type="text"
              placeholder="Search month, unit, notes..."
              className="px-3 py-2 outline-none w-64 text-sm bg-transparent text-gray-700 dark:text-gray-200"
              value={filters.q}
              onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
            />
            <button className="px-3"><FiSearch /></button>
          </div>

          <button
            onClick={() => setDark(d => !d)}
            className="p-2 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200"
            title="Toggle theme"
          >
            {dark ? <FiSun /> : <FiMoon />}
          </button>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            <FiPlus /> Generate Bill
          </button>

          <div className="flex items-center gap-2">
            <button onClick={() => exportCSV(bills)} title="Export CSV" className="p-2 rounded-md bg-white dark:bg-gray-800">
              <FiDownload />
            </button>
            <button onClick={() => printAsPDF()} title="Print / Save as PDF" className="p-2 rounded-md bg-white dark:bg-gray-800">
              <FiPrinter />
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards + charts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="col-span-1 p-4 rounded-xl bg-gradient-to-r from-white to-indigo-50 dark:from-gray-800 dark:to-slate-800 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-100">
              <FiTrendingUp />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-300">Total Revenue</div>
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">₹{totals.totalRevenue}</div>
            </div>
          </div>
        </div>

        <div className="col-span-1 p-4 rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <FiCheckCircle />
            </div>
            <div>
              <div className="text-sm text-green-600">Collected</div>
              <div className="text-xl font-semibold text-green-700">₹{totals.collected}</div>
            </div>
          </div>
        </div>

        <div className="col-span-1 p-4 rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
              <FiClock />
            </div>
            <div>
              <div className="text-sm text-yellow-600">Pending</div>
              <div className="text-xl font-semibold text-yellow-700">₹{totals.pending}</div>
            </div>
          </div>
        </div>

        <div className="col-span-1 p-4 rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <FiFileText />
            </div>
            <div>
              <div className="text-sm text-blue-600">Collection Rate</div>
              <div className="text-xl font-semibold text-blue-700">{totals.collectionRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts + Filters area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 p-4 rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Monthly Trend</h3>
            <div className="text-xs text-gray-500 dark:text-gray-300">Last {bills.length} months</div>
          </div>
          <div className="h-48">
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Collection Breakdown</h3>
          <div className="h-40">
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-300">
            <div>Collected: ₹{totals.collected}</div>
            <div>Pending: ₹{totals.pending}</div>
            <div>Overdue: ₹{totals.overdue}</div>
          </div>
        </div>
      </div>

      {/* Tabs (Billing / Payments) */}
      <div className="mb-4">
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("billing")}
            className={`py-2 px-4 ${activeTab === "billing" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 dark:text-gray-300"}`}
          >
            Billing
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`py-2 px-4 ${activeTab === "payments" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 dark:text-gray-300"}`}
          >
            Payment History
          </button>

          {/* Filters */}
          <div className="ml-auto flex items-center gap-2">
            <select className="px-3 py-1 rounded-md border" value={filters.month} onChange={e => setFilters(prev => ({ ...prev, month: e.target.value }))}>
              <option value="all">All months</option>
              {bills.map(b => <option key={b.id} value={b.month}>{b.month}</option>)}
            </select>

            <select className="px-3 py-1 rounded-md border" value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}>
              <option value="all">All status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>

            <button className="px-3 py-1 rounded-md bg-gray-50 dark:bg-gray-800" title="More filters">
              <FiFilter />
            </button>
          </div>
        </div>
      </div>

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800">
              <div className="font-semibold text-slate-800 dark:text-slate-100">Maintenance Bills</div>
              <div className="flex items-center gap-2">
                <button onClick={() => exportCSV(filteredBills, "maintenance_bills.csv")} className="px-3 py-1 rounded bg-indigo-600 text-white">Export CSV</button>
                <button onClick={() => printAsPDF()} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">Print</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Paid Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredBills.map(bill => {
                    const overdueFlag = bill.status === "pending" && new Date(bill.dueDate) < new Date();
                    return (
                      <React.Fragment key={bill.id}>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{bill.month}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">₹{bill.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{bill.dueDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs rounded-full ${overdueFlag ? STATUS_COLORS.overdue : (STATUS_COLORS[bill.status] || "bg-gray-100 text-gray-800")}`}>
                              {overdueFlag ? "Overdue" : bill.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{bill.paidDate || "-"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <button onClick={() => toggleExpand(bill.id)} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm">Details</button>
                              <button onClick={() => markAsPaid(bill.id)} className="px-2 py-1 rounded bg-green-600 text-white text-sm">Mark Paid</button>
                              <button onClick={() => sendReminder(bill.id)} className="px-2 py-1 rounded bg-yellow-500 text-white text-sm">Reminder</button>
                            </div>
                          </td>
                        </tr>

                        {expandedRows[bill.id] && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Units</div>
                                  <ul className="mt-2">
                                    {bill.units.map((u, idx) => (
                                      <li key={idx} className="text-sm text-gray-600 dark:text-gray-300">• {u.unit} — ₹{u.amount} — {u.paid ? "Paid" : "Unpaid"}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Notes</div>
                                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{bill.notes || "-"}</div>

                                  <div className="mt-4 flex items-center gap-2">
                                    <button className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">View Invoice</button>
                                    <button className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm" onClick={() => alert("Download receipt (replace with real URL)")}>Download Receipt</button>
                                  </div>
                                </div>

                                <div>
                                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Timeline</div>
                                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                    <div>• Bill generated: {bill.dueDate}</div>
                                    <div>• Reminder sent: {bill.status === "overdue" ? "Yes" : "—"}</div>
                                    <div>• Paid date: {bill.paidDate || "—"}</div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {filteredBills.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">No bills found for selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment History tab */}
      {activeTab === "payments" && (
        <div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Payment History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Method</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{p.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">₹{p.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{p.month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{p.paymentDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{p.paymentMethod}</td>
                    </tr>
                  ))}

                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">No payments recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Generate Bill Modal */}
      {showGenerateModal && (
        <GenerateBillModal
          onClose={() => setShowGenerateModal(false)}
          onSubmit={handleGenerateBill}
        />
      )}
    </div>
  );
};

/* ----------------------------
   Generate Bill Modal Component
   ---------------------------- */
function GenerateBillModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    month: "",
    amountPerUnit: "",
    dueDate: "",
    notes: "",
    units: [{ unit: "A-101" }, { unit: "B-202" }],
  });

  const addUnit = () => setForm(prev => ({ ...prev, units: [...prev.units, { unit: "" }] }));
  const updateUnit = (idx, value) => setForm(prev => {
    const units = [...prev.units]; units[idx].unit = value; return { ...prev, units };
  });
  const removeUnit = (idx) => setForm(prev => ({ ...prev, units: prev.units.filter((_, i) => i !== idx) }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <form onSubmit={submit} className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl relative z-10 p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Generate Maintenance Bill</h3>
          <button type="button" onClick={onClose} className="text-gray-500 dark:text-gray-300">Close</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input required value={form.month} onChange={e => setForm(prev => ({ ...prev, month: e.target.value }))} placeholder="Month (e.g. April 2024)" className="px-3 py-2 border rounded-md bg-transparent" />
          <input required type="number" value={form.amountPerUnit} onChange={e => setForm(prev => ({ ...prev, amountPerUnit: e.target.value }))} placeholder="Amount per unit (₹)" className="px-3 py-2 border rounded-md bg-transparent" />
          <input required type="date" value={form.dueDate} onChange={e => setForm(prev => ({ ...prev, dueDate: e.target.value }))} className="px-3 py-2 border rounded-md bg-transparent" />
          <input value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notes (optional)" className="px-3 py-2 border rounded-md bg-transparent" />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-gray-700 dark:text-gray-200">Units</div>
            <button type="button" onClick={addUnit} className="text-sm px-2 py-1 bg-indigo-600 text-white rounded">Add Unit</button>
          </div>

          <div className="space-y-2">
            {form.units.map((u, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input required value={u.unit} onChange={e => updateUnit(idx, e.target.value)} placeholder="Unit code (e.g. A-101)" className="flex-1 px-3 py-2 border rounded-md bg-transparent" />
                <button type="button" onClick={() => removeUnit(idx)} className="px-2 py-1 rounded bg-red-500 text-white">Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white">Generate</button>
        </div>
      </form>
    </div>
  );
}

export default Maintenance;
