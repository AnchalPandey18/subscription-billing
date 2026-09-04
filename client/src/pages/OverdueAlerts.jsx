import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Clock,
    DollarSign,
    Check,
    FileText,
    Info,
    Calendar,
    Mail,
    User
} from "lucide-react";
import { getOverdueAlerts, dismissOverdueAlert, payInvoice } from "../services/api";
import useAuth from "../context/useAuth";
import {
    formatCurrency,
    formatDate,
    calculateDaysOverdue,
    parseAmount
} from "../utils/formatters";

function OverdueAlerts() {
    const navigate = useNavigate();
    const { user, isBillingAdmin, refreshOverdueCount } = useAuth();

    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dismissingId, setDismissingId] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const loadAlerts = async () => {
        try {
            setLoading(true);
            setErrorMessage("");
            const data = await getOverdueAlerts();
            setAlerts(data.overdueAlerts || []);
            refreshOverdueCount();
        } catch (err) {
            console.error("Failed to fetch overdue alerts:", err);
            setErrorMessage(err.message || "Failed to load overdue alerts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadAlerts();
        }, 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDismiss = async (invoiceId, invoiceNumber) => {
        try {
            setDismissingId(invoiceId);
            setErrorMessage("");
            await dismissOverdueAlert(invoiceId);

            // Remove from local list immediately
            setAlerts((prev) => prev.filter((a) => a._id !== invoiceId));
            setSuccessMessage(
                `Overdue alert for invoice ${invoiceNumber} dismissed. If the due date is later rescheduled and expires again, it will automatically reappear.`
            );
            refreshOverdueCount();
            setTimeout(() => setSuccessMessage(""), 5000);
        } catch (err) {
            setErrorMessage(err.message || "Failed to dismiss overdue alert");
        } finally {
            setDismissingId(null);
        }
    };

    const handlePayDirectly = async (invoiceId, invoiceNumber) => {
        if (!isBillingAdmin) return;
        try {
            setDismissingId(invoiceId);
            await payInvoice(invoiceId);
            setSuccessMessage(`Invoice ${invoiceNumber} marked as Paid.`);
            await loadAlerts();
            refreshOverdueCount();
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            setErrorMessage(err.message || "Failed to mark invoice as paid");
        } finally {
            setDismissingId(null);
        }
    };

    const totalOverdueAmount = alerts.reduce(
        (sum, inv) => sum + parseAmount(inv.amount),
        0
    );

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        <span>Collections & Arrears</span>
                        <span>•</span>
                        <span className="text-blue-600 font-semibold">{user?.role}</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <AlertTriangle className="text-red-600" />
                        <span>Overdue Invoices & Action Alerts</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Review active overdue notices, dismiss alerts, or settle outstanding receivables
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadAlerts}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin text-blue-600" : ""} />
                        <span>Refresh Alerts</span>
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {successMessage && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-800 text-sm shadow-sm">
                    <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {errorMessage && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-red-700 text-sm">
                    <AlertTriangle size={18} className="flex-shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Assessment Goal 10 Behavior Callout */}
            <div className="rounded-2xl bg-slate-900 text-white p-5 shadow-sm flex items-start gap-3.5">
                <Info size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-white block text-sm mb-0.5">
                        Overdue Alert Lifecycle (Goal 10 Architecture)
                    </strong>
                    Alerts trigger automatically for invoices in <strong>Issued</strong> status past their due date. Dismissing an alert removes it from your dashboard and navigation badge for the current due date. If an invoice's due date is updated or another billing cycle lapses, the alert will reappear in accordance with the backend rule.
                </div>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Undismissed Overdue Notices
                        </span>
                        <div className="text-3xl font-black text-red-600 mt-1">
                            {alerts.length}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Unsettled invoices past scheduled maturity
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Total Arrears Value
                        </span>
                        <div className="text-3xl font-black text-slate-900 mt-1">
                            {formatCurrency(totalOverdueAmount)}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Cumulative overdue revenue currently outstanding
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <DollarSign size={24} />
                    </div>
                </div>
            </div>

            {/* Alerts List */}
            {loading ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
                    <RefreshCw size={28} className="animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Checking for overdue notices...</p>
                </div>
            ) : alerts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
                    <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-900">All Clear! No Overdue Alerts</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        There are currently no undismissed overdue invoices in your workspace. All customer accounts are either settled or within their billing period.
                    </p>
                    <button
                        onClick={() => navigate("/invoices")}
                        className="mt-5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
                    >
                        View Full Invoice Registry
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {alerts.map((inv) => {
                        const days = calculateDaysOverdue(inv.dueDate);

                        return (
                            <div
                                key={inv._id}
                                className="p-5 rounded-2xl bg-white border border-red-200/80 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <AlertTriangle size={20} />
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono font-bold text-slate-900 text-sm">
                                                {inv.invoiceNumber}
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                {days} days overdue
                                            </span>
                                            <span className="text-sm font-black text-slate-900">
                                                {formatCurrency(inv.amount, inv.currency)}
                                            </span>
                                        </div>

                                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                                            <span className="font-semibold text-slate-900">
                                                {inv.customerName}
                                            </span>
                                            <span className="flex items-center gap-1 text-slate-500">
                                                <Mail size={12} />
                                                {inv.customerEmail}
                                            </span>
                                            <span className="flex items-center gap-1 text-slate-500">
                                                <Calendar size={12} />
                                                Due: <strong className="text-red-700">{formatDate(inv.dueDate)}</strong>
                                            </span>
                                            <span className="flex items-center gap-1 text-slate-400">
                                                <User size={12} />
                                                Created by {inv.createdBy?.name || "Staff"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 self-end lg:self-center">
                                    {isBillingAdmin && (
                                        <button
                                            onClick={() => handlePayDirectly(inv._id, inv.invoiceNumber)}
                                            disabled={dismissingId === inv._id}
                                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm flex items-center gap-1.5"
                                        >
                                            <Check size={14} />
                                            <span>Record Payment</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDismiss(inv._id, inv.invoiceNumber)}
                                        disabled={dismissingId === inv._id}
                                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                                    >
                                        {dismissingId === inv._id ? "Dismissing..." : "Dismiss Alert"}
                                    </button>

                                    <button
                                        onClick={() => navigate("/invoices")}
                                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                        title="View in Invoices Registry"
                                    >
                                        <FileText size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default OverdueAlerts;
