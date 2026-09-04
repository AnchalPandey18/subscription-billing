import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { registerUser } from "../services/api";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);

        try {
            const data = await registerUser(formData);
            setMessage(data.message || "Registration successful! You can now log in.");
            setFormData({
                name: "",
                email: "",
                password: ""
            });
            setTimeout(() => {
                navigate("/login");
            }, 1800);
        } catch (err) {
            setError(err.message || "Registration failed. Please try again.");
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

                {/* Register Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900">
                            Create Account
                        </h2>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Registers as an Account Manager in the workspace
                        </p>
                    </div>

                    {message && (
                        <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-2.5 text-emerald-800 text-sm">
                            <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">{message}</p>
                                <p className="text-xs text-emerald-600 mt-0.5">Redirecting to sign in...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5 text-red-700 text-sm">
                            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Jane Doe"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="jane@company.com"
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
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
                                    <span>Register Account</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-slate-500">
                        Already have an account?{" "}
                        <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 underline">
                            Sign in here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;