import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Bell } from "lucide-react";
import Sidebar from "./Sidebar";
import useAuth from "../context/useAuth";

function Layout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { overdueCount } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row antialiased text-slate-800">
            {/* Mobile Top Header */}
            <div className="lg:hidden bg-slate-950 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                        aria-label="Open menu"
                    >
                        <Menu size={22} />
                    </button>
                    <span className="font-bold text-base tracking-tight">SubBilling</span>
                </div>

                <div className="flex items-center gap-2">
                    {overdueCount > 0 && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                            <Bell size={12} className="animate-pulse" />
                            {overdueCount} overdue
                        </span>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <Sidebar
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-hidden">
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;
