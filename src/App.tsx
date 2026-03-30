import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Medications from "./pages/Medications";
import Doctors from "./pages/Doctors";
import Reports from "./pages/Reports";
import Visits from "./pages/Visits";
import Profiles from "./pages/Profiles";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PatientProvider } from "./context/PatientContext";

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <PatientProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/medications" element={<Medications />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/visits" element={<Visits />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profiles" element={<Profiles />} />
        </Routes>
      </Layout>
    </PatientProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
