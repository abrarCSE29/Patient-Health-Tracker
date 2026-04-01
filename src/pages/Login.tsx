import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "motion/react";
import { Heart, Mail, Lock, ArrowRight, ShieldCheck, Activity, UserRound } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = (location.state as any)?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "register") {
        if (!name.trim()) {
          throw new Error("Name is required.");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        await register({ name, email, password });
      } else {
        await login({ email, password });
      }

      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((current) => (current === "login" ? "register" : "login"));
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-indigo-50/40 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-2xl mb-6 shadow-xl shadow-indigo-200">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-slate-500 font-medium">
            {mode === "login" ? "Your health journey continues here." : "Create your secure health tracker account."}
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-200 shadow-xl shadow-neutral-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {error}
              </div>
            )}

            {mode === "register" && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input 
                    type="text" 
                    required
                    placeholder="Your full name" 
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 transition-all font-medium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input 
                  type="email" 
                  required
                  placeholder="name@example.com" 
                  className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Password</label>
                {mode === "login" && <button type="button" className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:underline">Forgot?</button>}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••" 
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 transition-all font-medium"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-black text-sm rounded-2xl hover:from-indigo-600 hover:to-violet-600 transition-all shadow-xl shadow-indigo-200 uppercase tracking-widest flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-neutral-100 text-center">
            <p className="text-sm text-neutral-500 font-medium">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button type="button" onClick={toggleMode} className="text-indigo-600 font-black hover:underline">
                {mode === "login" ? "Create Account" : "Sign In"}
              </button>
            </p>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 opacity-40">
        </div>
      </motion.div>
    </div>
  );
}
