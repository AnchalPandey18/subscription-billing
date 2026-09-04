import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Receipt,
    FileText,
    AlertTriangle,
    RefreshCw,
    Plus,
    CreditCard,
    TrendingUp,
    DollarSign,
    PieChart,
    Calendar,
    ChevronRight,
    Shield
} from "lucide-react";
import { getSubscriptions, getInvoices, getOverdueInvoices } from "../services/api";
import useAuth from "../context/useAuth";
import { formatCurrency, parseAmount } from "../utils/formatters";

function Dashboard() {
    const navigate = useNavigate();
    const { user, isBillingAdmin } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [subscriptions, setSubscriptions] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [overdueInvoices, setOverdueInvoices] = useState([]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError("");

            const [subsRes, invRes, overdueRes] = await Promise.all([
                getSubscriptions(),
                getInvoices("limit=100"),
                getOverdueInvoices()
            ]);

            setSubscriptions(subsRes.subscriptions || []);
            setInvoices(invRes.invoices || []);
            setOverdueInvoices(overdueRes.overdueInvoices || []);
        } catch (err) {
            console.error("Error loading dashboard data:", err);
            setError(err.message || "Failed to load dashboard metrics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadDashboardData();
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    // =========================================================================
    // Assessment Goal 8 Calculations
    // =========================================================================
    const metrics = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // 1. Invoices issued this month (status "Issued" or "Paid" issued this month)
        const issuedThisMonth = invoices.filter((inv) => {
            if (!inv.issueDate) return false;
            const d = new Date(inv.issueDate);
            return (
                d.getFullYear() === currentYear &&
                d.getMonth() === currentMonth &&
                (inv.status === "Issued" || inv.status === "Paid")
            );
        });

        const issuedThisMonthAmount = issuedThisMonth.reduce(
            (acc, inv) => acc + parseAmount(inv.amount),
            0
        );

        // 2. Revenue collected this month (Paid invoices where paidAt or issueDate is in current month)
        const paidThisMonth = invoices.filter((inv) => {
            if (inv.status !== "Paid") return false;
            const d = inv.paidAt ? new Date(inv.paidAt) : new Date(inv.issueDate);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        });

        const revenueCollectedThisMonth = paidThisMonth.reduce(
            (acc, inv) => acc + parseAmount(inv.amount),
            0
        );

        // 3. Receivables (total unpaid outstanding invoices currently in 'Issued' status)
        const receivableInvoices = invoices.filter((inv) => inv.status === "Issued");
        const totalReceivables = receivableInvoices.reduce(
            (acc, inv) => acc + parseAmount(inv.amount),
            0
        );

        // 4. Overdue invoices
        const overdueCount = overdueInvoices.length;
        const totalOverdueAmount = overdueInvoices.reduce(
            (acc, inv) => acc + parseAmount(inv.amount),
            0
        );

        // 5. Status breakdown
        const totalInvoicesCount = invoices.length;
        const statusCounts = {
            Draft: 0,
            Issued: 0,
            Paid: 0,
            Void: 0
        };

        invoices.forEach((inv) => {
            if (statusCounts[inv.status] !== undefined) {
                statusCounts[inv.status] += 1;
            }
        });

        // 6. Plan breakdown (from Active subscriptions)
        const activeSubscriptions = subscriptions.filter((s) => s.status === "Active");
        const planMap = {};

        activeSubscriptions.forEach((sub) => {
            const plan = sub.planName || "Standard";
            if (!planMap[plan]) {
                planMap[plan] = { name: plan, count: 0, totalAmount: 0 };
            }
            planMap[plan].count += 1;
            planMap[plan].totalAmount += parseAmount(sub.amount);
        });

        const planBreakdown = Object.values(planMap).sort((a, b) => b.count - a.count);

        // 7. Revenue per week for last 8 weeks
        // Build 8 weekly intervals ending today
        const eightWeeks = [];
        for (let i = 7; i >= 0; i--) {
            const end = new Date(now);
            end.setDate(now.getDate() - i * 7);
            end.setHours(23, 59, 59, 999);

            const start = new Date(end);
            start.setDate(end.getDate() - 6);
            start.setHours(0, 0, 0, 0);

            const label = `Wk ${8 - i}`;
            const dateRangeStr = `${start.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`;

            // Sum paid invoices within this window
            const weekRevenue = invoices.reduce((sum, inv) => {
                if (inv.status !== "Paid") return sum;
                const paidDate = new Date(inv.paidAt || inv.updatedAt || inv.issueDate);
                if (paidDate >= start && paidDate <= end) {
                    return sum + parseAmount(inv.amount);
                }
                return sum;
            }, 0);

            eightWeeks.push({
                index: 8 - i,
                label,
                dateRangeStr,
                revenue: weekRevenue
            });
        }

        const maxWeeklyRevenue = Math.max(...eightWeeks.map((w) => w.revenue), 1);

        return {
            issuedThisMonthCount: issuedThisMonth.length,
            issuedThisMonthAmount,
            revenueCollectedThisMonth,
            totalReceivables,
            receivableCount: receivableInvoices.length,
            overdueCount,
            totalOverdueAmount,
            totalInvoicesCount,
            statusCounts,
            planBreakdown,
            activeSubscriptionsCount: activeSubscriptions.length,
            eightWeeks,
            maxWeeklyRevenue
        };
    }, [invoices, subscriptions, overdueInvoices]);

    return (
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
            {/* Top Workspace Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        <span>Workspace Overview</span>
                        <span>•</span>
                        <span className="text-blue-600 font-semibold">{user?.role}</span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                        Billing & Revenue Analytics
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Real-time financial performance and subscription telemetry
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadDashboardData}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm transition disabled:opacity-50"
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin text-blue-600" : ""} />
                        <span>Refresh Data</span>
                    </button>

                    <button
                        onClick={() => navigate("/subscriptions")}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition"
                    >
                        <Plus size={16} />
                        <span>New Subscription</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center justify-between text-red-700 text-sm">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={18} />
                        <span>{error}</span>
                    </div>
                    <button onClick={loadDashboardData} className="font-semibold underline">
                        Try Again
                    </button>
                </div>
            )}

            {/* Overdue Urgent Alert Banner */}
            {metrics.overdueCount > 0 && (
                <div className="rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white p-5 shadow-lg shadow-red-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">
                                {metrics.overdueCount} Overdue {metrics.overdueCount === 1 ? "Invoice" : "Invoices"} Require Attention
                            </h3>
                            <p className="text-red-100 text-xs mt-0.5">
                                Total outstanding past due: <strong className="text-white">{formatCurrency(metrics.totalOverdueAmount)}</strong>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate("/overdue-alerts")}
                        className="px-4 py-2 rounded-xl bg-white text-red-700 font-bold text-xs hover:bg-red-50 transition shadow-sm flex items-center gap-1.5"
                    >
                        <span>Review Overdue Invoices</span>
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}

            {/* 4 Core Goal 8 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Invoices Issued This Month */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Issued This Month
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <FileText size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl lg:text-3xl font-black text-slate-900">
                            {metrics.issuedThisMonthCount}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <span>Billed value:</span>
                            <strong className="text-slate-700">{formatCurrency(metrics.issuedThisMonthAmount)}</strong>
                        </p>
                    </div>
                </div>

                {/* 2. Revenue Collected This Month */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Collected This Month
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <TrendingUp size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl lg:text-3xl font-black text-emerald-600">
                            {formatCurrency(metrics.revenueCollectedThisMonth)}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Paid invoices in current calendar cycle
                        </p>
                    </div>
                </div>

                {/* 3. Receivables (Outstanding Issued) */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Total Receivables
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <DollarSign size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl lg:text-3xl font-black text-amber-600">
                            {formatCurrency(metrics.totalReceivables)}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <span>Awaiting payment across</span>
                            <strong className="text-slate-700">{metrics.receivableCount} invoices</strong>
                        </p>
                    </div>
                </div>

                {/* 4. Overdue Invoices */}
                <div className={`bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition ${
                    metrics.overdueCount > 0 ? "border-red-200 bg-red-50/20" : "border-slate-200/80"
                }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Overdue Invoices
                        </span>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            metrics.overdueCount > 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                        }`}>
                            <AlertTriangle size={18} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className={`text-2xl lg:text-3xl font-black ${
                            metrics.overdueCount > 0 ? "text-red-600" : "text-slate-900"
                        }`}>
                            {metrics.overdueCount}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <span>Amount:</span>
                            <strong className="text-red-700">{formatCurrency(metrics.totalOverdueAmount)}</strong>
                        </p>
                    </div>
                </div>
            </div>

            {/* Goal 8: Revenue per Week for Last 8 Weeks (Bar Chart) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 lg:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Calendar size={19} className="text-blue-600" />
                            <span>Revenue Per Week (Last 8 Weeks)</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Weekly cash collections based on verified paid invoice receipts
                        </p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                        Trailing 56 Days
                    </span>
                </div>

                {/* Bar Chart Visualizer */}
                <div className="pt-6 pb-2">
                    <div className="grid grid-cols-8 gap-2 sm:gap-4 items-end h-56 border-b border-slate-200">
                        {metrics.eightWeeks.map((wk) => {
                            const heightPct = metrics.maxWeeklyRevenue > 0
                                ? Math.round((wk.revenue / metrics.maxWeeklyRevenue) * 100)
                                : 0;
                            const isHighest = wk.revenue > 0 && wk.revenue === metrics.maxWeeklyRevenue;

                            return (
                                <div key={wk.label} className="flex flex-col items-center h-full justify-end group">
                                    {/* Tooltip / Amount Label on Hover */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-[10px] font-bold text-slate-700 bg-slate-900 text-white px-2 py-1 rounded shadow-md whitespace-nowrap pointer-events-none">
                                        {formatCurrency(wk.revenue)}
                                    </div>

                                    {/* Bar Pillar */}
                                    <div className="w-full max-w-[48px] bg-slate-100 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-full">
                                        <div
                                            style={{ height: `${Math.max(heightPct, 4)}%` }}
                                            className={`w-full rounded-t-lg transition-all duration-500 ${
                                                isHighest
                                                    ? "bg-gradient-to-t from-blue-700 to-blue-500"
                                                    : wk.revenue > 0
                                                    ? "bg-gradient-to-t from-indigo-600 to-blue-400"
                                                    : "bg-slate-200"
                                            }`}
                                        />
                                    </div>

                                    {/* Week label */}
                                    <div className="mt-3 text-center">
                                        <p className="text-xs font-bold text-slate-700">{wk.label}</p>
                                        <p className="text-[10px] text-slate-400 hidden sm:block truncate max-w-[80px]">
                                            {formatCurrency(wk.revenue)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Goal 8: Status Breakdown & Plan Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 5. Invoice Status Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 lg:p-7 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <PieChart size={18} className="text-indigo-600" />
                                <span>Invoice Status Breakdown</span>
                            </h2>
                            <span className="text-xs font-semibold text-slate-500">
                                {metrics.totalInvoicesCount} total invoices
                            </span>
                        </div>

                        {metrics.totalInvoicesCount === 0 ? (
                            <div className="py-8 text-center text-slate-400 text-sm">
                                No invoices generated yet.
                            </div>
                        ) : (
                            <div className="space-y-4 pt-2">
                                {/* Visual Segmented Bar */}
                                <div className="h-4 rounded-full overflow-hidden flex bg-slate-100">
                                    {metrics.statusCounts.Paid > 0 && (
                                        <div
                                            style={{ width: `${(metrics.statusCounts.Paid / metrics.totalInvoicesCount) * 100}%` }}
                                            className="bg-emerald-500 transition-all"
                                            title={`Paid: ${metrics.statusCounts.Paid}`}
                                        />
                                    )}
                                    {metrics.statusCounts.Issued > 0 && (
                                        <div
                                            style={{ width: `${(metrics.statusCounts.Issued / metrics.totalInvoicesCount) * 100}%` }}
                                            className="bg-blue-500 transition-all"
                                            title={`Issued: ${metrics.statusCounts.Issued}`}
                                        />
                                    )}
                                    {metrics.statusCounts.Draft > 0 && (
                                        <div
                                            style={{ width: `${(metrics.statusCounts.Draft / metrics.totalInvoicesCount) * 100}%` }}
                                            className="bg-slate-400 transition-all"
                                            title={`Draft: ${metrics.statusCounts.Draft}`}
                                        />
                                    )}
                                    {metrics.statusCounts.Void > 0 && (
                                        <div
                                            style={{ width: `${(metrics.statusCounts.Void / metrics.totalInvoicesCount) * 100}%` }}
                                            className="bg-rose-500 transition-all"
                                            title={`Void: ${metrics.statusCounts.Void}`}
                                        />
                                    )}
                                </div>

                                {/* Status Legend Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span>Paid</span>
                                        </div>
                                        <div className="text-xl font-black text-emerald-700 mt-1">
                                            {metrics.statusCounts.Paid}
                                        </div>
                                        <div className="text-[11px] text-emerald-600 font-semibold">
                                            {metrics.totalInvoicesCount > 0 ? Math.round((metrics.statusCounts.Paid / metrics.totalInvoicesCount) * 100) : 0}%
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span>Issued</span>
                                        </div>
                                        <div className="text-xl font-black text-blue-700 mt-1">
                                            {metrics.statusCounts.Issued}
                                        </div>
                                        <div className="text-[11px] text-blue-600 font-semibold">
                                            {metrics.totalInvoicesCount > 0 ? Math.round((metrics.statusCounts.Issued / metrics.totalInvoicesCount) * 100) : 0}%
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                            <div className="w-2 h-2 rounded-full bg-slate-400" />
                                            <span>Draft</span>
                                        </div>
                                        <div className="text-xl font-black text-slate-800 mt-1">
                                            {metrics.statusCounts.Draft}
                                        </div>
                                        <div className="text-[11px] text-slate-500 font-semibold">
                                            {metrics.totalInvoicesCount > 0 ? Math.round((metrics.statusCounts.Draft / metrics.totalInvoicesCount) * 100) : 0}%
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                                            <span>Void</span>
                                        </div>
                                        <div className="text-xl font-black text-rose-700 mt-1">
                                            {metrics.statusCounts.Void}
                                        </div>
                                        <div className="text-[11px] text-rose-600 font-semibold">
                                            {metrics.totalInvoicesCount > 0 ? Math.round((metrics.statusCounts.Void / metrics.totalInvoicesCount) * 100) : 0}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <button
                            onClick={() => navigate("/invoices")}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            <span>Manage full invoice registry</span>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

                {/* 6. Plan Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 lg:p-7 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Receipt size={18} className="text-blue-600" />
                                <span>Active Plan Breakdown</span>
                            </h2>
                            <span className="text-xs font-semibold text-slate-500">
                                {metrics.activeSubscriptionsCount} active plans
                            </span>
                        </div>

                        {metrics.planBreakdown.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 text-sm">
                                No active subscriptions to display.
                            </div>
                        ) : (
                            <div className="space-y-3 pt-1">
                                {metrics.planBreakdown.map((plan) => {
                                    const sharePct = metrics.activeSubscriptionsCount > 0
                                        ? Math.round((plan.count / metrics.activeSubscriptionsCount) * 100)
                                        : 0;

                                    return (
                                        <div key={plan.name} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-bold text-slate-800">{plan.name}</span>
                                                <span className="font-semibold text-slate-900">
                                                    {formatCurrency(plan.totalAmount)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-slate-500 mt-1 mb-2">
                                                <span>{plan.count} subscribers</span>
                                                <span>{sharePct}% of active base</span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                                <div
                                                    style={{ width: `${sharePct}%` }}
                                                    className="h-full bg-blue-600 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <button
                            onClick={() => navigate("/subscriptions")}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            <span>Manage all subscriptions</span>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Action Hub */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 lg:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold tracking-tight">
                            Billing Operations Hub
                        </h3>
                        <p className="text-slate-400 text-xs mt-0.5">
                            Direct role-aware shortcuts to essential workflow procedures
                        </p>
                    </div>
                    {isBillingAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Shield size={13} />
                            Billing Admin Elevated Access
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                            Account Manager Access
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => navigate("/subscriptions")}
                        className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition text-left group"
                    >
                        <Receipt size={20} className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                        <h4 className="font-bold text-sm text-white">Subscriptions</h4>
                        <p className="text-xs text-slate-400 mt-1">Create, edit and manage customer billing plans</p>
                    </button>

                    <button
                        onClick={() => navigate("/invoices")}
                        className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition text-left group"
                    >
                        <FileText size={20} className="text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                        <h4 className="font-bold text-sm text-white">Invoices Registry</h4>
                        <p className="text-xs text-slate-400 mt-1">Search, filter, issue, pay and export invoices</p>
                    </button>

                    <button
                        onClick={() => navigate("/credit-notes")}
                        className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition text-left group"
                    >
                        <CreditCard size={20} className="text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                        <h4 className="font-bold text-sm text-white">Credit Notes</h4>
                        <p className="text-xs text-slate-400 mt-1">Issue validated refunds against paid invoices</p>
                    </button>

                    <button
                        onClick={() => navigate("/overdue-alerts")}
                        className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition text-left group"
                    >
                        <AlertTriangle size={20} className="text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
                        <h4 className="font-bold text-sm text-white">Overdue Alerts</h4>
                        <p className="text-xs text-slate-400 mt-1">Review and acknowledge overdue payment notices</p>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;