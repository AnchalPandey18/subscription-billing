import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    ArrowRight,
    CheckCircle2,
    CircleDollarSign,
    FileText,
    Plus,
    RefreshCw,
    Receipt,
    AlertTriangle,
    CreditCard
} from "lucide-react";

import Sidebar from "../components/Sidebar";

import {
    getSubscriptions,
    getInvoices,
    getOverdueInvoices
} from "../services/api";


function Dashboard() {
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));

    const [stats, setStats] = useState({
        subscriptions: 0,
        invoices: 0,
        paidInvoices: 0,
        overdueInvoices: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // Load dashboard data
    const loadDashboard = async () => {
        try {
            setError("");

            const [
                subscriptionsData,
                invoicesData,
                overdueData
            ] = await Promise.all([
                getSubscriptions(),
                getInvoices("limit=100"),
                getOverdueInvoices()
            ]);


            const subscriptions =
                subscriptionsData.subscriptions ||
                subscriptionsData ||
                [];


            const invoices =
                invoicesData.invoices ||
                [];


            const overdueInvoices =
                overdueData.invoices ||
                overdueData ||
                [];


            setStats({
                subscriptions: subscriptions.filter(
                    (item) => item.status === "Active"
                ).length,

                invoices:
                    invoicesData.pagination?.total ??
                    invoices.length,

                paidInvoices:
                    invoices.filter(
                        (invoice) => invoice.status === "Paid"
                    ).length,

                overdueInvoices:
                    overdueInvoices.length
            });

        } catch (error) {
            console.error(error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };


    // Load dashboard after component is mounted
    useEffect(() => {
        const timer = setTimeout(() => {
            loadDashboard();
        }, 0);

        return () => clearTimeout(timer);
    }, []);


    return (
        <div className="min-h-screen bg-[#f7f8fc] flex">

            {/* Sidebar */}
            <Sidebar />


            <main className="flex-1 min-w-0">

                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10">

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Workspace
                        </p>

                        <h1 className="text-xl font-bold text-slate-900 mt-1">
                            Dashboard
                        </h1>
                    </div>


                    <div className="flex items-center gap-4">

                        <button
                            onClick={async () => {
                                setLoading(true);
                                await loadDashboard();
                            }}
                            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
                            title="Refresh"
                        >
                            <RefreshCw
                                size={18}
                                className={
                                    loading
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                        </button>


                        <div className="h-8 w-px bg-slate-200" />


                        <div className="text-right hidden sm:block">

                            <p className="text-sm font-semibold text-slate-900">
                                {user?.name}
                            </p>

                            <p className="text-xs text-slate-500 mt-0.5">
                                {user?.role}
                            </p>

                        </div>


                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-semibold">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>

                    </div>

                </header>


                {/* Main Content */}
                <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">


                    {/* Welcome */}
                    <section className="mb-8">

                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">

                            <div>

                                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                                    Good to see you,{" "}
                                    {user?.name?.split(" ")[0] || "there"}.
                                </h2>

                                <p className="text-slate-500 mt-2">
                                    Here's an overview of your billing activity.
                                </p>

                            </div>


                            <button
                                onClick={() =>
                                    navigate("/subscriptions")
                                }
                                className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
                            >
                                <Plus size={17} />
                                New Subscription
                            </button>

                        </div>

                    </section>


                    {/* Error */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}


                    {/* Statistics */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

                        <StatCard
                            title="Active Subscriptions"
                            value={stats.subscriptions}
                            description="Currently active plans"
                            icon={<Receipt size={20} />}
                            iconClass="bg-blue-50 text-blue-600"
                            loading={loading}
                        />


                        <StatCard
                            title="Total Invoices"
                            value={stats.invoices}
                            description="Invoices generated"
                            icon={<FileText size={20} />}
                            iconClass="bg-violet-50 text-violet-600"
                            loading={loading}
                        />


                        <StatCard
                            title="Paid Invoices"
                            value={stats.paidInvoices}
                            description="Successfully collected"
                            icon={<CheckCircle2 size={20} />}
                            iconClass="bg-emerald-50 text-emerald-600"
                            loading={loading}
                        />


                        <StatCard
                            title="Overdue"
                            value={stats.overdueInvoices}
                            description="Need your attention"
                            icon={<AlertTriangle size={20} />}
                            iconClass="bg-red-50 text-red-600"
                            loading={loading}
                            danger={stats.overdueInvoices > 0}
                        />

                    </section>


                    {/* Quick Actions */}
                    <section className="mt-6">

                        <div className="bg-white border border-slate-200 rounded-2xl">


                            <div className="px-6 py-5 border-b border-slate-100">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <h3 className="text-lg font-bold text-slate-900">
                                            Quick Actions
                                        </h3>

                                        <p className="text-sm text-slate-500 mt-1">
                                            Jump directly to common billing tasks.
                                        </p>

                                    </div>


                                    <CircleDollarSign
                                        size={22}
                                        className="text-slate-300"
                                    />

                                </div>

                            </div>


                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">

                                <ActionCard
                                    icon={<Plus size={20} />}
                                    title="Create Subscription"
                                    description="Add a new customer plan"
                                    onClick={() =>
                                        navigate("/subscriptions")
                                    }
                                />


                                <ActionCard
                                    icon={<FileText size={20} />}
                                    title="Manage Invoices"
                                    description="View and manage invoices"
                                    onClick={() =>
                                        navigate("/invoices")
                                    }
                                />


                                <ActionCard
                                    icon={<AlertTriangle size={20} />}
                                    title="Review Overdue"
                                    description="Check outstanding payments"
                                    onClick={() =>
                                        navigate("/overdue-alerts")
                                    }
                                />

                            </div>

                        </div>

                    </section>


                    {/* Bottom Information */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">


                        {/* Billing Management */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6">

                            <div className="flex items-center gap-3">

                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <CreditCard size={19} />
                                </div>


                                <div>

                                    <h3 className="font-semibold text-slate-900">
                                        Billing management
                                    </h3>

                                    <p className="text-sm text-slate-500 mt-0.5">
                                        Keep subscriptions and invoices organized.
                                    </p>

                                </div>

                            </div>


                            <button
                                onClick={() =>
                                    navigate("/subscriptions")
                                }
                                className="mt-5 text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                            >
                                View subscriptions
                                <ArrowRight size={15} />
                            </button>

                        </div>


                        {/* Payment Tracking */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6">

                            <div className="flex items-center gap-3">

                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <CheckCircle2 size={19} />
                                </div>


                                <div>

                                    <h3 className="font-semibold text-slate-900">
                                        Payment tracking
                                    </h3>

                                    <p className="text-sm text-slate-500 mt-0.5">
                                        Monitor paid and outstanding invoices.
                                    </p>

                                </div>

                            </div>


                            <button
                                onClick={() =>
                                    navigate("/invoices")
                                }
                                className="mt-5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
                            >
                                View invoices
                                <ArrowRight size={15} />
                            </button>

                        </div>

                    </section>

                </div>

            </main>

        </div>
    );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
    title,
    value,
    description,
    icon,
    iconClass,
    loading,
    danger
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-sm transition">

            <div className="flex items-start justify-between">

                <div>

                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>


                    <div className="mt-3">

                        {loading ? (

                            <div className="w-12 h-9 bg-slate-100 rounded-lg animate-pulse" />

                        ) : (

                            <p
                                className={`text-3xl font-bold tracking-tight ${
                                    danger
                                        ? "text-red-600"
                                        : "text-slate-900"
                                }`}
                            >
                                {value}
                            </p>

                        )}

                    </div>

                </div>


                <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconClass}`}
                >
                    {icon}
                </div>

            </div>


            <p className="text-xs text-slate-400 mt-5">
                {description}
            </p>

        </div>
    );
}


/* =========================================================
   ACTION CARD
========================================================= */

function ActionCard({
    icon,
    title,
    description,
    onClick
}) {
    return (
        <button
            onClick={onClick}
            className="text-left p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5 transition-all group"
        >

            <div className="flex items-center justify-between">

                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                    {icon}
                </div>


                <ArrowRight
                    size={17}
                    className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition"
                />

            </div>


            <h4 className="font-semibold text-slate-900 mt-5">
                {title}
            </h4>


            <p className="text-xs text-slate-500 mt-1">
                {description}
            </p>

        </button>
    );
}


export default Dashboard;