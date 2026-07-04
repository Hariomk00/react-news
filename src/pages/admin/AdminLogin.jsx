import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { Eye, EyeOff, Lock, User, AlertCircle } from "lucide-react";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/admin/dashboard");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // If user enters "admin", format it as "admin@news.com"
    let email = username.trim();
    if (!email.includes("@")) {
      email = `${email}@news.com`;
    }

    try {
      // Try standard sign-in
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin/dashboard");
    } catch (err) {
      console.warn("Login failed, checking for seed condition:", err.code);

      // Self-seeding: If user is not found and tries to log in with admin/admin123, register it!
      if (
        (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") &&
        email === "admin@news.com" &&
        password === "admin123"
      ) {
        try {
          setError("Seeding default admin account...");
          await createUserWithEmailAndPassword(auth, email, password);
          navigate("/admin/dashboard");
        } catch (createErr) {
          console.error("Self-seeding registration failed:", createErr);
          setError("Incorrect password or authentication error.");
        }
      } else {
        setError(`Invalid username or password! (Firebase error: ${err.code})`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4 md:p-8 transition-colors duration-300 font-sans">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:h-[600px] animate-fadeIn">
        
        {/* Left Panel: Hero Graphic */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-red-600/10 via-red-500/5 to-slate-100 dark:from-red-950/20 dark:via-red-900/10 dark:to-gray-900 p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter text-red-600 dark:text-red-500">
              INDIIANEWS
            </span>
          </div>
          
          <div className="my-auto py-8 flex justify-center items-center">
            <img 
              src="/login_hero.png" 
              alt="Indiianews Network Illustration" 
              className="max-h-72 w-auto object-contain hover:scale-102 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Professional Portal Admin
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Log in to curate breaking news, organize categories, and manage articles across the entire platform.
            </p>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-gray-900/40">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">
              LOGIN
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              Enter your credentials to access the console
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3.5 rounded-2xl text-xs border border-red-100 dark:border-red-950/30 animate-shake">
                <AlertCircle size={16} />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Email/Username field */}
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Email / Username
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or admin@news.com"
                  className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/40 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-950 dark:text-white text-sm transition"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-11 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/40 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-950 dark:text-white text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-red-500 transition focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Help */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-semibold cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-200 dark:border-gray-700 text-red-650 focus:ring-red-500/25 bg-gray-50 dark:bg-gray-800 w-4 h-4 cursor-pointer"
                />
                Remember me
              </label>
              <a href="#" className="text-red-650 dark:text-red-400 font-bold hover:underline transition">
                Forgot Password?
              </a>
            </div>

            {/* Login button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-extrabold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer disabled:opacity-50 transition transform active:scale-98"
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
            Don't have an account?{" "}
            <a href="#" className="text-red-650 dark:text-red-400 font-bold hover:underline transition">
              Sign Up
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
