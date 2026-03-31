import React, { useState } from "react";
import { Plus, Calendar, Clock, UserRound, MapPin, ChevronRight, MoreVertical, XCircle, CheckCircle2, AlertCircle, Edit2, Trash2 } from "lucide-react";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useData, postData } from "@/hooks/useData";
import { usePatient } from "@/context/PatientContext";

export default function VisitsPage() {
  const { activeProfileId } = usePatient();
  const { data: visits, refresh } = useData<any[]>(activeProfileId ? `/api/visits?profileId=${activeProfileId}` : null);
  const { data: doctors } = useData<any[]>("/api/doctors");
  const [isScheduling, setIsScheduling] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  
  const [formData, setFormData] = useState({
    doctorId: "",
    date: new Date().toISOString().split('T')[0],
    time: "10:00",
    reason: "",
    location: "",
    notes: ""
  });

  const resetForm = () => {
    setFormData({
      doctorId: "",
      date: new Date().toISOString().split('T')[0],
      time: "10:00",
      reason: "",
      location: "",
      notes: ""
    });
    setEditingId(null);
    setIsScheduling(false);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await fetch(`/api/visits/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            status: activeTab === "upcoming" ? "upcoming" : "completed"
          })
        });
      } else {
        await postData("/api/visits", {
          ...formData,
          profileId: activeProfileId,
          status: "upcoming"
        });
      }
      resetForm();
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (visit: any) => {
    setFormData({
      doctorId: visit.doctorId || "",
      date: visit.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      time: visit.time || "10:00",
      reason: visit.reason || "",
      location: visit.location || "",
      notes: visit.notes || ""
    });
    setEditingId(visit.id);
    setIsScheduling(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/visits/${deleteId}`, {
        method: "DELETE"
      });
      setDeleteId(null);
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await fetch(`/api/visits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVisits = visits?.filter(v => 
    activeTab === "upcoming" ? v.status === "upcoming" : v.status === "completed"
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Doctor Visits</h1>
          <p className="text-slate-500">Schedule and track your medical appointments and follow-ups.</p>
        </div>
        <button 
          onClick={() => setIsScheduling(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          Schedule Visit
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-neutral-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab("upcoming")}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === "upcoming" ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-700"
          )}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setActiveTab("past")}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === "past" ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-700"
          )}
        >
          Past Visits
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredVisits && filteredVisits.length > 0 ? (
          filteredVisits.map((visit, idx) => (
            <motion.div 
              key={visit.id || idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex flex-col items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                <span className="text-[10px] font-bold uppercase leading-none opacity-70">
                  {formatDate(visit.date).split(' ')[0]}
                </span>
                <span className="text-2xl font-black leading-none">
                  {formatDate(visit.date).split(' ')[1]?.replace(',', '') || '--'}
                </span>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-800">{visit.doctor?.name}</h3>
                  <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[10px] font-bold rounded-full uppercase tracking-widest">{visit.doctor?.specialty || "General"}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-neutral-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{visit.time || formatTime(visit.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{visit.location || visit.clinic}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {activeTab === "upcoming" && (
                  <button 
                    onClick={() => handleStatusUpdate(visit.id, "completed")}
                    className="p-2 hover:bg-green-50 rounded-xl transition-colors text-neutral-400 hover:text-green-600"
                    title="Mark as Completed"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={() => handleEdit(visit)}
                  className="p-2 hover:bg-indigo-50 rounded-xl transition-colors text-neutral-400 hover:text-indigo-600"
                  title="Edit / Reschedule"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setDeleteId(visit.id)}
                  className="p-2 hover:bg-red-50 rounded-xl transition-colors text-neutral-400 hover:text-red-500"
                  title="Delete Visit"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-neutral-200 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-300 mx-auto">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold text-slate-800">No {activeTab} visits recorded</p>
              <p className="text-sm text-neutral-500">Your {activeTab} appointments will appear here.</p>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <AnimatePresence>
        {isScheduling && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsScheduling(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">
                  {editingId ? "Reschedule / Edit Visit" : "Schedule Doctor Visit"}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-neutral-400" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Select Doctor</label>
                  <select 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 appearance-none"
                    value={formData.doctorId}
                    onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                  >
                    <option value="">Select a doctor...</option>
                    {doctors?.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialty})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Time</label>
                    <input 
                      type="time" 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Reason for Visit</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Annual checkup, flu symptoms" 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Notes (Optional)</label>
                  <textarea 
                    placeholder="Any specific concerns to discuss..." 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 min-h-[100px] resize-none"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex gap-3">
                <button 
                  onClick={resetForm}
                  className="flex-1 py-3 text-neutral-600 font-bold hover:bg-neutral-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-200"
                >
                  {editingId ? "Save Changes" : "Schedule Visit"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Delete Visit?</h3>
              <p className="text-neutral-500 mb-6">This action cannot be undone. All notes and diagnosis for this visit will be lost.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 bg-neutral-100 text-neutral-600 font-bold rounded-xl hover:bg-neutral-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
