import React, { useState } from "react";
import { Plus, FileText, Search, Filter, Calendar, UserRound, MoreVertical, Download, Eye, XCircle, Activity } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useData } from "@/hooks/useData";
import { usePatient } from "@/context/PatientContext";
import { authenticatedFetch, getResponseErrorMessage } from "@/lib/apiClient";

export default function ReportsPage() {
  const { activeProfileId } = usePatient();
  const { data: reports, refresh, error: reportsError } = useData<any[]>(activeProfileId ? `/api/reports?profileId=${activeProfileId}` : null);
  const { data: doctors, error: doctorsError } = useData<any[]>(activeProfileId ? `/api/doctors?profileId=${activeProfileId}` : null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const dataError = reportsError?.message || doctorsError?.message || "";
  const visibleError = error || dataError;
  
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
      if (!activeProfileId) {
        throw new Error("Please select a profile first.");
      }

      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("date", formData.date);
      payload.append("type", formData.type);
      payload.append("doctorId", formData.doctorId);
      payload.append("result", formData.result);
      payload.append("status", formData.status);
      payload.append("profileId", activeProfileId);
      if (selectedFile) {
        payload.append("file", selectedFile);
      }

      const response = await authenticatedFetch(editingId ? `/api/reports/${editingId}` : "/api/reports", {
        method: editingId ? "PUT" : "POST",
        body: payload,
      });

      if (!response.ok) {
        const message = await getResponseErrorMessage(response, "Failed to save report");
        throw new Error(message);
      }

      setIsUploading(false);
      setEditingId(null);
      setSelectedFile(null);
      setError("");
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
      setError(err instanceof Error ? err.message : "Failed to upload report.");
    }
  };

  const handleEdit = (report: any) => {
    setError("");
    setEditingId(report.id);
    setFormData({
      title: report.title || "",
      date: report.date ? new Date(report.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      type: report.type || "Lab Report",
      doctorId: report.doctorId || "",
      result: report.result || "",
      status: report.status || "completed",
    });
    setSelectedFile(null);
    setIsUploading(true);
  };

  const handleArchive = async (report: any) => {
    try {
      const payload = new FormData();
      payload.append("status", report.status === "archived" ? "completed" : "archived");

      const response = await authenticatedFetch(`/api/reports/${report.id}`, {
        method: "PUT",
        body: payload,
      });

      if (!response.ok) {
        const message = await getResponseErrorMessage(response, "Failed to update report status");
        throw new Error(message);
      }

      await refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to archive report.");
    }
  };

  const resetModal = () => {
    setIsUploading(false);
    setEditingId(null);
    setSelectedFile(null);
    setError("");
    setFormData({
      title: "",
      date: new Date().toISOString().split('T')[0],
      type: "Lab Report",
      doctorId: "",
      result: "",
      status: "completed"
    });
  };

  const filteredReports = reports?.filter(report => 
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeReports = filteredReports?.filter((report) => report.status !== "archived") || [];
  const archivedReports = filteredReports?.filter((report) => report.status === "archived") || [];

  const getReportFileUrl = (report: any) => report.signedFileUrl || report.fileUrl;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Test Reports</h1>
          <p className="text-slate-500">Upload and organize your medical test results and lab reports.</p>
        </div>
        <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3">
          <button 
            onClick={() => {
              resetModal();
              setIsUploading(true);
            }}
            className="flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 bg-linear-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-200"
          >
            <Plus className="w-5 h-5" />
            Upload Report
          </button>
          <button
            onClick={() => setShowArchivedModal(true)}
            className="flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-50 transition-all shadow-sm"
          >
            <ArchiveIcon />
            Archived Reports
          </button>
        </div>
      </div>

      {visibleError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold">
          {visibleError}
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search reports by name or type..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-transparent outline-none transition-all shadow-sm"
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
        {activeReports?.map((report, idx) => (
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
                  {getReportFileUrl(report) && (
                    <a
                      href={getReportFileUrl(report)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-white rounded-full text-indigo-600 shadow-lg hover:scale-110 transition-transform"
                    >
                      <Eye className="w-5 h-5" />
                    </a>
                  )}
                  {getReportFileUrl(report) && (
                    <a
                      href={getReportFileUrl(report)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-white rounded-full text-indigo-600 shadow-lg hover:scale-110 transition-transform"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleEdit(report)}
                    className="p-2 bg-white rounded-full text-indigo-600 shadow-lg hover:scale-110 transition-transform"
                    type="button"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                {report.type}
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-lg leading-tight">{report.title}</h3>
                <button
                  onClick={() => handleArchive(report)}
                  className="p-1 px-2 hover:bg-neutral-100 rounded-lg transition-colors text-xs font-bold text-neutral-500"
                >
                  {report.status === "archived" ? "Unarchive" : "Archive"}
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
                {report.doctor?.name && (
                  <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                    <UserRound className="w-3.5 h-3.5" />
                    <span>Doctor: {report.doctor.name}</span>
                  </div>
                )}
                {report.fileName && (
                  <div className="text-xs text-neutral-500 font-medium">
                    File: {report.fileName}
                  </div>
                )}
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Status: {report.status}
                </div>
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

      {/* Archived Reports Modal */}
      <AnimatePresence>
        {showArchivedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowArchivedModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Archived Reports</h2>
                <button onClick={() => setShowArchivedModal(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-neutral-400" />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                {archivedReports.length > 0 ? (
                  archivedReports.map((report) => (
                    <div key={report.id} className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-800">{report.title}</h3>
                        <p className="text-sm text-neutral-500">{formatDate(report.date)} • {report.type}</p>
                        {report.doctor?.name && (
                          <p className="text-xs text-neutral-500">Doctor: {report.doctor.name}</p>
                        )}
                        {report.fileName && (
                          <p className="text-xs text-neutral-500">File: {report.fileName}</p>
                        )}
                      </div>
                      <div className="flex w-full sm:w-auto gap-2 shrink-0">
                        {getReportFileUrl(report) && (
                          <a
                            href={getReportFileUrl(report)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-white rounded-full text-indigo-600 shadow hover:scale-105 transition-transform"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleArchive(report)}
                          className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all w-full sm:w-auto"
                        >
                          Unarchive
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200 text-center">
                    <p className="text-neutral-500 italic">No archived reports found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-neutral-100 flex items-center justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">{editingId ? "Edit Test Report" : "Upload Test Report"}</h2>
                <button onClick={resetModal} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-neutral-400" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold">
                    {error}
                  </div>
                )}

                <label className="border-2 border-dashed border-neutral-200 rounded-2xl p-6 sm:p-12 flex flex-col items-center justify-center text-center gap-4 hover:border-indigo-400 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <Plus className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Click to select or drag and drop</p>
                    <p className="text-xs text-neutral-500 mt-1">JPEG, PNG or PDF (Max 10MB)</p>
                    {selectedFile && <p className="text-xs text-indigo-600 mt-2">Selected: {selectedFile.name}</p>}
                  </div>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </label>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Report Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Blood Test Results" 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Test Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Report Type</label>
                    <select 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 appearance-none"
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
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Doctor (Optional)</label>
                  <select 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 appearance-none"
                    value={formData.doctorId}
                    onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                  >
                    <option value="">Select doctor...</option>
                    {doctors?.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Result Summary (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Normal, High Glucose" 
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300" 
                    value={formData.result}
                    onChange={(e) => setFormData({...formData, result: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-4 sm:p-6 bg-neutral-50 border-t border-neutral-100 flex flex-col-reverse sm:flex-row gap-3">
                <button 
                  onClick={resetModal}
                  className="flex-1 py-3 text-neutral-600 font-bold hover:bg-neutral-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-3 bg-linear-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-200"
                >
                  {editingId ? "Update Report" : "Save Report"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8h14v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
      <path d="M10 12h4" />
    </svg>
  );
}
