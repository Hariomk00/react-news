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
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
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
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-300 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-150 dark:border-gray-800 p-8 md:p-10 animate-fadeIn">
        
        {/* Animated Monkey Container */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-slate-100 dark:bg-gray-850 rounded-full flex items-center justify-center p-2 shadow-inner border border-gray-150 dark:border-gray-700">
            <svg viewBox="0 0 120 120" className="w-full h-full overflow-hidden">
              {/* Ears */}
              <circle cx="25" cy="60" r="12" fill="#8B4513" />
              <circle cx="25" cy="60" r="7" fill="#F5DEB3" />
              <circle cx="95" cy="60" r="12" fill="#8B4513" />
              <circle cx="95" cy="60" r="7" fill="#F5DEB3" />

              {/* Head background */}
              <circle cx="60" cy="60" r="40" fill="#8B4513" />

              {/* Face mask (heartish shape) */}
              <circle cx="46" cy="55" r="16" fill="#F5DEB3" />
              <circle cx="74" cy="55" r="16" fill="#F5DEB3" />
              <ellipse cx="60" cy="72" rx="26" ry="18" fill="#F5DEB3" />

              {/* Eyes */}
              <g>
                {/* Left Eye */}
                <circle cx="46" cy="52" r="5" fill="white" />
                <circle cx="46" cy="52" r="2.5" fill="black" />
                {/* Right Eye */}
                <circle cx="74" cy="52" r="5" fill="white" />
                <circle cx="74" cy="52" r="2.5" fill="black" />
              </g>

              {/* Nose & Mouth */}
              <polygon points="58,63 62,63 60,67" fill="#5C2E0B" />
              <path d="M 52 74 Q 60 80 68 74" stroke="#5C2E0B" strokeWidth="2" fill="none" />

              {/* Cheeks */}
              <circle cx="38" cy="66" r="3" fill="#FFA07A" opacity="0.6" />
              <circle cx="82" cy="66" r="3" fill="#FFA07A" opacity="0.6" />

              {/* Full Arm & Hand Animations */}
              {/* Left Arm */}
              <g className="transition-transform duration-500 ease-out" style={{ transformOrigin: "22px 90px", transform: (isPasswordFocused && !showPassword) ? "rotate(148deg)" : "rotate(0deg)" }}>
                {/* Forearm */}
                <rect x="17" y="90" width="10" height="45" rx="5" fill="#8B4513" />
                {/* Hand / Paws */}
                <circle cx="22" cy="135" r="8" fill="#8B4513" />
                <circle cx="19" cy="139" r="2" fill="#8B4513" />
                <circle cx="22" cy="141" r="2" fill="#8B4513" />
                <circle cx="25" cy="139" r="2" fill="#8B4513" />
              </g>
              {/* Right Arm */}
              <g className="transition-transform duration-500 ease-out" style={{ transformOrigin: "98px 90px", transform: (isPasswordFocused && !showPassword) ? "rotate(-148deg)" : "rotate(0deg)" }}>
                {/* Forearm */}
                <rect x="93" y="90" width="10" height="45" rx="5" fill="#8B4513" />
                {/* Hand / Paws */}
                <circle cx="98" cy="135" r="8" fill="#8B4513" />
                <circle cx="95" cy="139" r="2" fill="#8B4513" />
                <circle cx="98" cy="141" r="2" fill="#8B4513" />
                <circle cx="101" cy="139" r="2" fill="#8B4513" />
              </g>
            </svg>
          </div>
        </div>

        <div className="mb-6 text-center">
          <span className="text-sm font-black tracking-tighter text-red-600 dark:text-red-500 uppercase">
            INDIIANEWS
          </span>
          <h2 className="text-2xl font-extrabold text-gray-950 dark:text-white tracking-tight mt-1">
            LOGIN
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/40 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-955 dark:text-white text-sm transition"
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
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                placeholder="••••••••"
                className="block w-full pl-11 pr-11 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/40 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-955 dark:text-white text-sm transition"
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
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
          Don't have an account?{" "}
          <a href="#" className="text-red-650 dark:text-red-400 font-bold hover:underline transition">
            Sign Up
          </a>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
