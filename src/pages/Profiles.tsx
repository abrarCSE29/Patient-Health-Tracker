import React, { useState } from "react";
import { Plus, Users, UserRound, ChevronRight, MoreVertical, XCircle, Heart, ShieldAlert, Activity, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { BLOOD_GROUPS, RELATIONSHIPS } from "@/constants";
import { postData } from "@/hooks/useData";
import { usePatient } from "@/context/PatientContext";
import { authenticatedFetch } from "@/lib/apiClient";

export default function ProfilesPage() {
  const { refreshProfiles, profiles, activeProfileId, setActiveProfileId } = usePatient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    relationship: "Self",
    age: "",
    bloodGroup: "O+",
    conditions: "",
    allergies: "",
    emergencyContact: "",
    emergencyPhone: ""
  });

  const handleSave = async () => {
    try {
      setError("");
      if (editingId) {
        const response = await authenticatedFetch(`/api/profiles/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(result?.error || "Failed to update profile");
        }
      } else {
        await postData("/api/profiles", formData);
      }

      setIsAdding(false);
      setEditingId(null);
      await refreshProfiles();
      setFormData({
        name: "",
        relationship: "Self",
        age: "",
        bloodGroup: "O+",
        conditions: "",
        allergies: "",
        emergencyContact: "",
        emergencyPhone: ""
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    }
  };

  const handleEdit = (profile: any) => {
    setError("");
    setEditingId(profile.id);
    setFormData({
      name: profile.name || "",
      relationship: profile.relationship || "Self",
      age: profile.age?.toString() || "",
      bloodGroup: profile.bloodGroup || "O+",
      conditions: profile.conditions || "",
      allergies: profile.allergies || "",
      emergencyContact: profile.emergencyContact || "",
      emergencyPhone: profile.emergencyPhone || "",
    });
    setIsAdding(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setError("");
      const response = await authenticatedFetch(`/api/profiles/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Failed to delete profile");
      }

      setDeleteId(null);
      await refreshProfiles();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete profile.");
    }
  };

  const resetModal = () => {
    setIsAdding(false);
    setEditingId(null);
    setError("");
    setFormData({
      name: "",
      relationship: "Self",
      age: "",
      bloodGroup: "O+",
      conditions: "",
      allergies: "",
      emergencyContact: "",
      emergencyPhone: ""
    });
  };

  const activeProfile = profiles?.find((p) => p.id === activeProfileId) || profiles?.[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Patient Profiles</h1>
          <p className="text-slate-500">Manage health profiles for yourself and your dependents.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setError("");
            setIsAdding(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          Add Profile
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Profile Selector Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest px-2">Switch Profile</h2>
          <div className="space-y-2">
            {profiles?.map((profile) => (
              <button 
                key={profile.id}
                onClick={() => setActiveProfileId(profile.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group",
                  activeProfileId === profile.id 
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 border-indigo-500 text-white shadow-xl shadow-indigo-200" 
                    : "bg-white border-neutral-200 text-neutral-600 hover:border-indigo-300"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  activeProfileId === profile.id ? "bg-white/10" : "bg-neutral-50 group-hover:bg-neutral-100"
                )}>
                  <UserRound className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{profile.name}</p>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    activeProfileId === profile.id ? "text-white/50" : "text-neutral-400"
                  )}>{profile.relationship}</p>
                </div>
                {activeProfileId === profile.id && <ChevronRight className="w-4 h-4 text-white/50" />}
              </button>
            ))}
          </div>
        </div>

        {/* Active Profile Details */}
        <div className="lg:col-span-3">
          {activeProfile ? (
            <motion.div 
              key={activeProfile.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] border border-neutral-200 shadow-sm overflow-hidden"
            >
              <div className="h-32 bg-gradient-to-r from-indigo-500 to-violet-500 relative">
                <div className="absolute -bottom-12 left-8 w-24 h-24 rounded-3xl bg-white border-4 border-white shadow-xl flex items-center justify-center text-indigo-600">
                  <UserRound className="w-12 h-12" />
                </div>
              </div>
              
              <div className="pt-16 p-8 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">{activeProfile.name}</h2>
                    <p className="text-neutral-500 font-medium">{activeProfile.relationship} • {activeProfile.age} Years Old</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleEdit(activeProfile)}
                      className="px-6 py-2.5 border border-neutral-200 rounded-xl font-bold text-sm hover:bg-neutral-50 transition-all"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setDeleteId(activeProfile.id)}
                      className="px-6 py-2.5 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all"
                    >
                      Delete Profile
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-neutral-50 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Blood Group</p>
                    <p className="text-xl font-black text-slate-800">{activeProfile.bloodGroup}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Emergency Contact</p>
                    <p className="text-xl font-black text-slate-800 truncate">{activeProfile.emergencyContact || "Not Set"}</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Last Checkup</p>
                    <p className="text-xl font-black text-slate-800">12 Days Ago</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-800">Medical Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-800">
                        <Activity className="w-5 h-5" />
                        <span className="font-bold">Chronic Conditions</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeProfile.conditions?.split(',').map((c: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-full">{c.trim()}</span>
                        ))}
                        {!activeProfile.conditions && <span className="text-sm text-neutral-400 italic">None reported</span>}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-800">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-bold">Allergies</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeProfile.allergies?.split(',').map((a: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full">{a.trim()}</span>
                        ))}
                        {!activeProfile.allergies && <span className="text-sm text-neutral-400 italic">No known allergies</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="p-12 bg-white rounded-3xl border-2 border-dashed border-neutral-200 text-center">
              <p className="text-neutral-500 italic">No profiles found. Add your first profile to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Profile Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">New Patient Profile</h2>
                <button onClick={resetModal} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-neutral-400" />
                </button>
              </div>
              
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mary Doe" 
                    className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 transition-all font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Relationship</label>
                    <select 
                      className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 appearance-none font-medium"
                      value={formData.relationship}
                      onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                    >
                      {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Age</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 32"
                      className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 transition-all font-medium"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Blood Group</label>
                    <select 
                      className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 appearance-none font-medium"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                    >
                      <option>Unknown</option>
                      {BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Chronic Conditions (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Hypertension, Diabetes..." 
                    className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 transition-all font-medium"
                    value={formData.conditions}
                    onChange={(e) => setFormData({...formData, conditions: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Allergies (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Peanuts, Penicillin..." 
                    className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 transition-all font-medium"
                    value={formData.allergies}
                    onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                  />
                </div>

                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Emergency Contact</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <input 
                      type="text" 
                      placeholder="Contact Name" 
                      className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                    />
                    <input 
                      type="tel" 
                      placeholder="Phone Number" 
                      className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-neutral-50 border-t border-neutral-100 flex flex-col-reverse sm:flex-row gap-4">
                <button 
                  onClick={resetModal}
                  className="flex-1 py-4 text-neutral-600 font-black text-sm rounded-2xl hover:bg-neutral-100 transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-black text-sm rounded-2xl hover:from-indigo-600 hover:to-violet-600 transition-all shadow-xl shadow-indigo-200 uppercase tracking-widest"
                >
                  {editingId ? "Update Profile" : "Create Profile"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Delete Profile?</h3>
              <p className="text-neutral-500 mb-6">This will also remove this profile’s doctors, medications, visits, and reports.</p>
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
