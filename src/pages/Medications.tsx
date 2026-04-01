import React, { useState } from "react";
import { Plus, Search, Pill, Calendar, Clock, ChevronRight, MoreVertical, Trash2, Edit2, CheckCircle2, XCircle, AlertCircle, UserRound, Download } from "lucide-react";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { MEDICATION_MASTER_CATALOG } from "@/constants";
import { pdf } from "@react-pdf/renderer";
import { MedicationRosterPDF } from "@/components/MedicationRosterPDF";

import { useData, postData } from "@/hooks/useData";
import { usePatient } from "@/context/PatientContext";
import { authenticatedFetch, getResponseErrorMessage } from "@/lib/apiClient";

export default function MedicationsPage() {
  const { activeProfileId, activeProfile } = usePatient();
  const { data: meds, refresh, error: medsLoadError } = useData<any[]>(activeProfileId ? `/api/medications?profileId=${activeProfileId}` : null);
  const { data: doctors, error: doctorsLoadError } = useData<any[]>(activeProfileId ? `/api/doctors?profileId=${activeProfileId}` : null);
  const { data: visits, error: visitsLoadError } = useData<any[]>(activeProfileId ? `/api/visits?profileId=${activeProfileId}` : null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState("");
  const dataError = medsLoadError?.message || doctorsLoadError?.message || visitsLoadError?.message || "";
  const visibleError = error || dataError;
  const [activeTimeSlots, setActiveTimeSlots] = useState<{
    morning: boolean;
    afternoon: boolean;
    night: boolean;
  }>({
    morning: false,
    afternoon: false,
    night: false,
  });
  
  const initialFormData = {
    name: "",
    startDate: new Date().toISOString().split('T')[0],
    durationDays: "30",
    doctor: "",
    notes: "",
    morningDosage: "",
    afternoonDosage: "",
    nightDosage: "",
    morningMeal: "",
    afternoonMeal: "",
    nightMeal: ""
  };

  const [formData, setFormData] = useState(initialFormData);

  const filteredCatalog = MEDICATION_MASTER_CATALOG.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.genericName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Medication name is required.");
      return;
    }

    try {
      if (!activeProfileId) {
        throw new Error("Please create or select a patient profile first.");
      }

      setError("");
      if (editingId) {
        const response = await authenticatedFetch(`/api/medications/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            profileId: activeProfileId
          })
        });

        if (!response.ok) {
          const message = await getResponseErrorMessage(response, "Failed to update medication");
          throw new Error(message);
        }
      } else {
        await postData("/api/medications", {
          ...formData,
          profileId: activeProfileId,
          status: "active"
        });
      }
      
      setIsAdding(false);
      setEditingId(null);
      refresh();
      setFormData(initialFormData);
      setActiveTimeSlots({ morning: false, afternoon: false, night: false });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save medication.");
    }
  };

  const handleEdit = (med: any) => {
    setFormData({
      name: med.name,
      startDate: med.startDate ? new Date(med.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      durationDays: med.durationDays?.toString() || "30",
      doctor: med.doctor || "",
      notes: med.notes || "",
      morningDosage: med.morningDosage || "",
      afternoonDosage: med.afternoonDosage || "",
      nightDosage: med.nightDosage || "",
      morningMeal: med.morningMeal || "",
      afternoonMeal: med.afternoonMeal || "",
      nightMeal: med.nightMeal || ""
    });
    setActiveTimeSlots({
      morning: !!med.morningDosage,
      afternoon: !!med.afternoonDosage,
      night: !!med.nightDosage,
    });
    setError("");
    setEditingId(med.id);
    setIsAdding(true);
  };

  const toggleTimeSlot = (slot: 'morning' | 'afternoon' | 'night') => {
    setActiveTimeSlots((current) => {
      const nextValue = !current[slot];

      if (!nextValue) {
        setFormData((prev) => ({
          ...prev,
          ...(slot === 'morning'
            ? { morningDosage: "", morningMeal: "" }
            : slot === 'afternoon'
              ? { afternoonDosage: "", afternoonMeal: "" }
              : { nightDosage: "", nightMeal: "" }),
        }));
      }

      return {
        ...current,
        [slot]: nextValue,
      };
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const response = await authenticatedFetch(`/api/medications/${deleteId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const message = await getResponseErrorMessage(response, "Failed to delete medication");
        throw new Error(message);
      }
      setDeleteId(null);
      setError("");
      refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete medication.");
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const response = await authenticatedFetch(`/api/medications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        const message = await getResponseErrorMessage(response, "Failed to update medication status");
        throw new Error(message);
      }
      setError("");
      refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update medication status.");
    }
  };

  const handleExportPDF = async () => {
    if (!meds || meds.length === 0) {
      setError("No medications to export.");
      return;
    }

    try {
      const blob = await pdf(
        <MedicationRosterPDF 
          medications={meds} 
          profileName={activeProfile?.name}
          visits={visits || []}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medication-roster-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Error generating PDF. Please try again.");
    }
  };

  const filteredMeds = meds?.filter(med => {
    if (viewMode === 'current') return med.status === 'active';
    return med.status !== 'active';
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Medications</h1>
          <p className="text-slate-500">Manage your prescriptions and daily schedules.</p>
        </div>
        <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3">
          <button 
            onClick={handleExportPDF}
            className="flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-50 transition-all shadow-sm"
          >
            <Download className="w-5 h-5" />
            Export PDF
          </button>
          <button 
            onClick={() => {
              setError("");
              setIsAdding(true);
            }}
            className="flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-200"
          >
            <Plus className="w-5 h-5" />
            Add Medication
          </button>
        </div>
      </div>

      {visibleError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold">
          {visibleError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Medications List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">
              {viewMode === 'current' ? 'Active Medications' : 'Medication History'}
            </h2>
            <div className="flex gap-2 bg-neutral-100 p-1 rounded-full">
              <button 
                onClick={() => setViewMode('current')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider transition-all",
                  viewMode === 'current' 
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm" 
                    : "text-neutral-400 hover:text-neutral-600"
                )}
              >
                Current
              </button>
              <button 
                onClick={() => setViewMode('history')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider transition-all",
                  viewMode === 'history' 
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm" 
                    : "text-neutral-400 hover:text-neutral-600"
                )}
              >
                History
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredMeds?.map((med, idx) => (
              <motion.div 
                key={med.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <Pill className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{med.name}</h3>
                      
                      {/* Timings Display */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {med.morningDosage && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                            Morning: {med.morningDosage} {med.morningDosage === "1" ? "pill" : "pills"} {med.morningMeal && `(${med.morningMeal})`}
                          </span>
                        )}
                        {med.afternoonDosage && (
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                            Afternoon: {med.afternoonDosage} {med.afternoonDosage === "1" ? "pill" : "pills"} {med.afternoonMeal && `(${med.afternoonMeal})`}
                          </span>
                        )}
                        {med.nightDosage && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                            Night: {med.nightDosage} {med.nightDosage === "1" ? "pill" : "pills"} {med.nightMeal && `(${med.nightMeal})`}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(med.startDate)} - {med.endDate ? formatDate(med.endDate) : 'Ongoing'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                          <UserRound className="w-3.5 h-3.5" />
                          <span>{med.doctor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {viewMode === 'current' ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(med.id, 'completed');
                        }}
                        className="p-2 hover:bg-green-50 rounded-lg transition-colors text-neutral-400 hover:text-green-600"
                        title="Mark as Completed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusUpdate(med.id, 'active');
                        }}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-neutral-400 hover:text-blue-600"
                        title="Restore to Active"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(med);
                      }}
                      className="p-2 hover:bg-indigo-50 rounded-lg transition-colors text-neutral-400 hover:text-indigo-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(med.id);
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-neutral-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-6 h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full w-1/2" />
                </div>
              </motion.div>
            ))}
            {(!filteredMeds || filteredMeds.length === 0) && (
              <div className="p-12 bg-white rounded-3xl border-2 border-dashed border-neutral-200 text-center">
                <p className="text-neutral-500 italic">
                  {viewMode === 'current' ? 'No active medications found.' : 'No medication history found.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Today's Schedule Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800">Today's Schedule</h2>
          <div className="space-y-4">
            {meds?.filter(m => m.status === 'active').map((med, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm relative overflow-hidden">
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1",
                  med.status === "taken" ? "bg-green-500" : "bg-neutral-300"
                )} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Scheduled</span>
                    <div className="flex items-center gap-2">
                      {med.status === "taken" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(med.id);
                        }}
                        className="p-1 hover:bg-red-50 rounded text-neutral-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="font-bold text-slate-800">{med.name}</p>
                  
                  {/* Timing Info in Schedule */}
                  <div className="flex gap-1 mt-1">
                    {med.morningDosage && <span className="text-[9px] font-bold text-blue-500 uppercase">M: {med.morningDosage} {med.morningDosage === "1" ? "pill" : "pills"}</span>}
                    {med.afternoonDosage && <span className="text-[9px] font-bold text-orange-500 uppercase">A: {med.afternoonDosage} {med.afternoonDosage === "1" ? "pill" : "pills"}</span>}
                    {med.nightDosage && <span className="text-[9px] font-bold text-indigo-500 uppercase">N: {med.nightDosage} {med.nightDosage === "1" ? "pill" : "pills"}</span>}
                  </div>

                  {med.status !== "taken" && (
                    <button className="mt-3 w-full py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold rounded-lg hover:from-indigo-600 hover:to-violet-600 transition-all">
                      Mark as Taken
                    </button>
                  )}
                </div>
              </div>
            ))}
            {(!meds || meds.filter(m => m.status === 'active').length === 0) && (
              <div className="p-8 bg-white rounded-2xl border-2 border-dashed border-neutral-100 text-center">
                <p className="text-neutral-400 text-xs italic">No active medications scheduled.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Medication Modal */}
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
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">
                  {editingId ? "Edit Medication" : "Add New Medication"}
                </h2>
                <button 
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setFormData(initialFormData);
                    setActiveTimeSlots({ morning: false, afternoon: false, night: false });
                    setError("");
                  }} 
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-neutral-400" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold">
                    {error}
                  </div>
                )}

                {/* Search Master Catalog */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Medication Name *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input 
                      type="text" 
                      placeholder="Search by name or generic..." 
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-transparent outline-none transition-all"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({...formData, name: e.target.value});
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                    />
                  </div>
                  
                      {showDropdown && searchQuery && filteredCatalog.length > 0 && (
                    <div className="mt-2 border border-neutral-100 rounded-xl overflow-hidden shadow-lg bg-white">
                      {filteredCatalog.map((med, idx) => (
                        <div key={idx} className="border-b border-neutral-50 last:border-0">
                          <div className="px-4 py-2 bg-neutral-50 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                            {med.name} ({med.category})
                          </div>
                          {med.commonDosages.map((strength, sIdx) => (
                            <button 
                              key={sIdx}
                              className="w-full px-4 py-3 text-left hover:bg-neutral-50 flex items-center justify-between group"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  name: `${med.name} ${strength}`,
                                  morningDosage: "1",
                                  afternoonDosage: "",
                                  nightDosage: ""
                                });
                                setSearchQuery("");
                                setShowDropdown(false);
                              }}
                            >
                              <div>
                                <p className="font-bold text-neutral-900">{med.name} {strength}</p>
                                <p className="text-xs text-neutral-500">{med.genericName}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900 transition-colors" />
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Timing & Dosage Options */}
                <div className="space-y-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Dosage & Timing</h3>
                  <div className="flex flex-wrap gap-3">
                    {([
                      { key: 'morning', label: 'Morning' },
                      { key: 'afternoon', label: 'Afternoon' },
                      { key: 'night', label: 'Night' },
                    ] as const).map((slot) => (
                      <button
                        key={slot.key}
                        type="button"
                        onClick={() => toggleTimeSlot(slot.key)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all",
                          activeTimeSlots[slot.key]
                            ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-indigo-500"
                            : "bg-white text-neutral-500 border-neutral-200 hover:border-indigo-300"
                        )}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Morning */}
                  {activeTimeSlots.morning && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Morning Pills (Qty)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 1" 
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-300"
                          value={formData.morningDosage}
                          onChange={(e) => setFormData({...formData, morningDosage: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Morning Timing</label>
                        <select 
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-300"
                          value={formData.morningMeal}
                          onChange={(e) => setFormData({...formData, morningMeal: e.target.value})}
                        >
                          <option value="">None</option>
                          <option value="Before Meal">Before Meal</option>
                          <option value="After Meal">After Meal</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Afternoon */}
                  {activeTimeSlots.afternoon && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Afternoon Pills (Qty)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 1" 
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-300"
                          value={formData.afternoonDosage}
                          onChange={(e) => setFormData({...formData, afternoonDosage: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Afternoon Timing</label>
                        <select 
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-300"
                          value={formData.afternoonMeal}
                          onChange={(e) => setFormData({...formData, afternoonMeal: e.target.value})}
                        >
                          <option value="">None</option>
                          <option value="Before Meal">Before Meal</option>
                          <option value="After Meal">After Meal</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Night */}
                  {activeTimeSlots.night && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Night Pills (Qty)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 1" 
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-300"
                          value={formData.nightDosage}
                          onChange={(e) => setFormData({...formData, nightDosage: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Night Timing</label>
                        <select 
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-300"
                          value={formData.nightMeal}
                          onChange={(e) => setFormData({...formData, nightMeal: e.target.value})}
                        >
                          <option value="">None</option>
                          <option value="Before Meal">Before Meal</option>
                          <option value="After Meal">After Meal</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Duration (Days)</label>
                    <input 
                      type="number" 
                      placeholder="30" 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300"
                      value={formData.durationDays}
                      onChange={(e) => setFormData({...formData, durationDays: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Prescribing Doctor</label>
                  <select 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 appearance-none"
                    value={formData.doctor}
                    onChange={(e) => setFormData({...formData, doctor: e.target.value})}
                  >
                    <option value="">Select a doctor...</option>
                    {doctors?.map((doctor) => (
                      <option key={doctor.id} value={doctor.name}>
                        {doctor.name} - {doctor.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Notes (Optional)</label>
                  <textarea 
                    placeholder="e.g. Take with food, avoid alcohol..." 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 min-h-[100px] resize-none"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex flex-col-reverse sm:flex-row gap-3">
                <button 
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setFormData(initialFormData);
                  }}
                  className="flex-1 py-3 text-neutral-600 font-bold hover:bg-neutral-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-200"
                >
                  {editingId ? "Update Medication" : "Save Medication"}
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
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Delete Medication?</h3>
              <p className="text-neutral-500 mb-6">This action cannot be undone. All schedule history for this medication will be lost.</p>
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
