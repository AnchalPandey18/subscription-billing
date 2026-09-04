import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, ArrowRight, AlertCircle, Shield, UserCheck } from "lucide-react";
import { loginUser } from "../services/api";
import useAuth from "../context/useAuth";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await loginUser(email, password);
            login(data.token, data.user);
            navigate("/dashboard");
        } catch (err) {
            setError(err.message || "Failed to sign in. Please verify your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 antialiased">
            <div className="w-full max-w-md">
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/20 mb-3 text-white">
                        <FileText size={28} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        SubBilling
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Subscription Billing & Invoicing Engine
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900">
                            Welcome back
                        </h2>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Sign in to access your billing workspace
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5 text-red-700 text-sm">
                            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Password
                                </label>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Sign in</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Role Notice */}
                    <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                            <Shield size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold text-slate-800 block">Billing Admin</span>
                                Lifecycle & bulk actions
                            </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                            <UserCheck size={14} className="text-sky-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold text-slate-800 block">Account Manager</span>
                                Subscriptions & drafts
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-center text-xs text-slate-500">
                        Don't have an account?{" "}
                        <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 underline">
                            Create account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;