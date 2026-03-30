import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Pill, 
  UserRound, 
  FileText, 
  Calendar, 
  Bell, 
  Settings,
  LogOut,
  ChevronRight,
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
  const { profiles, activeProfileId, setActiveProfileId, activeProfile } = usePatient();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userInitials = user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className={cn(
          "hidden md:flex flex-col bg-white border-r border-neutral-200 sticky top-0 h-screen transition-all duration-300 ease-in-out",
          !isSidebarOpen && "items-center"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <span className="text-xl font-bold text-neutral-900 tracking-tight">
              HealthTracker
            </span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-neutral-500" />
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
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-neutral-500 group-hover:text-neutral-900")} />
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

        <div className="p-4 border-t border-neutral-100 relative">
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 w-full rounded-xl hover:bg-neutral-100 transition-all duration-200 group",
              !isSidebarOpen && "justify-center"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userInitials}
            </div>
            {isSidebarOpen && (
              <div className="text-left overflow-hidden">
                <p className="text-sm font-bold text-neutral-900 truncate">{user?.name || "User"}</p>
                <p className="text-[10px] font-medium text-neutral-400 truncate">{user?.email || "user@example.com"}</p>
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
                    "absolute bottom-full left-4 right-4 mb-2 bg-white rounded-2xl border border-neutral-200 shadow-xl z-20 overflow-hidden p-1",
                    !isSidebarOpen && "left-full ml-2 bottom-4 w-48"
                  )}
                >
                  <div className="px-4 py-2 border-b border-neutral-100 md:hidden">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Account</p>
                    <p className="text-sm font-bold text-neutral-900 truncate">{user?.name}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-red-600 hover:bg-red-50 transition-all text-sm font-bold"
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: isMobileMenuOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 w-72 bg-white z-50 md:hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 flex items-center justify-between">
          <span className="text-xl font-bold text-neutral-900 tracking-tight">
            HealthTracker
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
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
                    ? "bg-neutral-900 text-white shadow-lg shadow-neutral-200"
                    : "text-neutral-600 hover:bg-neutral-100"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-neutral-500")} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 hover:bg-neutral-100 rounded-lg md:hidden"
            >
              <Menu className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-white text-xs font-bold">
              {userInitials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
