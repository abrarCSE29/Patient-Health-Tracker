import React, { useState } from "react";
import { Bell, Pill, Calendar, Clock, Check, Trash2, Settings, MoreVertical, XCircle, Mail, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export default function NotificationsPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Notifications</h1>
          <p className="text-slate-500">Stay updated with your medication schedule and upcoming visits.</p>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 rounded-xl font-semibold text-neutral-600 hover:bg-neutral-50 transition-all shadow-sm"
        >
          <Settings className="w-5 h-5" />
          Preferences
        </button>
      </div>

        <div className="bg-white rounded-[2.5rem] border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Recent Activity</h3>
          <button className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">Mark all as read</button>
        </div>
        
        <div className="divide-y divide-neutral-100">
          {[
            { title: "Medication Reminder", message: "Time to take Metformin (500mg)", time: "10 mins ago", type: "med", unread: true },
            { title: "Upcoming Visit", message: "Visit with Dr. Sarah Smith tomorrow at 10:00 AM", time: "2 hours ago", type: "visit", unread: true },
            { title: "Report Ready", message: "Your Blood Test results have been uploaded", time: "Yesterday", type: "report", unread: false },
            { title: "Medication Finished", message: "Lisinopril course completed", time: "2 days ago", type: "med", unread: false },
          ].map((n, i) => (
            <div key={i} className={cn(
              "p-8 flex gap-6 hover:bg-neutral-50 transition-all cursor-pointer group relative",
              n.unread && "bg-neutral-50/30"
            )}>
              {n.unread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-500" />}
              
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
                n.type === 'med' ? "bg-blue-50 text-blue-600" : 
                n.type === 'visit' ? "bg-purple-50 text-purple-600" : "bg-amber-50 text-amber-600"
              )}>
                {n.type === 'med' ? <Pill className="w-7 h-7" /> : 
                 n.type === 'visit' ? <Calendar className="w-7 h-7" /> : <Bell className="w-7 h-7" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className={cn("font-black text-slate-800", n.unread ? "text-lg" : "text-base opacity-70")}>{n.title}</p>
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{n.time}</span>
                </div>
                <p className="text-neutral-500 font-medium leading-relaxed">{n.message}</p>
                
                <div className="flex gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 hover:underline">
                    <Check className="w-3 h-3" /> Mark Read
                  </button>
                  <button className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5 hover:underline">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Notification Preferences</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-neutral-400" />
                </button>
              </div>
              
              <div className="p-8 space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">Channels</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Email Notifications", icon: Mail, enabled: true },
                      { label: "Push Notifications", icon: Smartphone, enabled: false },
                      { label: "In-App Reminders", icon: Bell, enabled: true },
                    ].map((pref, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                        <div className="flex items-center gap-3">
                          <pref.icon className="w-5 h-5 text-neutral-500" />
                          <span className="font-bold text-slate-800">{pref.label}</span>
                        </div>
                        <div className={cn(
                          "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                          pref.enabled ? "bg-gradient-to-r from-indigo-500 to-violet-500" : "bg-neutral-200"
                        )}>
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                            pref.enabled ? "left-7" : "left-1"
                          )} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em]">Quiet Hours</h3>
                  <div className="p-6 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-3xl text-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-neutral-400" />
                        <span className="font-bold">Enable Quiet Hours</span>
                      </div>
                      <div className="w-10 h-5 bg-neutral-700 rounded-full relative cursor-pointer">
                        <div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full" />
                      </div>
                    </div>
                    <p className="text-xs text-neutral-400 font-medium leading-relaxed">
                      Non-critical notifications will be suppressed between 10:00 PM and 7:00 AM.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-neutral-50 border-t border-neutral-100 flex gap-4">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-black text-sm rounded-2xl hover:from-indigo-600 hover:to-violet-600 transition-all uppercase tracking-widest shadow-xl shadow-indigo-100"
                >
                  Save Preferences
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
