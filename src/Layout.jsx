import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  BarChart2,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  DollarSign,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import ReminderNotificationPopup from "@/components/reminders/ReminderNotificationPopup";
import NotificationBell from "@/components/notifications/NotificationBell";

const allNavItems = [
  { label: "Dashboard",      page: "Dashboard",     icon: LayoutDashboard, permission: null },
  { label: "Leads",          page: "Leads",          icon: PhoneCall,       permission: null },
  { label: "Activities",     page: "Activities",     icon: Users,           permission: null },
  { label: "Reminders",      page: "Reminders",      icon: Bell,            permission: null },
  { label: "Deposits",       page: "Deposits",       icon: DollarSign,      permission: null },
  { label: "Reports",        page: "Reports",        icon: BarChart2,       permission: "ADMIN_ONLY" },
  { label: "Agent Dashboard", page: "AgentDashboard", icon: BarChart2,       permission: "ADMIN_ONLY" },
  { label: "Import History", page: "ImportHistory",  icon: BarChart2,       permission: "ADMIN_ONLY" },
  { label: "Settings",       page: "Settings",       icon: Settings,        permission: "ADMIN_ONLY" },
  { label: "Access Control", page: "AccessControl",  icon: Users,           permission: "ADMIN_ONLY" },
];

export default function Layout({ children, currentPageName }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = allNavItems.filter((item) => {
    if (!item.permission) return true;
    if (item.permission === "ADMIN_ONLY") return user?.role === "admin";
    return false;
  });

  const handleLogout = () => logout();

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm h-16 flex items-center px-4 gap-4">
        {/* Logo */}
        <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">PPS</span>
          </div>
          <span className="text-lg font-bold text-gray-900 hidden sm:block">PPS CRM</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 mx-4">
          {navItems.map(({ label, page }) => {
            const active = currentPageName === page;
            return (
              <Link
                key={page}
                to={createPageUrl(page)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                  ${active
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 lg:flex-none" />

        {/* Notification Bell */}
        {user && <NotificationBell user={user} />}

        {/* User Profile (top-right) */}
        {user && (
          <div className="relative shrink-0" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                {user.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{user.full_name}</p>
                {user.role && (
                  <span className="text-xs text-blue-600 font-medium capitalize">{user.role}</span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <Link
                  to={createPageUrl("Profile")}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  Edit Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full transition-colors border-t border-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-gray-500 hover:text-gray-700 shrink-0"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-sm z-20 px-4 pb-3">
          {navItems.map(({ label, page, icon: Icon }) => {
            const active = currentPageName === page;
            return (
              <Link
                key={page}
                to={createPageUrl(page)}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                  ${active
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>

      {user && <ReminderNotificationPopup user={user} />}
    </div>
  );
}