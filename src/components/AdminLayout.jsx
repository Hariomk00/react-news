import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { LayoutDashboard, FileText, FolderTree, LogOut, ArrowLeft, Menu, X, Globe } from "lucide-react";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/admin/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const menuItems = [
    { path: "/admin/dashboard", name: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/manage-news", name: "Manage News", icon: FileText },
    { path: "/admin/manage-categories", name: "Manage Categories", icon: FolderTree },
    { path: "/admin/import-news", name: "Import News", icon: Globe },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col justify-between h-full bg-white dark:bg-gray-800">
      <div>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-wider text-red-600 dark:text-red-500">
              NEWS ADMIN
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Management Portal</p>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-500"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300"
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all"
        >
          <ArrowLeft size={18} />
          Public Website
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Top navbar for mobile */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div>
          <h1 className="text-lg font-bold tracking-wider text-red-600 dark:text-red-500">
            NEWS ADMIN
          </h1>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Management Portal</p>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile Drawer Sidebar overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          ></div>

          {/* Sidebar Drawer */}
          <aside className="relative flex flex-col w-64 bg-white dark:bg-gray-800 h-full shadow-2xl animate-slideRight">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar (static on large screens) */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
