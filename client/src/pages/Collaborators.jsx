import { useState, useEffect, useMemo } from "react";
import {
    Users,
    UserPlus,
    Trash2,
    RefreshCw,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import {
    getSubscriptions,
    getCollaborators,
    addCollaborator,
    removeCollaborator
} from "../services/api";
import useAuth from "../context/useAuth";
import { formatDate } from "../utils/formatters";

function Collaborators() {
    const { user } = useAuth();

    const [subscriptions, setSubscriptions] = useState([]);
    const [selectedSubscriptionId, setSelectedSubscriptionId] = useState("");
    const [collaborators, setCollaborators] = useState([]);

    const [loadingSubs, setLoadingSubs] = useState(true);
    const [loadingCollabs, setLoadingCollabs] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [userIdInput, setUserIdInput] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Load all active subscriptions
    const loadSubscriptions = async () => {
        try {
            setLoadingSubs(true);
            setErrorMessage("");
            const data = await getSubscriptions();
            const list = (data.subscriptions || []).filter((s) => s.status !== "Archived");
            setSubscriptions(list);
            if (list.length > 0 && !selectedSubscriptionId) {
                setSelectedSubscriptionId(list[0]._id);
            }
        } catch (err) {
            console.error("Failed to load subscriptions:", err);
            setErrorMessage(err.message || "Failed to fetch subscriptions");
        } finally {
            setLoadingSubs(false);
        }
    };

    // Load collaborators for selected subscription
    const loadCollaboratorsForSub = async (subId) => {
        if (!subId) return;
        try {
            setLoadingCollabs(true);
            setErrorMessage("");
            const data = await getCollaborators(subId);
            setCollaborators(data.collaborators || []);
        } catch (err) {
            console.error("Failed to load collaborators:", err);
            setErrorMessage(err.message || "Failed to load collaborators");
        } finally {
            setLoadingCollabs(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadSubscriptions();
        }, 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let timer;
        if (selectedSubscriptionId) {
            timer = setTimeout(() => {
                loadCollaboratorsForSub(selectedSubscriptionId);
            }, 0);
        }
        return () => clearTimeout(timer);
    }, [selectedSubscriptionId]);

    // Known users extracted from createdBy
    const knownUsers = useMemo(() => {
        const map = {};
        subscriptions.forEach((s) => {
            if (s.createdBy?._id) {
                map[s.createdBy._id] = s.createdBy;
            }
        });
        return Object.values(map);
    }, [subscriptions]);

    const handleAddCollaborator = async (e) => {
        e.preventDefault();
        setSuccessMessage("");
        setErrorMessage("");

        if (!selectedSubscriptionId || !userIdInput.trim()) {
            setErrorMessage("Please select a subscription and provide a User ID.");
            return;
        }

        setSubmitting(true);

        try {
            const res = await addCollaborator({
                subscriptionId: selectedSubscriptionId,
                userId: userIdInput.trim()
            });

            setSuccessMessage(res.message || "Collaborator added successfully!");
            setUserIdInput("");
            await loadCollaboratorsForSub(selectedSubscriptionId);
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            setErrorMessage(err.message || "Failed to add collaborator");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemove = async (collabId, userName) => {
        const confirmed = window.confirm(
            `Remove ${userName || "this user"} from subscription collaborators?`
        );
        if (!confirmed) return;

        try {
            setSubmitting(true);
            await removeCollaborator(collabId);
            setSuccessMessage("Collaborator removed successfully.");
            await loadCollaboratorsForSub(selectedSubscriptionId);
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            setErrorMessage(err.message || "Failed to remove collaborator");
        } finally {
            setSubmitting(false);
        }
    };

    const currentSubscription = subscriptions.find((s) => s._id === selectedSubscriptionId);

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        <span>Access & Team Sharing</span>
                        <span>•</span>
                        <span className="text-blue-600 font-semibold">{user?.role}</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Users className="text-blue-600" />
                        <span>Subscription Collaborators</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Assign team members to collaborate on customer accounts, monitor billing and manage invoices
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            loadSubscriptions();
                            if (selectedSubscriptionId) loadCollaboratorsForSub(selectedSubscriptionId);
                        }}
                        disabled={loadingSubs || loadingCollabs}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
                    >
                        <RefreshCw size={14} className={loadingSubs || loadingCollabs ? "animate-spin text-blue-600" : ""} />
                        <span>Refresh List</span>
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Subscription Selector & Add Collaborator Form */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Subscription Picker Card */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                            Select Subscription Plan
                        </label>

                        {loadingSubs ? (
                            <div className="p-3 text-xs text-slate-400">Loading subscriptions...</div>
                        ) : subscriptions.length === 0 ? (
                            <div className="p-3 text-xs text-slate-500 bg-slate-50 rounded-xl">
                                No active subscriptions available. Create a subscription first.
                            </div>
                        ) : (
                            <select
                                value={selectedSubscriptionId}
                                onChange={(e) => setSelectedSubscriptionId(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                {subscriptions.map((sub) => (
                                    <option key={sub._id} value={sub._id}>
                                        {sub.customerName} — {sub.planName}
                                    </option>
                                ))}
                            </select>
                        )}

                        {currentSubscription && (
                            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Customer:</span>
                                    <span className="font-bold text-slate-800">{currentSubscription.customerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Email:</span>
                                    <span className="text-slate-700">{currentSubscription.customerEmail}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Owner:</span>
                                    <span className="font-semibold text-blue-700">
                                        {currentSubscription.createdBy?.name || "System"} ({currentSubscription.createdBy?.role || "Staff"})
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Add Collaborator Card */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                            <UserPlus size={18} className="text-blue-600" />
                            <h2 className="text-base font-bold text-slate-900">
                                Add Collaborator
                            </h2>
                        </div>

                        <form onSubmit={handleAddCollaborator} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    Quick Select Known User:
                                </label>
                                {knownUsers.length > 0 && (
                                    <select
                                        onChange={(e) => setUserIdInput(e.target.value)}
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

                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                    User ID (MongoDB ObjectID) *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter or paste user ID..."
                                    value={userIdInput}
                                    onChange={(e) => setUserIdInput(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Enter the MongoDB ID of an active registered user to grant collaborator rights.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !selectedSubscriptionId || !userIdInput.trim()}
                                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={15} />}
                                <span>Add Collaborator</span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Collaborator List for Selected Subscription */}
                <div className="lg:col-span-7 bg-white rounded-2xl p-6 lg:p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Users size={18} className="text-indigo-600" />
                                <span>Collaborators for {currentSubscription?.customerName || "Selected Plan"}</span>
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                                {collaborators.length} active
                            </span>
                        </div>

                        {loadingCollabs ? (
                            <div className="py-16 text-center text-slate-400 text-sm">
                                <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                                <p>Loading collaborators...</p>
                            </div>
                        ) : collaborators.length === 0 ? (
                            <div className="py-16 text-center text-slate-400 text-sm">
                                <Users size={36} className="text-slate-300 mx-auto mb-2" />
                                <p className="font-semibold text-slate-700">No collaborators added yet</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                                    Collaborators assigned to this subscription can view and manage this customer's billing.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {collaborators.map((c) => (
                                    <div
                                        key={c._id}
                                        className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                                                {c.userId?.name?.charAt(0)?.toUpperCase() || "U"}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm">
                                                    {c.userId?.name || "Unknown User"}
                                                </div>
                                                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                    <span>{c.userId?.email}</span>
                                                    <span>•</span>
                                                    <span className="font-semibold text-blue-600">
                                                        {c.userId?.role || "Account Manager"}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-1">
                                                    Added {formatDate(c.createdAt)} by {c.addedBy?.name || "Staff"}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleRemove(c._id, c.userId?.name)}
                                            disabled={submitting}
                                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition border border-transparent hover:border-red-200"
                                            title="Remove collaborator"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 mt-6 border-t border-slate-100 text-xs text-slate-400">
                        Collaborators receive co-ownership visibility over this subscription across the billing workspace.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Collaborators;
