import { useState, useEffect } from "react";
import {
    CreditCard,
    CheckCircle2,
    AlertCircle,
    FileText,
    RefreshCw,
    Shield
} from "lucide-react";
import { getInvoices, createCreditNote } from "../services/api";
import useAuth from "../context/useAuth";
import { formatCurrency, formatAmount, formatDate, parseAmount } from "../utils/formatters";

function CreditNotes() {
    const { user, isBillingAdmin } = useAuth();

    const [paidInvoices, setPaidInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Form state
    const [formData, setFormData] = useState(() => {
        const randId = Math.floor(1000 + Math.random() * 9000);
        return {
            invoiceId: "",
            creditNoteNumber: `CN-${new Date().getFullYear()}-${randId}`,
            amount: "",
            reason: ""
        };
    });

    // Selected invoice preview
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Recent credit notes stored in local cache
    const [recentCreditNotes, setRecentCreditNotes] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("recent_credit_notes") || "[]");
        } catch {
            return [];
        }
    });

    const loadPaidInvoices = async () => {
        try {
            setLoadingInvoices(true);
            setErrorMessage("");
            const data = await getInvoices("status=Paid&limit=100");
            const list = data.invoices || [];
            setPaidInvoices(list);
        } catch (err) {
            console.error("Failed to load paid invoices:", err);
            setErrorMessage(err.message || "Failed to fetch paid invoices");
        } finally {
            setLoadingInvoices(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadPaidInvoices();
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const handleInvoiceSelect = (invId) => {
        const inv = paidInvoices.find((i) => i._id === invId);
        setSelectedInvoice(inv || null);
        setFormData((prev) => ({
            ...prev,
            invoiceId: invId,
            amount: inv ? formatAmount(inv.amount) : ""
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage("");
        setErrorMessage("");

        if (!isBillingAdmin) {
            setErrorMessage("Only Billing Admins have permission to issue credit notes.");
            return;
        }

        if (!formData.invoiceId) {
            setErrorMessage("Please select a Paid invoice to credit.");
            return;
        }

        setSubmitting(true);

        try {
            const data = await createCreditNote({
                invoiceId: formData.invoiceId,
                creditNoteNumber: formData.creditNoteNumber.trim(),
                amount: formData.amount.trim(),
                reason: formData.reason.trim()
            });

            const newNote = {
                _id: data.creditNote?._id || `cn_${Date.now()}`,
                creditNoteNumber: formData.creditNoteNumber,
                amount: formData.amount,
                currency: selectedInvoice?.currency || "INR",
                reason: formData.reason,
                invoiceNumber: selectedInvoice?.invoiceNumber,
                customerName: selectedInvoice?.customerName,
                createdAt: new Date().toISOString(),
                createdBy: user?.name || "Billing Admin"
            };

            const updatedNotes = [newNote, ...recentCreditNotes];
            setRecentCreditNotes(updatedNotes);
            localStorage.setItem("recent_credit_notes", JSON.stringify(updatedNotes));

            setSuccessMessage(
                `Credit note ${formData.creditNoteNumber} for ${formatCurrency(formData.amount, selectedInvoice?.currency)} created successfully.`
            );

            // Reset form with new number
            const randId = Math.floor(1000 + Math.random() * 9000);
            setFormData({
                invoiceId: "",
                creditNoteNumber: `CN-${new Date().getFullYear()}-${randId}`,
                amount: "",
                reason: ""
            });
            setSelectedInvoice(null);
            setTimeout(() => setSuccessMessage(""), 5000);
        } catch (err) {
            setErrorMessage(err.message || "Failed to create credit note");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        <span>Adjustments & Refunds</span>
                        <span>•</span>
                        <span className="text-blue-600 font-semibold">{user?.role}</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <span>Credit Notes Engine</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Issue certified credit notes and partial or full adjustments against settled Paid invoices
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadPaidInvoices}
                        disabled={loadingInvoices}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
                    >
                        <RefreshCw size={14} className={loadingInvoices ? "animate-spin text-blue-600" : ""} />
                        <span>Refresh Eligible Invoices</span>
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
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Non-Admin Notice */}
            {!isBillingAdmin && (
                <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 flex items-start gap-3 text-sky-800 text-xs">
                    <Shield size={18} className="text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold block text-sm">Role Notice: Account Manager</span>
                        Credit note issuance is restricted to users with the <strong>Billing Admin</strong> role per backend security rules. Account Managers can review settled records.
                    </div>
                </div>
            )}

            {/* Main Form & Ledger Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Column */}
                <div className="lg:col-span-6 bg-white rounded-2xl p-6 lg:p-7 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                        <CreditCard size={18} className="text-blue-600" />
                        <h2 className="text-base font-bold text-slate-900">
                            Issue New Credit Note
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Target Invoice */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Select Paid Invoice *
                            </label>
                            {loadingInvoices ? (
                                <div className="p-3 text-xs text-slate-400">Loading eligible settled invoices...</div>
                            ) : paidInvoices.length === 0 ? (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                                    No settled Paid invoices available in the system yet. Only Paid invoices can be credited.
                                </div>
                            ) : (
                                <select
                                    value={formData.invoiceId}
                                    onChange={(e) => handleInvoiceSelect(e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="">-- Choose settled invoice --</option>
                                    {paidInvoices.map((inv) => (
                                        <option key={inv._id} value={inv._id}>
                                            {inv.invoiceNumber} — {inv.customerName} ({formatCurrency(inv.amount, inv.currency)})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Selected Invoice Preview */}
                        {selectedInvoice && (
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Customer:</span>
                                    <span className="font-bold text-slate-800">{selectedInvoice.customerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Invoice Total:</span>
                                    <span className="font-bold text-emerald-700">
                                        {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Settled On:</span>
                                    <span className="font-medium text-slate-700">
                                        {formatDate(selectedInvoice.paidAt || selectedInvoice.updatedAt)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Credit Note Number */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Credit Note Number *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.creditNoteNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, creditNoteNumber: e.target.value })
                                }
                                placeholder="CN-2026-001"
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* Credit Amount */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Credit Amount ({selectedInvoice?.currency || "INR"}) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={selectedInvoice ? parseAmount(selectedInvoice.amount) : undefined}
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="e.g. 500.00"
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                                Must not exceed remaining uncredited balance of the invoice.
                            </p>
                        </div>

                        {/* Reason */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                Business Reason *
                            </label>
                            <textarea
                                required
                                rows={3}
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                placeholder="e.g. Service interruption credit or customer billing correction"
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !isBillingAdmin || paidInvoices.length === 0}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <RefreshCw size={16} className="animate-spin" />
                            ) : (
                                <CreditCard size={16} />
                            )}
                            <span>Issue Credit Note</span>
                        </button>
                    </form>
                </div>

                {/* Credit Notes Ledger */}
                <div className="lg:col-span-6 bg-white rounded-2xl p-6 lg:p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <FileText size={18} className="text-indigo-600" />
                                <span>Credit Notes History Ledger</span>
                            </h2>
                            <span className="text-xs font-semibold text-slate-500">
                                {recentCreditNotes.length} recorded
                            </span>
                        </div>

                        {recentCreditNotes.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-sm">
                                <CreditCard size={36} className="text-slate-300 mx-auto mb-2" />
                                <p className="font-semibold text-slate-700">No credit notes issued yet</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    When you issue credit adjustments against paid invoices, they will appear in this ledger.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                {recentCreditNotes.map((cn) => (
                                    <div
                                        key={cn._id || cn.creditNoteNumber}
                                        className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2 hover:bg-slate-100/70 transition"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-bold text-blue-700 text-sm">
                                                {cn.creditNoteNumber}
                                            </span>
                                            <span className="font-black text-rose-600 text-sm">
                                                - {formatCurrency(cn.amount, cn.currency)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-slate-600">
                                            <span>
                                                For Invoice: <strong>{cn.invoiceNumber || "Settled Invoice"}</strong>
                                            </span>
                                            <span>{cn.customerName}</span>
                                        </div>

                                        <p className="text-slate-500 bg-white p-2 rounded-lg border border-slate-100 italic">
                                            "{cn.reason}"
                                        </p>

                                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                                            <span>Issued: {formatDate(cn.createdAt)}</span>
                                            <span>By: {cn.createdBy}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 mt-6 border-t border-slate-100 text-xs text-slate-400">
                        Credit note issuance updates the invoice balance and creates an audit event in the invoice timeline.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreditNotes;
