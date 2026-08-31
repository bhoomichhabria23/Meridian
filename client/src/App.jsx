import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

/* =========================================================
   PUBLIC PAGES
========================================================= */

import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";

/* =========================================================
   PATIENT PAGES
========================================================= */

import PatientDashboard from "./pages/patient/Dashboard";
import PatientTimeline from "./pages/patient/Timeline";
import PatientHistory from "./pages/patient/MedicalHistory";
import PatientMedication from "./pages/patient/Medication";
import PatientPrescription from "./pages/patient/Prescription";
import PatientReports from "./pages/patient/Reports";
import PatientAppointments from "./pages/patient/Appointments";
import PatientReminders from "./pages/patient/Reminders";
import PatientProfile from "./pages/patient/Profile";
import PatientAssistant from "./pages/patient/Assistant";
import PatientNotifications from "./pages/patient/Notifications";
import PatientLabResults from "./pages/patient/LabResults";

/* =========================================================
   DOCTOR PAGES
========================================================= */

import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorPatient from "./pages/doctor/PatientProfile";
import DoctorPrescription from "./pages/doctor/NewPrescription";

/* =========================================================
   RECEPTIONIST PAGES
========================================================= */

import ReceptionDashboard from "./pages/reception/Dashboard";
import ReceptionBook from "./pages/reception/BookAppointment";
import ReceptionUpload from "./pages/reception/UploadReport";


/* =========================================================
   LOADING
========================================================= */

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7faf8]">

      <div className="relative h-11 w-11">

        <div className="absolute inset-0 rounded-full border-2 border-green-100" />

        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#159447]" />

      </div>

    </div>
  );
}


/* =========================================================
   DASHBOARD PATH
========================================================= */

function getDashboardPath(user) {

  if (!user) {
    return "/login";
  }

  if (user.role === "patient") {
    return "/patient/dashboard";
  }

  if (user.role === "doctor") {
    return "/doctor/dashboard";
  }

  if (user.role === "receptionist") {
    return "/reception/dashboard";
  }

  return "/";
}


/* =========================================================
   PROTECTED ROUTE
========================================================= */

function ProtectedRoute({ children, role }) {

  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return (
      <Navigate
        to={getDashboardPath(user)}
        replace
      />
    );
  }

  return children;
}


/* =========================================================
   ROUTES
========================================================= */

function AppRoutes() {

  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  return (
    <Routes>

      {/* =====================================================
          PUBLIC
      ===================================================== */}

      <Route
        path="/"
        element={<Home />}
      />

      <Route path="/features" element={<Features />} />
      <Route path="/how-it-works" element={<HowItWorks />} />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={
          user ? (
            <Navigate
              to={getDashboardPath(user)}
              replace
            />
          ) : (
            <RegisterPage />
          )
        }
      />


      {/* =====================================================
          PATIENT
      ===================================================== */}

      <Route
        path="/patient/dashboard"
        element={
          <ProtectedRoute role="patient">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/timeline"
        element={
          <ProtectedRoute role="patient">
            <PatientTimeline />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/history"
        element={
          <ProtectedRoute role="patient">
            <PatientHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/medications"
        element={
          <ProtectedRoute role="patient">
            <PatientMedication />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/prescriptions"
        element={
          <ProtectedRoute role="patient">
            <PatientPrescription />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/reports"
        element={
          <ProtectedRoute role="patient">
            <PatientReports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/labs"
        element={
          <ProtectedRoute role="patient">
            <PatientLabResults />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/appointments"
        element={
          <ProtectedRoute role="patient">
            <PatientAppointments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/reminders"
        element={
          <ProtectedRoute role="patient">
            <PatientReminders />
          </ProtectedRoute>
        }
      />

      <Route path="/patient/profile" element={<ProtectedRoute role="patient"><PatientProfile /></ProtectedRoute>} />
      <Route path="/patient/assistant" element={<ProtectedRoute role="patient"><PatientAssistant /></ProtectedRoute>} />
      <Route path="/patient/notifications" element={<ProtectedRoute role="patient"><PatientNotifications /></ProtectedRoute>} />


      {/* =====================================================
          DOCTOR
      ===================================================== */}

      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute role="doctor">
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/patient/:id"
        element={
          <ProtectedRoute role="doctor">
            <DoctorPatient />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/prescription/:id"
        element={
          <ProtectedRoute role="doctor">
            <DoctorPrescription />
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          RECEPTIONIST
      ===================================================== */}

      <Route
        path="/reception/dashboard"
        element={
          <ProtectedRoute role="receptionist">
            <ReceptionDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reception/book"
        element={
          <ProtectedRoute role="receptionist">
            <ReceptionBook />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reception/upload"
        element={
          <ProtectedRoute role="receptionist">
            <ReceptionUpload />
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          FALLBACK
      ===================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to={user ? getDashboardPath(user) : "/"}
            replace
          />
        }
      />

    </Routes>
  );
}


/* =========================================================
   APP
========================================================= */

export default function App() {

  return (
    <AuthProvider>

      <BrowserRouter>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,

            style: {
              borderRadius: "12px",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "14px",
            },
          }}
        />

        <AppRoutes />

      </BrowserRouter>

    </AuthProvider>
  );
}