import React, { useState } from "react";
import { Plus, FileText, Search, Filter, Calendar, UserRound, MoreVertical, Download, Eye, Trash2, XCircle, Activity } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useData, postData } from "@/hooks/useData";
import { usePatient } from "@/context/PatientContext";

export default function ReportsPage() {
  const { activeProfileId } = usePatient();
  const { data: reports, refresh } = useData<any[]>(activeProfileId ? `/api/reports?profileId=${activeProfileId}` : null);
  const { data: doctors } = useData<any[]>("/api/doctors");
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split('T')[0],
    type: "Lab Report",
    doctorId: "",
    result: "",
    status: "completed"
  });

  const handleSave = async () => {
    try {
      await postData("/api/reports", {
        ...formData,
        profileId: activeProfileId
      });
      setIsUploading(false);
      refresh();
      setFormData({
        title: "",
        date: new Date().toISOString().split('T')[0],
        type: "Lab Report",
        doctorId: "",
        result: "",
        status: "completed"
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredReports = reports?.filter(report => 
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Test Reports</h1>
          <p className="text-neutral-500">Upload and organize your medical test results and lab reports.</p>
        </div>
        <button 
          onClick={() => setIsUploading(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200"
        >
          <Plus className="w-5 h-5" />
          Upload Report
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search reports by name or type..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all shadow-sm">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports?.map((report, idx) => (
          <motion.div 
            key={report.id || idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group bg-white rounded-3xl border border-neutral-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            <div className="aspect-video bg-neutral-100 flex items-center justify-center relative overflow-hidden">
              <FileText className="w-12 h-12 text-neutral-300 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <button className="p-2 bg-white rounded-full text-neutral-900 shadow-lg hover:scale-110 transition-transform">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button className="p-2 bg-white rounded-full text-neutral-900 shadow-lg hover:scale-110 transition-transform">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                {report.type}
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-neutral-900 text-lg leading-tight">{report.title}</h3>
                <button className="p-1 hover:bg-neutral-100 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(report.date)}</span>
                </div>
                {report.result && (
                  <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Result: {report.result}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {(!filteredReports || filteredReports.length === 0) && (
          <div className="col-span-full p-12 bg-white rounded-3xl border-2 border-dashed border-neutral-200 text-center">
            <p className="text-neutral-500 italic">No reports found.</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploading(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-neutral-900">Upload Test Report</h2>
                <button onClick={() => setIsUploading(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-neutral-400" />
                </button>
              </div>
              
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4 hover:border-neutral-900 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                    <Plus className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900">Click to select or drag and drop</p>
                    <p className="text-xs text-neutral-500 mt-1">JPEG, PNG or PDF (Max 10MB)</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Report Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Blood Test Results" 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-neutral-900" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Test Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-neutral-900" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Report Type</label>
                    <select 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-neutral-900 appearance-none"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option>Lab Report</option>
                      <option>Imaging</option>
                      <option>Prescription</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Result Summary (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Normal, High Glucose" 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-neutral-900" 
                    value={formData.result}
                    onChange={(e) => setFormData({...formData, result: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex gap-3">
                <button 
                  onClick={() => setIsUploading(false)}
                  className="flex-1 py-3 text-neutral-600 font-bold hover:bg-neutral-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-3 bg-neutral-900 text-white font-bold rounded-xl hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200"
                >
                  Save Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
