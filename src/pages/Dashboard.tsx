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
          <h1 className="text-4xl font-black text-neutral-900 tracking-tight">
            Hello, {activeProfile?.name?.split(' ')[0] || "Guest"}!
          </h1>
          <p className="text-neutral-500 font-medium text-lg">
            Here's what's happening with {activeProfile?.name || "your health"} today.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button className="p-3 bg-white border border-neutral-200 rounded-2xl hover:bg-neutral-50 transition-all shadow-sm relative">
              <Bell className="w-6 h-6 text-neutral-600" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
            </button>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-3 border-l border-neutral-200 hover:opacity-80 transition-all group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-neutral-900 flex items-center justify-end gap-1">
                  {activeProfile?.name || "User"}
                  <ChevronDown className={cn("w-4 h-4 text-neutral-400 transition-transform", isProfileOpen && "rotate-180")} />
                </p>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{activeProfile?.relationship || "Self"}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center text-white shadow-lg shadow-neutral-200 group-hover:scale-105 transition-transform">
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
                    className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] border border-neutral-200 shadow-2xl z-20 overflow-hidden p-2"
                  >
                    <div className="px-4 py-3 border-b border-neutral-100">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Switch Profile</p>
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
                              ? "bg-neutral-900 text-white" 
                              : "hover:bg-neutral-50 text-neutral-600"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            activeProfileId === profile.id 
                              ? "bg-white/10 text-white" 
                              : "bg-neutral-100 text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white"
                          )}>
                            <UserRound className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black text-sm">{profile.name}</p>
                            <p className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              activeProfileId === profile.id ? "text-white/60" : "text-neutral-400"
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
                    <div className="p-2 border-t border-neutral-100">
                      <Link 
                        to="/profiles"
                        className="flex items-center justify-center gap-2 w-full py-3 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
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
          color="bg-blue-500"
        />
        <StatCard 
          icon={<Calendar className="w-6 h-6" />}
          label="Next Visit"
          value={upcomingVisits[0]?.date ? formatDate(upcomingVisits[0].date) : "None"}
          trend={upcomingVisits[0]?.time || "No upcoming visits"}
          color="bg-purple-500"
        />
        <StatCard 
          icon={<Activity className="w-6 h-6" />}
          label="Health Score"
          value="92"
          trend="Top 5% for your age"
          color="bg-emerald-500"
        />
        <StatCard 
          icon={<AlertCircle className="w-6 h-6" />}
          label="Alerts"
          value="0"
          trend="Everything looks good"
          color="bg-neutral-900"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Appointments */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-neutral-900 tracking-tight">Upcoming Visits</h2>
              <Link to="/visits" className="text-sm font-bold text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1">
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
                <div className="p-8 bg-white rounded-[2rem] border-2 border-dashed border-neutral-100 text-center">
                  <p className="text-neutral-400 font-medium italic">No upcoming appointments scheduled.</p>
                </div>
              )}
            </div>
          </section>

          {/* Daily Medication Schedule */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-neutral-900 tracking-tight">Today's Schedule</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Live Updates</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Morning Routine */}
              {morningMeds.length > 0 && (
                <div className="bg-white rounded-[2.5rem] border border-neutral-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-neutral-100 bg-blue-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-neutral-900">Morning Routine</span>
                    </div>
                    <span className="px-3 py-1 bg-white border border-neutral-200 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      {morningMeds.length} Items
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {morningMeds.map((med) => (
                      <MedicationRow key={med.id} med={med} timeSlot="morning" />
                    ))}
                  </div>
                </div>
              )}

              {/* Afternoon Routine */}
              {afternoonMeds.length > 0 && (
                <div className="bg-white rounded-[2.5rem] border border-neutral-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-neutral-100 bg-orange-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-neutral-900">Afternoon Routine</span>
                    </div>
                    <span className="px-3 py-1 bg-white border border-neutral-200 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      {afternoonMeds.length} Items
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {afternoonMeds.map((med) => (
                      <MedicationRow key={med.id} med={med} timeSlot="afternoon" />
                    ))}
                  </div>
                </div>
              )}

              {/* Night Routine */}
              {nightMeds.length > 0 && (
                <div className="bg-white rounded-[2.5rem] border border-neutral-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-neutral-100 bg-indigo-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-neutral-900">Night Routine</span>
                    </div>
                    <span className="px-3 py-1 bg-white border border-neutral-200 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      {nightMeds.length} Items
                    </span>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {nightMeds.map((med) => (
                      <MedicationRow key={med.id} med={med} timeSlot="night" />
                    ))}
                  </div>
                </div>
              )}

              {activeMedsCount === 0 && (
                <div className="p-12 bg-white rounded-[2.5rem] border-2 border-dashed border-neutral-100 text-center">
                  <p className="text-neutral-400 font-medium italic">No medications scheduled for today.</p>
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

function StatCard({ icon, label, value, trend, color }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-[2rem] border border-neutral-200 shadow-sm space-y-4"
    >
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", color)}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-3xl font-black text-neutral-900 tracking-tight">{value}</p>
        <p className="text-xs font-bold text-neutral-500 mt-1">{trend}</p>
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
      className="bg-white p-6 rounded-[2rem] border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-neutral-900 transition-colors group"
    >
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-3xl bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white transition-all">
          <UserRound className="w-8 h-8" />
        </div>
        <div>
          <h4 className="text-lg font-black text-neutral-900 tracking-tight">{doctor}</h4>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">{specialty}</p>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-neutral-100 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-600">
              {type}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6 sm:text-right">
        <div className="space-y-1">
          <div className="flex items-center sm:justify-end gap-2 text-neutral-900 font-black">
            <Calendar className="w-4 h-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center sm:justify-end gap-2 text-neutral-400 font-bold text-sm">
            <Clock className="w-4 h-4" />
            <span>{time}</span>
          </div>
        </div>
        <button className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400 hover:bg-neutral-900 hover:text-white transition-all">
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
}

function MedicationRow({ med, timeSlot }: { med: any, timeSlot: 'morning' | 'afternoon' | 'night' }) {
  const dosage = timeSlot === 'morning' ? med.morningDosage : timeSlot === 'afternoon' ? med.afternoonDosage : med.nightDosage;
  const meal = timeSlot === 'morning' ? med.morningMeal : timeSlot === 'afternoon' ? med.afternoonMeal : med.nightMeal;
  
  const colorMap = {
    morning: "text-blue-500 bg-blue-50",
    afternoon: "text-orange-500 bg-orange-50",
    night: "text-indigo-500 bg-indigo-50"
  };

  return (
    <div className="p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white transition-all">
          <Pill className="w-6 h-6" />
        </div>
        <div>
          <p className="font-black text-neutral-900">{med.name}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className={cn("text-[8px] font-bold uppercase px-1.5 py-0.5 rounded", colorMap[timeSlot])}>
              {dosage} {dosage === "1" ? "pill" : "pills"}
            </span>
            {meal && (
              <span className="text-[8px] font-bold text-neutral-400 uppercase bg-neutral-100 px-1.5 py-0.5 rounded">
                {meal}
              </span>
            )}
          </div>
        </div>
      </div>
      <button className="w-10 h-10 rounded-xl border border-neutral-200 flex items-center justify-center hover:bg-neutral-900 hover:border-neutral-900 hover:text-white transition-all">
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
