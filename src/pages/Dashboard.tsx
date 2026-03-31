import React from "react";
import { 
  Plus, 
  Pill, 
  Calendar, 
  FileText, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  UserRound,
  ArrowUpRight,
  Bell,
  Search,
  Stethoscope,
  ArrowRight,
  ChevronDown,
  Users
} from "lucide-react";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { useData } from "@/hooks/useData";
import { usePatient } from "@/context/PatientContext";

export default function Dashboard() {
  const { activeProfileId, activeProfile, profiles, setActiveProfileId } = usePatient();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const { data: meds } = useData<any[]>(activeProfileId ? `/api/medications?profileId=${activeProfileId}` : null);
  const { data: visits } = useData<any[]>(activeProfileId ? `/api/visits?profileId=${activeProfileId}` : null);

  const upcomingVisits = visits?.filter(v => v.status === 'upcoming' && new Date(v.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];
  const activeMedsList = meds?.filter(m => m.status === 'active') || [];
  const activeMedsCount = activeMedsList.length;

  const morningMeds = activeMedsList.filter(m => m.morningDosage && m.morningDosage !== "0");
  const afternoonMeds = activeMedsList.filter(m => m.afternoonDosage && m.afternoonDosage !== "0");
  const nightMeds = activeMedsList.filter(m => m.nightDosage && m.nightDosage !== "0");

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            Hello, {activeProfile?.name?.split(' ')[0] || "Guest"}!
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Here's what's happening with {activeProfile?.name || "your health"} today.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button className="p-3 bg-white/90 border border-indigo-100 rounded-2xl hover:bg-white transition-all shadow-sm shadow-indigo-100/60 relative">
              <Bell className="w-6 h-6 text-indigo-500" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
            </button>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-3 border-l border-slate-200 hover:opacity-90 transition-all group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-800 flex items-center justify-end gap-1">
                  {activeProfile?.name || "User"}
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isProfileOpen && "rotate-180")} />
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeProfile?.relationship || "Self"}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
                <UserRound className="w-6 h-6" />
              </div>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsProfileOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-white/95 rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/60 z-20 overflow-hidden p-2"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Switch Profile</p>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto py-2">
                      {profiles.map((profile) => (
                        <button
                          key={profile.id}
                          onClick={() => {
                            setActiveProfileId(profile.id);
                            setIsProfileOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left group",
                            activeProfileId === profile.id 
                              ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white" 
                              : "hover:bg-slate-50 text-slate-600"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            activeProfileId === profile.id 
                              ? "bg-white/10 text-white" 
                              : "bg-slate-100 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white"
                          )}>
                            <UserRound className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black text-sm">{profile.name}</p>
                            <p className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              activeProfileId === profile.id ? "text-white/70" : "text-slate-400"
                            )}>
                              {profile.relationship}
                            </p>
                          </div>
                          {activeProfileId === profile.id && (
                            <CheckCircle2 className="w-4 h-4 ml-auto text-emerald-400" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="p-2 border-t border-slate-100">
                      <Link 
                        to="/profiles"
                        className="flex items-center justify-center gap-2 w-full py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        Manage Profiles
                      </Link>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Pill className="w-6 h-6" />}
          label="Active Meds"
          value={activeMedsCount.toString()}
          trend="+1 from last month"
          tone="blue"
        />
        <StatCard 
          icon={<Calendar className="w-6 h-6" />}
          label="Next Visit"
          value={upcomingVisits[0]?.date ? formatDate(upcomingVisits[0].date) : "None"}
          trend={upcomingVisits[0]?.time || "No upcoming visits"}
          tone="violet"
        />
        <StatCard 
          icon={<Activity className="w-6 h-6" />}
          label="Health Score"
          value="92"
          trend="Top 5% for your age"
          tone="emerald"
        />
        <StatCard 
          icon={<AlertCircle className="w-6 h-6" />}
          label="Alerts"
          value="0"
          trend="Everything looks good"
          tone="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Appointments */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Upcoming Visits</h2>
              <Link to="/visits" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {upcomingVisits.length > 0 ? (
                upcomingVisits.slice(0, 2).map((visit, i) => (
                  <AppointmentCard 
                    key={visit.id}
                    doctor={visit.doctor?.name || "Unknown Doctor"}
                    specialty={visit.doctor?.specialty || "General"}
                    date={formatDate(visit.date)}
                    time={visit.time || formatTime(visit.date)}
                    type={visit.type || "Checkup"}
                    delay={i * 0.1}
                  />
                ))
              ) : (
                <div className="p-8 bg-white/90 rounded-[2rem] border-2 border-dashed border-slate-200 text-center shadow-sm shadow-slate-100/70">
                  <p className="text-slate-400 font-medium italic">No upcoming appointments scheduled.</p>
                </div>
              )}
            </div>
          </section>

          {/* Daily Medication Schedule */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Today's Schedule</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Live Updates</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Morning Routine */}
              {morningMeds.length > 0 && (
                <div className="bg-gradient-to-br from-white via-sky-50/70 to-white rounded-[2.5rem] border border-sky-200 shadow-lg shadow-sky-100/70 overflow-hidden">
                  <div className="p-6 border-b border-sky-100 bg-sky-100/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/80 border border-sky-200 flex items-center justify-center text-sky-600">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sky-900">Morning Routine</span>
                    </div>
                    <span className="px-3 py-1 bg-white/90 border border-sky-200 rounded-full text-[10px] font-black uppercase tracking-widest text-sky-700">
                      {morningMeds.length} Items
                    </span>
                  </div>
                  <div className="divide-y divide-sky-100/80">
                    {morningMeds.map((med) => (
                      <MedicationRow key={med.id} med={med} timeSlot="morning" />
                    ))}
                  </div>
                </div>
              )}

              {/* Afternoon Routine */}
              {afternoonMeds.length > 0 && (
                <div className="bg-gradient-to-br from-white via-amber-50/70 to-white rounded-[2.5rem] border border-amber-200 shadow-lg shadow-amber-100/70 overflow-hidden">
                  <div className="p-6 border-b border-amber-100 bg-amber-100/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/80 border border-amber-200 flex items-center justify-center text-amber-600">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-amber-900">Afternoon Routine</span>
                    </div>
                    <span className="px-3 py-1 bg-white/90 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-700">
                      {afternoonMeds.length} Items
                    </span>
                  </div>
                  <div className="divide-y divide-amber-100/80">
                    {afternoonMeds.map((med) => (
                      <MedicationRow key={med.id} med={med} timeSlot="afternoon" />
                    ))}
                  </div>
                </div>
              )}

              {/* Night Routine */}
              {nightMeds.length > 0 && (
                <div className="bg-gradient-to-br from-white via-indigo-50/70 to-white rounded-[2.5rem] border border-indigo-200 shadow-lg shadow-indigo-100/70 overflow-hidden">
                  <div className="p-6 border-b border-indigo-100 bg-indigo-100/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/80 border border-indigo-200 flex items-center justify-center text-indigo-600">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-indigo-900">Night Routine</span>
                    </div>
                    <span className="px-3 py-1 bg-white/90 border border-indigo-200 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-700">
                      {nightMeds.length} Items
                    </span>
                  </div>
                  <div className="divide-y divide-indigo-100/80">
                    {nightMeds.map((med) => (
                      <MedicationRow key={med.id} med={med} timeSlot="night" />
                    ))}
                  </div>
                </div>
              )}

              {activeMedsCount === 0 && (
                <div className="p-12 bg-white/90 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center shadow-sm shadow-slate-100/60">
                  <p className="text-slate-400 font-medium italic">No medications scheduled for today.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Area */}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, tone }: any) {
  const toneMap: Record<string, { card: string; icon: string; label: string; trend: string }> = {
    blue: {
      card: "bg-gradient-to-br from-white via-sky-50/80 to-white border-sky-200",
      icon: "bg-gradient-to-br from-sky-500 to-cyan-500 shadow-sky-200",
      label: "text-sky-700/80",
      trend: "text-sky-700",
    },
    violet: {
      card: "bg-gradient-to-br from-white via-violet-50/80 to-white border-violet-200",
      icon: "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-200",
      label: "text-violet-700/80",
      trend: "text-violet-700",
    },
    emerald: {
      card: "bg-gradient-to-br from-white via-emerald-50/80 to-white border-emerald-200",
      icon: "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-200",
      label: "text-emerald-700/80",
      trend: "text-emerald-700",
    },
    rose: {
      card: "bg-gradient-to-br from-white via-rose-50/80 to-white border-rose-200",
      icon: "bg-gradient-to-br from-rose-500 to-pink-500 shadow-rose-200",
      label: "text-rose-700/80",
      trend: "text-rose-700",
    },
  };

  const toneStyles = toneMap[tone] || toneMap.blue;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn("p-6 rounded-[2rem] border shadow-md space-y-4", toneStyles.card)}
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", toneStyles.icon)}>
        {icon}
      </div>
      <div>
        <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-1", toneStyles.label)}>{label}</p>
        <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
        <p className={cn("text-xs font-bold mt-1", toneStyles.trend)}>{trend}</p>
      </div>
    </motion.div>
  );
}

function AppointmentCard({ doctor, specialty, date, time, type, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="bg-gradient-to-br from-white via-violet-50/35 to-white p-6 rounded-[2rem] border border-violet-200 shadow-md shadow-violet-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-violet-300 transition-colors group"
    >
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-3xl bg-violet-100/80 border border-violet-200 flex items-center justify-center text-violet-600 group-hover:bg-violet-500 group-hover:text-white transition-all">
          <UserRound className="w-8 h-8" />
        </div>
        <div>
          <h4 className="text-lg font-black text-slate-800 tracking-tight">{doctor}</h4>
          <p className="text-xs font-bold text-violet-600/80 uppercase tracking-widest mb-2">{specialty}</p>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-violet-100/80 rounded-full text-[10px] font-black uppercase tracking-widest text-violet-700">
              {type}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6 sm:text-right">
        <div className="space-y-1">
          <div className="flex items-center sm:justify-end gap-2 text-slate-800 font-black">
            <Calendar className="w-4 h-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center sm:justify-end gap-2 text-slate-500 font-bold text-sm">
            <Clock className="w-4 h-4" />
            <span>{time}</span>
          </div>
        </div>
        <button className="w-12 h-12 rounded-2xl bg-violet-100/80 border border-violet-200 flex items-center justify-center text-violet-600 hover:bg-violet-500 hover:text-white hover:border-violet-500 transition-all">
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
}

function MedicationRow({ med, timeSlot }: { med: any, timeSlot: 'morning' | 'afternoon' | 'night' }) {
  const dosage = timeSlot === 'morning' ? med.morningDosage : timeSlot === 'afternoon' ? med.afternoonDosage : med.nightDosage;
  const meal = timeSlot === 'morning' ? med.morningMeal : timeSlot === 'afternoon' ? med.afternoonMeal : med.nightMeal;
  
  const colorMap: Record<'morning' | 'afternoon' | 'night', {
    rowHover: string;
    icon: string;
    badge: string;
    meal: string;
    action: string;
  }> = {
    morning: {
      rowHover: "hover:bg-sky-50/60",
      icon: "bg-sky-100 text-sky-600 group-hover:bg-sky-500 group-hover:text-white",
      badge: "text-sky-700 bg-sky-100",
      meal: "text-sky-700 bg-sky-50 border border-sky-200",
      action: "border-sky-200 text-sky-600 hover:bg-sky-500 hover:text-white hover:border-sky-500",
    },
    afternoon: {
      rowHover: "hover:bg-amber-50/60",
      icon: "bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
      badge: "text-amber-700 bg-amber-100",
      meal: "text-amber-700 bg-amber-50 border border-amber-200",
      action: "border-amber-200 text-amber-600 hover:bg-amber-500 hover:text-white hover:border-amber-500",
    },
    night: {
      rowHover: "hover:bg-indigo-50/60",
      icon: "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white",
      badge: "text-indigo-700 bg-indigo-100",
      meal: "text-indigo-700 bg-indigo-50 border border-indigo-200",
      action: "border-indigo-200 text-indigo-600 hover:bg-indigo-500 hover:text-white hover:border-indigo-500",
    },
  };

  const tone = colorMap[timeSlot];

  return (
    <div className={cn("p-6 flex items-center justify-between transition-colors group", tone.rowHover)}>
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", tone.icon)}>
          <Pill className="w-6 h-6" />
        </div>
        <div>
          <p className="font-black text-slate-800">{med.name}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className={cn("text-[8px] font-bold uppercase px-1.5 py-0.5 rounded", tone.badge)}>
              {dosage} {dosage === "1" ? "pill" : "pills"}
            </span>
            {meal && (
              <span className={cn("text-[8px] font-bold uppercase px-1.5 py-0.5 rounded", tone.meal)}>
                {meal}
              </span>
            )}
          </div>
        </div>
      </div>
      <button className={cn("w-10 h-10 rounded-xl border flex items-center justify-center transition-all", tone.action)}>
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
