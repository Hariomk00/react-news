import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import { Search, Moon, Sun } from "lucide-react";
import SearchModal from "./SearchModal";

const Header = () => {
  const [categories, setCategories] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [clickTimes, setClickTimes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogoClick = (e) => {
    const now = Date.now();
    const recentClicks = [...clickTimes, now].filter((t) => now - t < 1500);

    if (recentClicks.length >= 3) {
      e.preventDefault();
      setClickTimes([]);
      if (currentUser) {
        navigate("/admin/dashboard");
      } else {
        navigate("/admin/login");
      }
    } else {
      setClickTimes(recentClicks);
    }
  };

  useEffect(() => {
    // Load categories
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, "categories"), where("status", "==", true));
        const querySnapshot = await getDocs(q);
        const cats = [];
        querySnapshot.forEach((doc) => {
          cats.push({ id: doc.id, ...doc.data() });
        });
        setCategories(cats);
      } catch (error) {
        console.error("Error fetching categories for header:", error);
      }
    };
    fetchCategories();

    // Check existing dark mode setting
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }

    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" onClick={handleLogoClick} className="text-2xl font-black tracking-tighter text-red-600 dark:text-red-500 hover:opacity-90">
            NEWS TODAY
          </Link>

          {/* Navigation - Categories */}
          <nav className="hidden md:flex space-x-6 overflow-x-auto py-2">
            <Link
              to="/"
              className={`text-sm font-bold uppercase tracking-wider transition-all duration-200 ${
                location.pathname === "/"
                  ? "text-red-600 dark:text-red-500"
                  : "text-gray-600 dark:text-gray-300 hover:text-red-500"
              }`}
            >
              All News
            </Link>
            {categories.map((cat) => {
              const catPath = `/category/${cat.id}`;
              const isActive = location.pathname === catPath;
              return (
                <Link
                  key={cat.id}
                  to={catPath}
                  className={`text-sm font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "text-red-600 dark:text-red-500"
                      : "text-gray-600 dark:text-gray-300 hover:text-red-500"
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-all cursor-pointer"
              title="Search Categories"
            >
              <Search size={20} />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-all cursor-pointer"
              title="Toggle Dark Mode"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex space-x-4 overflow-x-auto px-4 py-2 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-900">
          <Link
            to="/"
            className={`text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
              location.pathname === "/"
                ? "text-red-600 dark:text-red-500"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            All News
          </Link>
          {categories.map((cat) => {
            const catPath = `/category/${cat.id}`;
            const isActive = location.pathname === catPath;
            return (
              <Link
                key={cat.id}
                to={catPath}
                className={`text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                  isActive
                    ? "text-red-600 dark:text-red-500"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Category Search Modal */}
      {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} />}
    </>
  );
};

export default Header;
