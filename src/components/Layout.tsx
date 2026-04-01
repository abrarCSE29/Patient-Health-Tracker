import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Pill, 
  UserRound, 
  FileText, 
  Calendar, 
  Bell, 
  LogOut,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { usePatient } from "@/context/PatientContext";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Medications", href: "/medications", icon: Pill },
  { name: "Doctors", href: "/doctors", icon: UserRound },
  { name: "Test Reports", href: "/reports", icon: FileText },
  { name: "Visits", href: "/visits", icon: Calendar },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Profiles", href: "/profiles", icon: Users },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profiles, activeProfileId, setActiveProfileId } = usePatient();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setIsMobileMenuOpen(false);
      setIsUserMenuOpen(false);
      navigate("/login");
    }
  };

  const userInitials = user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U";

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-indigo-50/40 text-slate-800 flex">
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className={cn(
          "hidden md:flex flex-col bg-white/75 backdrop-blur-md border-r border-slate-200/80 sticky top-0 h-screen transition-all duration-300 ease-in-out",
          !isSidebarOpen && "items-center"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <span className="text-xl font-bold text-slate-800 tracking-tight">
              HealthTracker
            </span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
          >
            <Menu className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
                  isActive
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-800"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-500")} />
                {isSidebarOpen && (
                  <span className="font-medium text-sm">{item.name}</span>
                )}
                {isSidebarOpen && isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/70 relative">
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 w-full rounded-xl hover:bg-white/80 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
              !isSidebarOpen && "justify-center"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm shadow-indigo-200">
              {userInitials}
            </div>
            {isSidebarOpen && (
              <div className="text-left overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "User"}</p>
                <p className="text-[10px] font-medium text-slate-500 truncate">{user?.email || "user@example.com"}</p>
              </div>
            )}
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={cn(
                    "absolute bottom-full left-4 right-4 mb-2 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 z-20 overflow-hidden p-1",
                    !isSidebarOpen && "left-full ml-2 bottom-4 w-48"
                  )}
                >
                  <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-rose-600 hover:bg-rose-50 transition-all text-sm font-bold"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/25 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: isMobileMenuOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 w-72 bg-slate-50 z-50 md:hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 flex items-center justify-between">
          <span className="text-xl font-bold text-slate-800 tracking-tight">
            HealthTracker
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:bg-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200/80 bg-white/70">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/80 border border-slate-200/60">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm shadow-indigo-200">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name || "User"}</p>
              <p className="text-[10px] font-medium text-slate-500 truncate">{user?.email || "user@example.com"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex items-center justify-center gap-2 px-4 py-2.5 w-full rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all text-sm font-bold"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white/70 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 md:px-8 shrink-0 fixed top-0 inset-x-0 z-30 md:static">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 hover:bg-white rounded-lg md:hidden"
            >
              <Menu className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="flex items-center">
            <div className="relative">
              <label htmlFor="active-profile" className="sr-only">
                Active profile
              </label>
              <select
                id="active-profile"
                value={activeProfileId ?? ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setActiveProfileId(e.target.value);
                  }
                }}
                className="appearance-none pl-3 pr-9 py-2 rounded-xl border border-slate-200 bg-white/90 text-slate-700 text-xs sm:text-sm font-semibold shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 max-w-[12.5rem] sm:max-w-[16rem] truncate"
              >
                {profiles.length === 0 && <option value="">No profiles</option>}
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} ({profile.relationship})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-4 pt-20 sm:px-6 sm:pb-6 sm:pt-20 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
