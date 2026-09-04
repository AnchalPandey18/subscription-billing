import { useEffect, useState, useMemo } from "react";
import {
    Receipt,
    Plus,
    Search,
    Edit3,
    Archive,
    Users,
    Calendar,
    Mail,
    User,
    RefreshCw,
    X,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import {
    getSubscriptions,
    createSubscription,
    updateSubscription,
    archiveSubscription,
    getCollaborators,
    addCollaborator,
    removeCollaborator
} from "../services/api";
import useAuth from "../context/useAuth";
import {
    formatCurrency,
    formatAmount,
    formatDate,
    formatDateForInput
} from "../utils/formatters";

function Subscriptions() {
    const { user, isBillingAdmin } = useAuth();

    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Search & Status filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // Modal state for Create / Edit
    const [showModal, setShowModal] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        customerName: "",
        customerEmail: "",
        planName: "",
        amount: "",
        currency: "INR",
        billingCycle: "Monthly",
        startDate: "",
        nextBillingDate: ""
    });

    // Collaborators Modal state
    const [collabModalSub, setCollabModalSub] = useState(null);
    const [collaborators, setCollaborators] = useState([]);
    const [collabLoading, setCollabLoading] = useState(false);
    const [newCollabUserId, setNewCollabUserId] = useState("");
    const [collabActionLoading, setCollabActionLoading] = useState(false);
    const [collabError, setCollabError] = useState("");

    const loadSubscriptionsList = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getSubscriptions();
            setSubscriptions(data.subscriptions || []);
        } catch (err) {
            console.error("Failed to load subscriptions:", err);
            setError(err.message || "Failed to fetch subscriptions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadSubscriptionsList();
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    // Filter subscriptions
    const filteredSubscriptions = useMemo(() => {
        return subscriptions.filter((sub) => {
            const query = search.toLowerCase().trim();
            const matchesSearch =
                !query ||
                sub.customerName?.toLowerCase().includes(query) ||
                sub.customerEmail?.toLowerCase().includes(query) ||
                sub.planName?.toLowerCase().includes(query);

            const matchesStatus =
                statusFilter === "All" || sub.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [subscriptions, search, statusFilter]);

    // Open create modal
    const handleOpenCreate = () => {
        setEditingSubscription(null);
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);

        setFormData({
            customerName: "",
            customerEmail: "",
            planName: "Pro Tier",
            amount: "1499.00",
            currency: "INR",
            billingCycle: "Monthly",
            startDate: formatDateForInput(today),
            nextBillingDate: formatDateForInput(nextMonth)
        });
        setShowModal(true);
    };

    // Open edit modal
    const handleOpenEdit = (sub) => {
        if (sub.status === "Archived") {
            alert("Archived subscriptions are read-only and cannot be modified.");
            return;
        }
        setEditingSubscription(sub);
        setFormData({
            customerName: sub.customerName || "",
            customerEmail: sub.customerEmail || "",
            planName: sub.planName || "",
            amount: formatAmount(sub.amount),
            currency: sub.currency || "INR",
            billingCycle: sub.billingCycle || "Monthly",
            startDate: formatDateForInput(sub.startDate),
            nextBillingDate: formatDateForInput(sub.nextBillingDate)
        });
        setShowModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const payload = {
                customerName: formData.customerName.trim(),
                customerEmail: formData.customerEmail.trim(),
                planName: formData.planName.trim(),
                amount: parseFloat(formData.amount),
                currency: formData.currency,
                billingCycle: formData.billingCycle,
                startDate: formData.startDate,
                nextBillingDate: formData.nextBillingDate
            };

            if (editingSubscription) {
                await updateSubscription(editingSubscription._id, payload);
                setSuccessMessage(`Subscription for ${payload.customerName} updated successfully.`);
            } else {
                await createSubscription(payload);
                setSuccessMessage(`New subscription for ${payload.customerName} created.`);
            }

            setShowModal(false);
            setEditingSubscription(null);
            await loadSubscriptionsList();
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            setError(err.message || "Failed to save subscription");
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async (sub) => {
        if (!isBillingAdmin) {
            alert("Only Billing Admin can archive subscriptions.");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to archive subscription for "${sub.customerName}"? Once archived, it cannot be edited or auto-billed.`
        );
        if (!confirmed) return;

        try {
            await archiveSubscription(sub._id);
            setSuccessMessage(`Subscription for "${sub.customerName}" has been archived.`);
            await loadSubscriptionsList();
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            alert(err.message || "Failed to archive subscription");
        }
    };

    // =========================================================================
    // Collaborators Modal Logic (Goal 2 & 5)
    // =========================================================================
    const handleOpenCollaborators = async (sub) => {
        setCollabModalSub(sub);
        setCollabError("");
        setNewCollabUserId("");
        setCollabLoading(true);

        try {
            const res = await getCollaborators(sub._id);
            setCollaborators(res.collaborators || []);
        } catch (err) {
            setCollabError(err.message || "Failed to fetch collaborators");
        } finally {
            setCollabLoading(false);
        }
    };

    const handleAddCollaborator = async (e) => {
        e.preventDefault();
        if (!newCollabUserId.trim()) return;

        setCollabActionLoading(true);
        setCollabError("");

        try {
            await addCollaborator({
                subscriptionId: collabModalSub._id,
                userId: newCollabUserId.trim()
            });
            setNewCollabUserId("");
            const res = await getCollaborators(collabModalSub._id);
            setCollaborators(res.collaborators || []);
        } catch (err) {
            setCollabError(err.message || "Failed to add collaborator");
        } finally {
            setCollabActionLoading(false);
        }
    };

    const handleRemoveCollaborator = async (collabId) => {
        if (!window.confirm("Remove this collaborator from the subscription?")) return;

        setCollabActionLoading(true);
        try {
            await removeCollaborator(collabId);
            const res = await getCollaborators(collabModalSub._id);
            setCollaborators(res.collaborators || []);
        } catch (err) {
            setCollabError(err.message || "Failed to remove collaborator");
        } finally {
            setCollabActionLoading(false);
        }
    };

    // Collect distinct known user IDs for collaborator suggestions
    const knownUsers = useMemo(() => {
        const map = {};
        subscriptions.forEach((s) => {
            if (s.createdBy?._id) {
                map[s.createdBy._id] = s.createdBy;
            }
        });
        return Object.values(map);
    }, [subscriptions]);

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        <span>Subscription Management</span>
                        <span>•</span>
                        <span className="text-blue-600 font-semibold">{user?.role}</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                        Customer Subscriptions
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Configure recurring plans, ownership, collaborators, and billing schedules
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadSubscriptionsList}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition"
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin text-blue-600" : ""} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>

                    <button
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition"
                    >
                        <Plus size={16} />
                        <span>Create Subscription</span>
                    </button>
                </div>
            </div>

            {/* Notification Alerts */}
            {successMessage && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-800 text-sm shadow-sm">
                    <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-red-700 text-sm">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Search and Status Filters */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by customer, email, or plan..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <span className="text-xs font-bold uppercase text-slate-400 mr-2 whitespace-nowrap">Status:</span>
                    {["All", "Active", "Archived"].map((st) => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                statusFilter === st
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Subscriptions Table / Cards */}
            {loading ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
                    <RefreshCw size={28} className="animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Loading subscriptions...</p>
                </div>
            ) : filteredSubscriptions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
                    <Receipt size={36} className="text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No subscriptions found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {search || statusFilter !== "All"
                            ? "Try adjusting your search criteria or status filter."
                            : "Get started by adding your first customer subscription plan."}
                    </p>
                    {search || statusFilter !== "All" ? (
                        <button
                            onClick={() => {
                                setSearch("");
                                setStatusFilter("All");
                            }}
                            className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                        >
                            Reset Filters
                        </button>
                    ) : (
                        <button
                            onClick={handleOpenCreate}
                            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition"
                        >
                            Create Subscription
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-3.5 px-5">Customer</th>
                                    <th className="py-3.5 px-5">Plan & Billing</th>
                                    <th className="py-3.5 px-5">Amount</th>
                                    <th className="py-3.5 px-5">Next Billing Date</th>
                                    <th className="py-3.5 px-5">Owner</th>
                                    <th className="py-3.5 px-5">Status</th>
                                    <th className="py-3.5 px-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredSubscriptions.map((sub) => {
                                    const isArchived = sub.status === "Archived";

                                    return (
                                        <tr key={sub._id} className="hover:bg-slate-50/80 transition">
                                            {/* Customer */}
                                            <td className="py-4 px-5">
                                                <div className="font-bold text-slate-900">{sub.customerName}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Mail size={12} />
                                                    <span>{sub.customerEmail}</span>
                                                </div>
                                            </td>

                                            {/* Plan & Billing */}
                                            <td className="py-4 px-5">
                                                <span className="font-semibold text-slate-800">{sub.planName}</span>
                                                <span className="block text-xs text-slate-500">
                                                    {sub.billingCycle} Cycle
                                                </span>
                                            </td>

                                            {/* Amount */}
                                            <td className="py-4 px-5">
                                                <span className="font-bold text-slate-900">
                                                    {formatCurrency(sub.amount, sub.currency)}
                                                </span>
                                            </td>

                                            {/* Next Billing Date */}
                                            <td className="py-4 px-5">
                                                <div className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                                                    <Calendar size={13} className="text-slate-400" />
                                                    <span>{formatDate(sub.nextBillingDate)}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                                    Started: {formatDate(sub.startDate)}
                                                </span>
                                            </td>

                                            {/* Owner (createdBy) */}
                                            <td className="py-4 px-5">
                                                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                                                    <User size={13} className="text-slate-400" />
                                                    <span>{sub.createdBy?.name || "System"}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 block">
                                                    {sub.createdBy?.role || "Manager"}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-5">
                                                {isArchived ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                        Archived
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Active
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Collaborators button (Goal 2 & 5) */}
                                                    <button
                                                        onClick={() => handleOpenCollaborators(sub)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                                                        title="Manage Collaborators"
                                                    >
                                                        <Users size={16} />
                                                    </button>

                                                    {/* Edit (Active only) */}
                                                    {!isArchived && (
                                                        <button
                                                            onClick={() => handleOpenEdit(sub)}
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                                                            title="Edit Subscription"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                    )}

                                                    {/* Archive (Billing Admin only, Active only) */}
                                                    {isBillingAdmin && !isArchived && (
                                                        <button
                                                            onClick={() => handleArchive(sub)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                            title="Archive Subscription"
                                                        >
                                                            <Archive size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* Create / Edit Subscription Modal */}
            {/* ============================================================= */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {editingSubscription ? "Edit Subscription" : "Create Subscription"}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {editingSubscription ? "Update customer billing configuration" : "Setup a new recurring customer subscription"}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                        Customer Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.customerName}
                                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                        placeholder="Acme Corp"
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                        Customer Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.customerEmail}
                                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                                        placeholder="billing@acme.com"
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                        Plan Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.planName}
                                        onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                                        placeholder="Enterprise"
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                        Amount *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="1499.00"
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                        Billing Cycle *
                                    </label>
                                    <select
                                        value={formData.billingCycle}
                                        onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                    >
                                        <option value="Monthly">Monthly</option>
                                        <option value="Yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                        Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                        Next Billing Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.nextBillingDate}
                                        onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving && <RefreshCw size={15} className="animate-spin" />}
                                    <span>{editingSubscription ? "Save Changes" : "Create Subscription"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* Collaborators Management Modal (Goal 2 & 5) */}
            {/* ============================================================= */}
            {collabModalSub && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 lg:p-7 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Users size={20} className="text-blue-600" />
                                    <span>Subscription Collaborators</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {collabModalSub.customerName} ({collabModalSub.planName})
                                </p>
                            </div>
                            <button
                                onClick={() => setCollabModalSub(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {collabError && (
                            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                                {collabError}
                            </div>
                        )}

                        {/* Existing Collaborators List */}
                        <div className="mb-5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Current Collaborators ({collaborators.length})
                            </h4>

                            {collabLoading ? (
                                <div className="py-6 text-center text-slate-400 text-xs">
                                    <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-blue-600" />
                                    Loading collaborators...
                                </div>
                            ) : collaborators.length === 0 ? (
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                                    No collaborators added to this subscription yet.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {collaborators.map((c) => (
                                        <div
                                            key={c._id}
                                            className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">
                                                    {c.userId?.name || "User"}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {c.userId?.email || ""} • <span className="font-semibold">{c.userId?.role || "Account Manager"}</span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveCollaborator(c._id)}
                                                disabled={collabActionLoading}
                                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition border border-red-200"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add Collaborator Form */}
                        <form onSubmit={handleAddCollaborator} className="border-t border-slate-100 pt-4 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Add New Collaborator
                            </h4>

                            <div>
                                <label className="block text-xs text-slate-500 mb-1">
                                    Select Known User or Enter User ID:
                                </label>
                                {knownUsers.length > 0 && (
                                    <select
                                        onChange={(e) => setNewCollabUserId(e.target.value)}
                                        className="w-full mb-2 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-800"
                                    >
                                        <option value="">-- Choose from known workspace users --</option>
                                        {knownUsers.map((u) => (
                                            <option key={u._id} value={u._id}>
                                                {u.name} ({u.email} - {u.role})
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <input
                                    type="text"
                                    placeholder="Or paste MongoDB User ID (e.g. 64b8f...)"
                                    value={newCollabUserId}
                                    onChange={(e) => setNewCollabUserId(e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={collabActionLoading || !newCollabUserId.trim()}
                                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {collabActionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                                <span>Assign Collaborator</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Subscriptions;