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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Admin Panel
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Sign in to manage news and categories
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-800 transition-colors duration-300">
          <form className="space-y-6" onSubmit={handleLogin}>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-100 dark:border-red-950/30">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Username/Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Username / Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin or admin@news.com"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-white sm:text-sm transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-white sm:text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-extrabold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer disabled:opacity-50 transition"
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </div>
          </form>

          {/* Seed hint */}
          <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500 leading-normal">
            Note: Logging in with <span className="font-mono bg-gray-50 dark:bg-gray-800 px-1 py-0.5 rounded text-gray-600 dark:text-gray-300">admin</span> / <span className="font-mono bg-gray-50 dark:bg-gray-800 px-1 py-0.5 rounded text-gray-600 dark:text-gray-300">admin123</span> will auto-seed the admin in Firebase Auth if it doesn't exist.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
