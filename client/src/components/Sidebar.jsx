import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Receipt,
    FileText,
    CreditCard,
    Users,
    AlertTriangle,
    LogOut,
    Shield,
    UserCheck,
    X
} from "lucide-react";
import useAuth from "../context/useAuth";

function Sidebar({ mobileOpen = false, onCloseMobile = () => {} }) {
    const navigate = useNavigate();
    const { user, logout, overdueCount, isBillingAdmin } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const links = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: <LayoutDashboard size={20} />
        },
        {
            name: "Subscriptions",
            path: "/subscriptions",
            icon: <Receipt size={20} />
        },
        {
            name: "Invoices",
            path: "/invoices",
            icon: <FileText size={20} />
        },
        {
            name: "Credit Notes",
            path: "/credit-notes",
            icon: <CreditCard size={20} />
        },
        {
            name: "Collaborators",
            path: "/collaborators",
            icon: <Users size={20} />
        },
        {
            name: "Overdue Alerts",
            path: "/overdue-alerts",
            icon: <AlertTriangle size={20} />,
            badge: overdueCount > 0 ? overdueCount : null
        }
    ];

    const sidebarContent = (
        <div className="flex flex-col h-full bg-slate-950 text-white border-r border-slate-800">
            {/* Logo */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                            SubBilling
                            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                SaaS
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400">Subscription & Billing</p>
                    </div>
                </div>

                {/* Close button for mobile drawer */}
                <button
                    onClick={onCloseMobile}
                    className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    aria-label="Close menu"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Role Badge Indicator */}
            <div className="px-6 pt-4 pb-2">
                <div className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2.5">
                    {isBillingAdmin ? (
                        <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                        <UserCheck className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                            Active Role
                        </p>
                        <p className={`text-xs font-bold truncate ${isBillingAdmin ? "text-emerald-400" : "text-sky-400"}`}>
                            {user?.role || "User"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="px-4 py-3 flex-1 overflow-y-auto">
                <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Menu
                </p>

                <nav className="space-y-1">
                    {links.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            onClick={onCloseMobile}
                            className={({ isActive }) =>
                                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/25 font-semibold"
                                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                }`
                            }
                        >
                            <div className="flex items-center gap-3">
                                {link.icon}
                                <span>{link.name}</span>
                            </div>

                            {link.badge ? (
                                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                                    {link.badge}
                                </span>
                            ) : null}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60">
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-white truncate">
                            {user?.name || "User"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                            {user?.email || ""}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-red-500/20 hover:border-red-500/40 border border-slate-800 transition"
                >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Fixed Sidebar */}
            <aside className="hidden lg:flex w-64 min-h-screen flex-col flex-shrink-0">
                {sidebarContent}
            </aside>

            {/* Mobile Drawer Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onCloseMobile}
                />
            )}

            {/* Mobile Sliding Drawer */}
            <div
                className={`fixed top-0 bottom-0 left-0 w-72 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {sidebarContent}
            </div>
        </>
    );
}

export default Sidebar;