import { useCallback, useEffect, useState } from "react";
import {
    Search,
    RefreshCw,
    Download,
    FileText,
    CheckCircle2,
    Ban,
    Clock,
    Plus,
    Eye,
    CreditCard,
    Filter,
    X,
    AlertTriangle,
    Layers,
    Check
} from "lucide-react";
import {
    getInvoices,
    getOverdueInvoices,
    createInvoice,
    issueInvoice,
    payInvoice,
    voidInvoice,
    bulkGenerateInvoices,
    exportInvoicesCSV,
    getSubscriptions,
    createCreditNote
} from "../services/api";
import useAuth from "../context/useAuth";
import {
    formatCurrency,
    formatAmount,
    formatDate,
    formatDateTime,
    formatDateForInput,
    calculateDaysOverdue,
    parseAmount
} from "../utils/formatters";

function Invoices() {
    const { user, isBillingAdmin, refreshOverdueCount } = useAuth();

    // Invoices state
    const [invoices, setInvoices] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        totalInvoices: 0,
        totalPages: 1
    });

    // Server-side filter states
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isOverdueFilter, setIsOverdueFilter] = useState(false);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Active subscriptions list for creating an invoice
    const [activeSubscriptions, setActiveSubscriptions] = useState([]);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showBulkResultModal, setShowBulkResultModal] = useState(false);
    const [bulkResult, setBulkResult] = useState(null);
    const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
    const [creditNoteTargetInvoice, setCreditNoteTargetInvoice] = useState(null);

    // Create Invoice form
    const [createFormData, setCreateFormData] = useState({
        subscriptionId: "",
        invoiceNumber: "",
        dueDate: ""
    });

    // Credit Note form
    const [creditNoteForm, setCreditNoteForm] = useState({
        creditNoteNumber: "",
        amount: "",
        reason: "Customer requested discount / partial refund"
    });
    const [creditNoteError, setCreditNoteError] = useState("");

    // Local notes / timeline registry for immutable timeline display
    const [invoiceNotes, setInvoiceNotes] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("invoice_timeline_events") || "{}");
        } catch {
            return {};
        }
    });

    const addTimelineEvent = (invoiceId, event) => {
        const updated = {
            ...invoiceNotes,
            [invoiceId]: [...(invoiceNotes[invoiceId] || []), event]
        };
        setInvoiceNotes(updated);
        localStorage.setItem("invoice_timeline_events", JSON.stringify(updated));
    };

    // =========================================================================
    // Server-side Data Fetching (Never client-filter whole dataset)
    // =========================================================================
    const loadInvoices = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            // If Overdue filter is actively selected, query the dedicated overdue server API
            if (isOverdueFilter) {
                const overdueData = await getOverdueInvoices();
                const overdueList = overdueData.overdueInvoices || [];
                setInvoices(overdueList);
                setPagination({
                    currentPage: 1,
                    perPage: overdueList.length || 10,
                    totalInvoices: overdueList.length,
                    totalPages: 1
                });
                return;
            }

            const params = new URLSearchParams();
            if (search.trim()) {
                params.append("search", search.trim());
            }
            if (statusFilter) {
                params.append("status", statusFilter);
            }
            if (fromDate) {
                params.append("fromDate", fromDate);
            }
            if (toDate) {
                params.append("toDate", toDate);
            }

            params.append("page", page);
            params.append("limit", limit);

            const data = await getInvoices(params.toString());
            setInvoices(data.invoices || []);

            if (data.pagination) {
                setPagination({
                    currentPage: data.pagination.currentPage || 1,
                    perPage: data.pagination.perPage || limit,
                    totalInvoices: data.pagination.totalInvoices || 0,
                    totalPages: data.pagination.totalPages || 1
                });
            }
        } catch (err) {
            console.error("Failed to load invoices:", err);
            setError(err.message || "Failed to fetch invoices");
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, isOverdueFilter, fromDate, toDate, page, limit]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadInvoices();
        }, 250);
        return () => clearTimeout(timer);
    }, [loadInvoices]);

    // Load active subscriptions for create invoice dropdown
    const loadSubscriptionsForInvoice = async () => {
        try {
            const data = await getSubscriptions();
            const list = (data.subscriptions || []).filter((s) => s.status === "Active");
            setActiveSubscriptions(list);
        } catch (err) {
            console.error("Failed to fetch subscriptions for invoice:", err);
        }
    };

    // =========================================================================
    // Handlers
    // =========================================================================

    const handleOpenCreateInvoice = async () => {
        await loadSubscriptionsForInvoice();
        const randId = Math.floor(1000 + Math.random() * 9000);
        const autoInvNum = `INV-${new Date().getFullYear()}-${randId}`;
        const due = new Date();
        due.setDate(due.getDate() + 15);

        setCreateFormData({
            subscriptionId: "",
            invoiceNumber: autoInvNum,
            dueDate: formatDateForInput(due)
        });
        setShowCreateModal(true);
    };

    const handleCreateInvoiceSubmit = async (e) => {
        e.preventDefault();
        if (!createFormData.subscriptionId) {
            alert("Please select a subscription.");
            return;
        }

        try {
            setActionLoading(true);
            const res = await createInvoice(createFormData);
            setSuccessMessage(`Invoice ${createFormData.invoiceNumber} created as Draft.`);
            setShowCreateModal(false);

            if (res.invoice?._id) {
                addTimelineEvent(res.invoice._id, {
                    type: "Created",
                    message: `Draft invoice manually generated for subscription`,
                    timestamp: new Date().toISOString(),
                    actor: user?.name || "User"
                });
            }

            await loadInvoices();
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            alert(err.message || "Failed to create invoice");
        } finally {
            setActionLoading(false);
        }
    };

    // Issue Invoice (Draft -> Issued)
    const handleIssue = async (invoice) => {
        if (!isBillingAdmin) {
            alert("Only Billing Admin can issue invoices.");
            return;
        }

        try {
            setActionLoading(true);
            await issueInvoice(invoice._id);
            setSuccessMessage(`Invoice ${invoice.invoiceNumber} has been issued.`);

            addTimelineEvent(invoice._id, {
                type: "Issued",
                message: "Invoice state updated from Draft to Issued",
                timestamp: new Date().toISOString(),
                actor: user?.name || "Billing Admin"
            });

            await loadInvoices();
            refreshOverdueCount();
            if (selectedInvoice && selectedInvoice._id === invoice._id) {
                setSelectedInvoice({ ...selectedInvoice, status: "Issued" });
            }
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            alert(err.message || "Failed to issue invoice");
        } finally {
            setActionLoading(false);
        }
    };

    // Pay Invoice (Issued -> Paid)
    const handlePay = async (invoice) => {
        if (!isBillingAdmin) {
            alert("Only Billing Admin can record payments.");
            return;
        }

        try {
            setActionLoading(true);
            await payInvoice(invoice._id);
            setSuccessMessage(`Payment recorded for invoice ${invoice.invoiceNumber}.`);

            addTimelineEvent(invoice._id, {
                type: "Paid",
                message: `Payment received in full (${formatCurrency(invoice.amount, invoice.currency)})`,
                timestamp: new Date().toISOString(),
                actor: user?.name || "Billing Admin"
            });

            await loadInvoices();
            refreshOverdueCount();
            if (selectedInvoice && selectedInvoice._id === invoice._id) {
                setSelectedInvoice({ ...selectedInvoice, status: "Paid", paidAt: new Date().toISOString() });
            }
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            alert(err.message || "Failed to record payment");
        } finally {
            setActionLoading(false);
        }
    };

    // Void Invoice (Draft / Issued -> Void)
    const handleVoid = async (invoice) => {
        if (!isBillingAdmin) {
            alert("Only Billing Admin can void invoices.");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to void invoice ${invoice.invoiceNumber}? This action is irreversible.`
        );
        if (!confirmed) return;

        try {
            setActionLoading(true);
            await voidInvoice(invoice._id);
            setSuccessMessage(`Invoice ${invoice.invoiceNumber} has been marked Void.`);

            addTimelineEvent(invoice._id, {
                type: "Voided",
                message: "Invoice was cancelled and marked as Void",
                timestamp: new Date().toISOString(),
                actor: user?.name || "Billing Admin"
            });

            await loadInvoices();
            refreshOverdueCount();
            if (selectedInvoice && selectedInvoice._id === invoice._id) {
                setSelectedInvoice({ ...selectedInvoice, status: "Void", voidedAt: new Date().toISOString() });
            }
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            alert(err.message || "Failed to void invoice");
        } finally {
            setActionLoading(false);
        }
    };

    // Bulk Invoice Generation (Billing Admin only) - Goal 7
    const handleBulkGenerate = async () => {
        if (!isBillingAdmin) {
            alert("Only Billing Admin can run bulk invoice generation.");
            return;
        }

        try {
            setActionLoading(true);
            const data = await bulkGenerateInvoices();
            setBulkResult(data);
            setShowBulkResultModal(true);
            await loadInvoices();
            refreshOverdueCount();
        } catch (err) {
            alert(err.message || "Bulk invoice generation failed");
        } finally {
            setActionLoading(false);
        }
    };

    // CSV Exports (Goal 7)
    const handleExportCSV = async (onlyReceivables = false) => {
        try {
            const params = new URLSearchParams();
            if (onlyReceivables) {
                params.append("status", "Issued");
            } else {
                if (search.trim()) params.append("search", search.trim());
                if (statusFilter) params.append("status", statusFilter);
                if (fromDate) params.append("fromDate", fromDate);
                if (toDate) params.append("toDate", toDate);
            }

            await exportInvoicesCSV(params.toString());
            setSuccessMessage(`CSV export downloaded successfully.`);
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            alert(err.message || "Failed to export CSV");
        }
    };

    // Credit Note Modal Handlers
    const handleOpenCreditNote = (invoice) => {
        if (invoice.status !== "Paid") {
            alert("Credit notes can only be issued against Paid invoices.");
            return;
        }
        setCreditNoteTargetInvoice(invoice);
        const randId = Math.floor(1000 + Math.random() * 9000);
        setCreditNoteForm({
            creditNoteNumber: `CN-${new Date().getFullYear()}-${randId}`,
            amount: formatAmount(invoice.amount),
            reason: "Customer concession / billing adjustment"
        });
        setCreditNoteError("");
        setShowCreditNoteModal(true);
    };

    const handleSubmitCreditNote = async (e) => {
        e.preventDefault();
        setCreditNoteError("");

        try {
            setActionLoading(true);
            await createCreditNote({
                invoiceId: creditNoteTargetInvoice._id,
                creditNoteNumber: creditNoteForm.creditNoteNumber.trim(),
                amount: creditNoteForm.amount.trim(),
                reason: creditNoteForm.reason.trim()
            });

            addTimelineEvent(creditNoteTargetInvoice._id, {
                type: "Credit Note",
                message: `Credit note ${creditNoteForm.creditNoteNumber} issued for ${creditNoteTargetInvoice.currency || "INR"} ${creditNoteForm.amount}: ${creditNoteForm.reason}`,
                timestamp: new Date().toISOString(),
                actor: user?.name || "Billing Admin"
            });

            setSuccessMessage(`Credit Note ${creditNoteForm.creditNoteNumber} issued successfully!`);
            setShowCreditNoteModal(false);
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            setCreditNoteError(err.message || "Failed to create credit note");
        } finally {
            setActionLoading(false);
        }
    };

    // View Invoice Details
    const handleViewDetails = (invoice) => {
        setSelectedInvoice(invoice);
        setShowDetailsModal(true);
    };

    // Render Status Badges
    const renderStatusBadge = (invoice) => {
        const isOverdue =
            invoice.status === "Issued" &&
            invoice.dueDate &&
            new Date(invoice.dueDate) < new Date();

        if (isOverdue) {
            const days = calculateDaysOverdue(invoice.dueDate);
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                    <Clock size={12} />
                    <span>Overdue ({days}d)</span>
                </span>
            );
        }

        switch (invoice.status) {
            case "Draft":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <FileText size={12} />
                        <span>Draft</span>
                    </span>
                );
            case "Issued":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                        <Clock size={12} />
                        <span>Issued</span>
                    </span>
                );
            case "Paid":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} />
                        <span>Paid</span>
                    </span>
                );
            case "Void":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                        <Ban size={12} />
                        <span>Void</span>
                    </span>
                );
            default:
                return <span>{invoice.status}</span>;
        }
    };

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        <span>Billing Control Registry</span>
                        <span>•</span>
                        <span className="text-blue-600 font-semibold">{user?.role}</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                        Invoices & Receivables
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Full invoice lifecycle: Draft, Issue, Pay, Void, Bulk Generation & Receivables Export
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Refresh */}
                    <button
                        onClick={loadInvoices}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
                        title="Refresh invoice records"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin text-blue-600" : ""} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>

                    {/* Receivables Export CSV (Goal 7) */}
                    <button
                        onClick={() => handleExportCSV(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold shadow-sm transition"
                        title="Export outstanding issued receivables to CSV"
                    >
                        <Download size={14} />
                        <span>Export Receivables</span>
                    </button>

                    {/* Full CSV Export */}
                    <button
                        onClick={() => handleExportCSV(false)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
                        title="Export filtered records to CSV"
                    >
                        <Download size={14} />
                        <span className="hidden md:inline">CSV Export</span>
                    </button>

                    {/* Bulk Generation (Billing Admin only - Goal 7) */}
                    {isBillingAdmin && (
                        <button
                            onClick={handleBulkGenerate}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition"
                        >
                            <Layers size={14} />
                            <span>Bulk Generate</span>
                        </button>
                    )}

                    {/* Create Invoice (Goal 3) */}
                    <button
                        onClick={handleOpenCreateInvoice}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
                    >
                        <Plus size={15} />
                        <span>Create Invoice</span>
                    </button>
                </div>
            </div>

            {/* Notification messages */}
            {successMessage && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-800 text-sm shadow-sm">
                    <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-red-700 text-sm">
                    <AlertTriangle size={18} className="flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Filters Toolbar (Server-Side: search, status, overdue, dates) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    {/* Search query */}
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by invoice number, customer name, or email..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>

                    {/* Status Pill Filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                        {[
                            { label: "All", value: "" },
                            { label: "Draft", value: "Draft" },
                            { label: "Issued", value: "Issued" },
                            { label: "Paid", value: "Paid" },
                            { label: "Void", value: "Void" }
                        ].map((st) => (
                            <button
                                key={st.label}
                                onClick={() => {
                                    setStatusFilter(st.value);
                                    setIsOverdueFilter(false);
                                    setPage(1);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                    !isOverdueFilter && statusFilter === st.value
                                        ? "bg-slate-900 text-white shadow-sm"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {st.label}
                            </button>
                        ))}

                        {/* Dedicated Overdue Filter (Goal 6) */}
                        <button
                            onClick={() => {
                                setIsOverdueFilter(!isOverdueFilter);
                                setStatusFilter("");
                                setPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                                isOverdueFilter
                                    ? "bg-red-600 text-white shadow-sm"
                                    : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                            }`}
                        >
                            <Clock size={12} />
                            <span>Overdue Only</span>
                        </button>
                    </div>
                </div>

                {/* Date range filters */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Filter size={12} />
                        Date Range:
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400">From</span>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value);
                                setPage(1);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400">To</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value);
                                setPage(1);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                        />
                    </div>

                    {(fromDate || toDate || search || statusFilter || isOverdueFilter) && (
                        <button
                            onClick={() => {
                                setSearch("");
                                setStatusFilter("");
                                setIsOverdueFilter(false);
                                setFromDate("");
                                setToDate("");
                                setPage(1);
                            }}
                            className="text-blue-600 hover:text-blue-700 font-bold ml-auto"
                        >
                            Clear All Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Invoices Table */}
            {loading ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
                    <RefreshCw size={28} className="animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Loading server invoice records...</p>
                </div>
            ) : invoices.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
                    <FileText size={36} className="text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No invoices matched your filters</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        There are no records matching your query on the server database.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-3.5 px-5">Invoice #</th>
                                    <th className="py-3.5 px-5">Customer</th>
                                    <th className="py-3.5 px-5">Amount</th>
                                    <th className="py-3.5 px-5">Dates (Issue / Due)</th>
                                    <th className="py-3.5 px-5">Status</th>
                                    <th className="py-3.5 px-5">Creator</th>
                                    <th className="py-3.5 px-5 text-right">Lifecycle Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {invoices.map((inv) => {
                                    const isPaid = inv.status === "Paid";
                                    const isDraft = inv.status === "Draft";
                                    const isIssued = inv.status === "Issued";
                                    const isVoid = inv.status === "Void";

                                    return (
                                        <tr key={inv._id} className="hover:bg-slate-50/80 transition">
                                            {/* Invoice Number */}
                                            <td className="py-4 px-5">
                                                <button
                                                    onClick={() => handleViewDetails(inv)}
                                                    className="font-mono font-bold text-blue-600 hover:text-blue-800 text-xs hover:underline flex items-center gap-1.5"
                                                >
                                                    <FileText size={14} />
                                                    <span>{inv.invoiceNumber}</span>
                                                </button>
                                            </td>

                                            {/* Customer */}
                                            <td className="py-4 px-5">
                                                <div className="font-bold text-slate-900">{inv.customerName}</div>
                                                <div className="text-xs text-slate-500">{inv.customerEmail}</div>
                                            </td>

                                            {/* Amount (NEVER [object Object]) */}
                                            <td className="py-4 px-5">
                                                <span className="font-bold text-slate-900">
                                                    {formatCurrency(inv.amount, inv.currency)}
                                                </span>
                                            </td>

                                            {/* Dates */}
                                            <td className="py-4 px-5">
                                                <div className="text-xs text-slate-700">
                                                    <span className="text-slate-400">Issued:</span> {formatDate(inv.issueDate)}
                                                </div>
                                                <div className="text-xs font-semibold text-slate-800 mt-0.5">
                                                    <span className="text-slate-400 font-normal">Due:</span> {formatDate(inv.dueDate)}
                                                </div>
                                            </td>

                                            {/* Status badge */}
                                            <td className="py-4 px-5">
                                                {renderStatusBadge(inv)}
                                            </td>

                                            {/* Creator */}
                                            <td className="py-4 px-5">
                                                <span className="text-xs font-semibold text-slate-700 block">
                                                    {inv.createdBy?.name || "System"}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {inv.createdBy?.role || "Staff"}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* View details */}
                                                    <button
                                                        onClick={() => handleViewDetails(inv)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                                                        title="View Invoice Details & History"
                                                    >
                                                        <Eye size={16} />
                                                    </button>

                                                    {/* Billing Admin lifecycle actions */}
                                                    {isBillingAdmin && (
                                                        <>
                                                            {/* Draft -> Issue */}
                                                            {isDraft && (
                                                                <button
                                                                    onClick={() => handleIssue(inv)}
                                                                    disabled={actionLoading}
                                                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
                                                                    title="Issue Invoice"
                                                                >
                                                                    Issue
                                                                </button>
                                                            )}

                                                            {/* Issued -> Pay */}
                                                            {isIssued && (
                                                                <button
                                                                    onClick={() => handlePay(inv)}
                                                                    disabled={actionLoading}
                                                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm flex items-center gap-1"
                                                                    title="Mark as Paid"
                                                                >
                                                                    <Check size={13} />
                                                                    <span>Pay</span>
                                                                </button>
                                                            )}

                                                            {/* Draft or Issued -> Void */}
                                                            {(isDraft || isIssued) && (
                                                                <button
                                                                    onClick={() => handleVoid(inv)}
                                                                    disabled={actionLoading}
                                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                                    title="Void Invoice"
                                                                >
                                                                    <Ban size={15} />
                                                                </button>
                                                            )}

                                                            {/* Paid -> Credit Note */}
                                                            {isPaid && (
                                                                <button
                                                                    onClick={() => handleOpenCreditNote(inv)}
                                                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition"
                                                                    title="Create Credit Note"
                                                                >
                                                                    Credit Note
                                                                </button>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Void / Immutable state */}
                                                    {isVoid && (
                                                        <span className="text-[11px] text-slate-400 italic px-2">
                                                            Voided
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                        <div className="text-slate-500">
                            Showing <span className="font-bold text-slate-800">{invoices.length}</span> of{" "}
                            <span className="font-bold text-slate-800">{pagination.totalInvoices}</span> total invoices
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">Per page:</span>
                                <select
                                    value={limit}
                                    onChange={(e) => {
                                        setLimit(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                    disabled={pagination.currentPage <= 1 || loading}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 transition disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <span className="font-semibold text-slate-700">
                                    Page {pagination.currentPage} of {Math.max(pagination.totalPages, 1)}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                                    disabled={pagination.currentPage >= pagination.totalPages || loading}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-100 transition disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* Create Invoice Modal (Goal 3) */}
            {/* ============================================================= */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Create Draft Invoice
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Generates a draft invoice tied to an active customer subscription
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Target Customer Subscription *
                                </label>
                                {activeSubscriptions.length === 0 ? (
                                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                        No active subscriptions found. You must have an active subscription to generate an invoice.
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={createFormData.subscriptionId}
                                        onChange={(e) =>
                                            setCreateFormData({ ...createFormData, subscriptionId: e.target.value })
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                    >
                                        <option value="">-- Choose active subscription --</option>
                                        {activeSubscriptions.map((sub) => (
                                            <option key={sub._id} value={sub._id}>
                                                {sub.customerName} — {sub.planName} ({formatCurrency(sub.amount, sub.currency)})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Invoice Number *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createFormData.invoiceNumber}
                                    onChange={(e) =>
                                        setCreateFormData({ ...createFormData, invoiceNumber: e.target.value })
                                    }
                                    placeholder="INV-2026-001"
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Payment Due Date *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={createFormData.dueDate}
                                    onChange={(e) =>
                                        setCreateFormData({ ...createFormData, dueDate: e.target.value })
                                    }
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading || activeSubscriptions.length === 0}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {actionLoading && <RefreshCw size={15} className="animate-spin" />}
                                    <span>Create Draft Invoice</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* Invoice Details & Immutable History Timeline Modal (Goals 3, 4, 9) */}
            {/* ============================================================= */}
            {showDetailsModal && selectedInvoice && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-lg font-black text-slate-900">
                                        {selectedInvoice.invoiceNumber}
                                    </span>
                                    {renderStatusBadge(selectedInvoice)}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Invoice ID: <span className="font-mono">{selectedInvoice._id}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Customer & Billing Summary Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-6">
                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">Customer</span>
                                <span className="font-bold text-slate-800 text-sm block mt-0.5 truncate">
                                    {selectedInvoice.customerName}
                                </span>
                                <span className="text-xs text-slate-500 block truncate">{selectedInvoice.customerEmail}</span>
                            </div>

                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Amount</span>
                                <span className="font-black text-blue-600 text-base block mt-0.5">
                                    {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                                </span>
                            </div>

                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">Due Date</span>
                                <span className="font-bold text-slate-800 text-sm block mt-0.5">
                                    {formatDate(selectedInvoice.dueDate)}
                                </span>
                            </div>

                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">Issue Date</span>
                                <span className="font-medium text-slate-700 text-xs block mt-0.5">
                                    {formatDate(selectedInvoice.issueDate)}
                                </span>
                            </div>

                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">Created By</span>
                                <span className="font-medium text-slate-700 text-xs block mt-0.5">
                                    {selectedInvoice.createdBy?.name || "System"} ({selectedInvoice.createdBy?.role || "Staff"})
                                </span>
                            </div>

                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">Subscription</span>
                                <span className="font-medium text-slate-700 text-xs block mt-0.5 truncate">
                                    {selectedInvoice.subscriptionId?.planName || "Active Plan"}
                                </span>
                            </div>
                        </div>

                        {/* Goal 9: Immutable History Timeline */}
                        <div className="mb-6">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                                <Clock size={14} className="text-blue-600" />
                                <span>Immutable Audit Timeline & History</span>
                            </h4>

                            <div className="border-l-2 border-slate-200 pl-4 space-y-4 text-xs">
                                {/* Created */}
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-slate-400" />
                                    <div className="font-bold text-slate-800">Invoice Draft Created</div>
                                    <div className="text-slate-500 text-[11px]">
                                        {formatDateTime(selectedInvoice.createdAt || selectedInvoice.issueDate)} • By {selectedInvoice.createdBy?.name || "System"}
                                    </div>
                                </div>

                                {/* Issued */}
                                {selectedInvoice.status !== "Draft" && (
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-500" />
                                        <div className="font-bold text-blue-700">Invoice Issued</div>
                                        <div className="text-slate-500 text-[11px]">
                                            {formatDateTime(selectedInvoice.issueDate)} • Transitioned to Issued state
                                        </div>
                                    </div>
                                )}

                                {/* Paid */}
                                {selectedInvoice.status === "Paid" && (
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        <div className="font-bold text-emerald-700">Payment Completed (Immutable)</div>
                                        <div className="text-slate-500 text-[11px]">
                                            {formatDateTime(selectedInvoice.paidAt || selectedInvoice.updatedAt)} • Funds collected
                                        </div>
                                    </div>
                                )}

                                {/* Voided */}
                                {selectedInvoice.status === "Void" && (
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-rose-500" />
                                        <div className="font-bold text-rose-700">Invoice Voided</div>
                                        <div className="text-slate-500 text-[11px]">
                                            {formatDateTime(selectedInvoice.voidedAt || selectedInvoice.updatedAt)} • Voided by administrator
                                        </div>
                                    </div>
                                )}

                                {/* Recorded Timeline Events / Credit notes */}
                                {(invoiceNotes[selectedInvoice._id] || []).map((ev, i) => (
                                    <div key={i} className="relative">
                                        <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-amber-500" />
                                        <div className="font-bold text-amber-800">{ev.type}: {ev.message}</div>
                                        <div className="text-slate-500 text-[11px]">
                                            {formatDateTime(ev.timestamp)} • Actor: {ev.actor}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Lifecycle Action Buttons inside details */}
                        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs text-slate-400">
                                {selectedInvoice.status === "Paid" && (
                                    <span className="font-semibold text-emerald-700">
                                        ✓ Paid invoices are immutable and locked against updates.
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDetailsModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                                >
                                    Close
                                </button>

                                {isBillingAdmin && selectedInvoice.status === "Draft" && (
                                    <button
                                        onClick={() => handleIssue(selectedInvoice)}
                                        disabled={actionLoading}
                                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                                    >
                                        Issue Invoice
                                    </button>
                                )}

                                {isBillingAdmin && selectedInvoice.status === "Issued" && (
                                    <button
                                        onClick={() => handlePay(selectedInvoice)}
                                        disabled={actionLoading}
                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                                    >
                                        <Check size={14} />
                                        <span>Mark as Paid</span>
                                    </button>
                                )}

                                {isBillingAdmin && (selectedInvoice.status === "Draft" || selectedInvoice.status === "Issued") && (
                                    <button
                                        onClick={() => handleVoid(selectedInvoice)}
                                        disabled={actionLoading}
                                        className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold"
                                    >
                                        Void Invoice
                                    </button>
                                )}

                                {isBillingAdmin && selectedInvoice.status === "Paid" && (
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            handleOpenCreditNote(selectedInvoice);
                                        }}
                                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
                                    >
                                        Issue Credit Note
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* Goal 7: Bulk Invoice Generation Result Modal */}
            {/* ============================================================= */}
            {showBulkResultModal && bulkResult && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Layers size={20} className="text-blue-600" />
                                    <span>Bulk Invoice Generation Report</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Execution telemetry across all due subscriptions
                                </p>
                            </div>
                            <button
                                onClick={() => setShowBulkResultModal(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-4 gap-2 text-center mb-5">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Evaluated</span>
                                <div className="text-xl font-black text-slate-800 mt-0.5">
                                    {bulkResult.summary?.totalSubscriptions ?? 0}
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase">Created</span>
                                <div className="text-xl font-black text-emerald-700 mt-0.5">
                                    {bulkResult.summary?.invoicesCreated ?? 0}
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                                <span className="text-[10px] font-bold text-amber-600 uppercase">Skipped</span>
                                <div className="text-xl font-black text-amber-700 mt-0.5">
                                    {bulkResult.summary?.subscriptionsSkipped ?? 0}
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                                <span className="text-[10px] font-bold text-rose-600 uppercase">Errors</span>
                                <div className="text-xl font-black text-rose-700 mt-0.5">
                                    {bulkResult.summary?.errors ?? 0}
                                </div>
                            </div>
                        </div>

                        {/* Per-Subscription Result Reporting (Goal 7) */}
                        <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                            {/* Created Invoices */}
                            {bulkResult.createdInvoices?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
                                        Generated Invoices ({bulkResult.createdInvoices.length})
                                    </h4>
                                    <div className="space-y-1.5">
                                        {bulkResult.createdInvoices.map((inv) => (
                                            <div key={inv._id} className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs">
                                                <div>
                                                    <span className="font-bold text-slate-800">{inv.invoiceNumber}</span>
                                                    <span className="text-slate-500 ml-2">({inv.customerName})</span>
                                                </div>
                                                <span className="font-semibold text-emerald-800">{formatCurrency(inv.amount, inv.currency)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Skipped Subscriptions */}
                            {bulkResult.skippedSubscriptions?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
                                        Skipped Subscriptions ({bulkResult.skippedSubscriptions.length})
                                    </h4>
                                    <div className="space-y-1.5">
                                        {bulkResult.skippedSubscriptions.map((item, idx) => (
                                            <div key={idx} className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100 flex items-center justify-between text-xs">
                                                <span className="font-mono text-slate-600 truncate max-w-[200px]">{item.subscriptionId}</span>
                                                <span className="text-amber-800 font-medium">{item.reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Errors */}
                            {bulkResult.errors?.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-2">
                                        Errors ({bulkResult.errors.length})
                                    </h4>
                                    <div className="space-y-1.5">
                                        {bulkResult.errors.map((errItem, idx) => (
                                            <div key={idx} className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-700">
                                                {errItem.message || "Failed to process subscription"}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 mt-5 border-t border-slate-100 text-right">
                            <button
                                onClick={() => setShowBulkResultModal(false)}
                                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                            >
                                Dismiss Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* Credit Note Creation Modal for Paid Invoices (Goals 4, 9) */}
            {/* ============================================================= */}
            {showCreditNoteModal && creditNoteTargetInvoice && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <CreditCard size={20} className="text-amber-500" />
                                    <span>Issue Credit Note</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    For Paid Invoice {creditNoteTargetInvoice.invoiceNumber} ({formatCurrency(creditNoteTargetInvoice.amount, creditNoteTargetInvoice.currency)})
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreditNoteModal(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {creditNoteError && (
                            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                                {creditNoteError}
                            </div>
                        )}

                        <form onSubmit={handleSubmitCreditNote} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Credit Note Number *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={creditNoteForm.creditNoteNumber}
                                    onChange={(e) =>
                                        setCreditNoteForm({ ...creditNoteForm, creditNoteNumber: e.target.value })
                                    }
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Credit Amount ({creditNoteTargetInvoice.currency || "INR"}) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={parseAmount(creditNoteTargetInvoice.amount)}
                                    required
                                    value={creditNoteForm.amount}
                                    onChange={(e) =>
                                        setCreditNoteForm({ ...creditNoteForm, amount: e.target.value })
                                    }
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Maximum credit allowable: {formatCurrency(creditNoteTargetInvoice.amount, creditNoteTargetInvoice.currency)}
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Reason for Credit Note *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={creditNoteForm.reason}
                                    onChange={(e) =>
                                        setCreditNoteForm({ ...creditNoteForm, reason: e.target.value })
                                    }
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreditNoteModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/25 transition disabled:opacity-50"
                                >
                                    {actionLoading ? "Processing..." : "Confirm Credit Note"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Invoices;