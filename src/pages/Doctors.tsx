import React, { useState } from "react";
import { Plus, UserRound, Phone, Mail, MapPin, MoreVertical, Search, ChevronRight, Pill, Calendar, XCircle, Building2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useData, postData } from "@/hooks/useData";

export default function DoctorsPage() {
  const { data: doctors, refresh } = useData<any[]>("/api/doctors");
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    hospital: "",
    phone: "",
    email: "",
    address: ""
  });

  const handleSave = async () => {
    try {
      await postData("/api/doctors", formData);
      setIsAdding(false);
      refresh();
      setFormData({
        name: "",
        specialty: "",
        hospital: "",
        phone: "",
        email: "",
        address: ""
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">My Doctors</h1>
          <p className="text-neutral-500">Manage your healthcare team and contact information.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200"
        >
          <Plus className="w-5 h-5" />
          Add Doctor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors?.map((doc) => (
          <motion.div 
            key={doc.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <button className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
                <MoreVertical className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-500">
                <UserRound className="w-10 h-10" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-neutral-900">{doc.name}</h3>
                <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mt-1">{doc.specialty}</p>
              </div>

              <div className="w-full pt-4 space-y-3 border-t border-neutral-50">
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <Building2 className="w-4 h-4 text-neutral-400" />
                  <span className="font-medium">{doc.hospital || doc.clinic}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <Phone className="w-4 h-4 text-neutral-400" />
                  <span className="font-medium">{doc.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <Mail className="w-4 h-4 text-neutral-400" />
                  <span className="font-medium truncate">{doc.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-2">
                <button className="flex items-center justify-center gap-2 py-2.5 bg-neutral-100 text-neutral-900 rounded-xl font-bold text-xs hover:bg-neutral-200 transition-all">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message
                </button>
                <button className="flex items-center justify-center gap-2 py-2.5 bg-neutral-900 text-white rounded-xl font-bold text-xs hover:bg-neutral-800 transition-all">
                  <Calendar className="w-3.5 h-3.5" />
                  Book Visit
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {(!doctors || doctors.length === 0) && (
          <div className="col-span-full p-12 bg-white rounded-3xl border-2 border-dashed border-neutral-200 text-center">
            <p className="text-neutral-500 italic">No doctors added yet.</p>
          </div>
        )}
      </div>

      {/* Add Doctor Modal */}
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
                <h2 className="text-xl font-bold text-neutral-900">Add New Doctor</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-neutral-400" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Dr. Sarah Smith" 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-neutral-900"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Specialty</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Cardiology" 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-neutral-900"
                      value={formData.specialty}
                      onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Clinic/Hospital</label>
                    <input 
                      type="text" 
                      placeholder="e.g. City Heart Center" 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-neutral-900"
                      value={formData.hospital}
                      onChange={(e) => setFormData({...formData, hospital: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="+1..." 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-neutral-900"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="doctor@example.com" 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-neutral-900"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex gap-3">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 text-neutral-600 font-bold hover:bg-neutral-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200"
                >
                  Save Doctor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
