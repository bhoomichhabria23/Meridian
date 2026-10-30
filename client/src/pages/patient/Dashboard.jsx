import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  Activity,
  AlertTriangle,
  Bell,
  Camera,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  FileImage,
  FileText,
  Heart,
  HelpCircle,
  LayoutDashboard,
  Leaf,
  LineChart,
  Pill,
  Share2,
  ShieldCheck,
  TestTube2,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { auth } from "../../firebase";
import { API_BASE_URL } from "../../api/config";
import Navbar from "../../components/Navbar";
import { fetchProfile } from "../../services/profileService";
import { exchangeFirebaseSession } from "../../services/authSessionService";
import { deleteReport, downloadReport, fetchReports, uploadReport } from "../../services/reportService";
import { useAuth } from "../../context/AuthContext";
import { loadPatientTimeline } from "../../services/timelineService";


/* ============================================================
   DEFAULT DATA
============================================================ */

const emptyPatient = {
  name: "Patient",
  patientId: "—",
  age: "—",
  gender: "—",
  bloodGroup: "—",
  phone: "—",
  height: "",
  weight: "",
  bmi: "",
  profileImage: "",
};
const formatHeight = (centimeters) => {
  const totalInches = Number(centimeters) / 2.54;
  if (!Number.isFinite(totalInches) || totalInches <= 0) return "";
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return `${inches === 12 ? feet + 1 : feet}' ${inches === 12 ? 0 : inches}"`;
};
const formatUploadDateTime = (value) => {
  const date = value?.toDate ? value.toDate() : new Date(value);
  return value && !Number.isNaN(date.getTime())
    ? date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Uploaded report";
};
const isUpcomingAppointment = (appointment) => {
  const date = new Date(appointment.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(date.getTime()) && date >= today && !["cancelled", "completed"].includes(String(appointment.status || "").toLowerCase());
};
const mergeReports = (...reportLists) => reportLists.flat().filter((report, index, all) => {
  const reportKey = report._id || report.reportId || report.id || report.fileName;
  return index === all.findIndex((item) => String(item._id || item.reportId || item.id || item.fileName) === String(reportKey));
});
const apiOrigin = (API_BASE_URL || "http://localhost:5000").replace(/\/api\/?$/, "").replace(/\/$/, "");
const fetchPatientApi = async (path) => {
  const response = await fetch(`${apiOrigin}${path}`, { credentials: "include" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Unable to load ${path}`);
  return payload?.success && Object.hasOwn(payload, "data") ? payload.data : payload;
};

function UpcomingCarePanel({ appointments, reminders, onBook, onViewAppointments, onViewReminders }) {
  const upcomingAppointments = appointments
    .filter(isUpcomingAppointment)
    .sort((first, second) => new Date(first.date) - new Date(second.date))
    .slice(0, 3);
  const testReminders = reminders
    .filter((reminder) => reminder.type === "lab_test" && reminder.status === "active")
    .sort((first, second) => new Date(first.date) - new Date(second.date))
    .slice(0, 3);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardHeading icon={<CalendarDays size={17} />} title="Upcoming Care" />
        <button type="button" onClick={onBook} className="rounded-lg border border-[#cfe5d5] px-3 py-2 text-[11px] font-semibold text-[#159447] hover:bg-[#f1faf3]">
          Book appointment
        </button>
      </div>

      {upcomingAppointments.length === 0 && testReminders.length === 0 ? (
        <div className="flex min-h-[230px] flex-col items-center justify-center rounded-xl bg-[#fbfdfb] px-4 text-center">
          <CalendarDays size={30} className="text-[#b9dec2]" />
          <p className="mt-3 text-sm font-semibold text-gray-600">No upcoming appointments or test reminders</p>
          <p className="mt-1 text-xs text-gray-400">Saved care items will appear here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {upcomingAppointments.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#315343]">Appointments</h3>
                <button type="button" onClick={onViewAppointments} className="text-[10px] font-semibold text-[#159447]">View all</button>
              </div>
              <div className="divide-y divide-[#edf3ee]">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment._id || appointment.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#315343]">{appointment.doctorId?.userId?.name || appointment.doctorId?.name || "Care team"}</p>
                      <p className="mt-1 text-[10px] text-gray-500">{appointment.appointmentType || "Appointment"} · {formatUploadDateTime(appointment.date)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#edf8f0] px-2 py-1 text-[9px] font-semibold capitalize text-[#25854d]">{appointment.status || "scheduled"}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {testReminders.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#315343]">Test reminders</h3>
                <button type="button" onClick={onViewReminders} className="text-[10px] font-semibold text-[#159447]">View all</button>
              </div>
              <div className="divide-y divide-[#edf3ee]">
                {testReminders.map((reminder) => {
                  const reminderDate = new Date(reminder.date);
                  const isOverdue = !Number.isNaN(reminderDate.getTime()) && reminderDate < today;
                  return (
                    <div key={reminder._id || reminder.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#315343]">{reminder.title}</p>
                        <p className="mt-1 text-[10px] text-gray-500">{isOverdue ? "Overdue" : "Due"} · {formatUploadDateTime(reminder.date)}</p>
                      </div>
                      {isOverdue && <span className="shrink-0 rounded-full bg-[#fff1ec] px-2 py-1 text-[9px] font-semibold text-[#b84e35]">Overdue</span>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}


/* ============================================================
   LAB TYPES
============================================================ */

const labTypes = {
  "HbA1c (%)": {
    keys: ["HbA1c", "hba1c"],
    unit: "%",
    domain: [0, 12],
  },

  "Fasting Glucose (mg/dL)": {
    keys: [
      "Fasting Glucose",
      "fasting glucose",
      "glucose",
      "Fasting Blood Sugar",
      "FBS",
    ],
    unit: "mg/dL",
    domain: [0, 250],
  },

  "Creatinine (mg/dL)": {
    keys: ["Creatinine", "creatinine"],
    unit: "mg/dL",
    domain: [0, 5],
  },

  "LDL Cholesterol (mg/dL)": {
    keys: [
      "LDL",
      "LDL Cholesterol",
      "ldl cholesterol",
    ],
    unit: "mg/dL",
    domain: [0, 250],
  },
  "Blood Pressure (mmHg)": { keys: ["bloodPressure"], unit: "mmHg", domain: [40, 220] },
  "Heart Rate (bpm)": { keys: ["heartRate"], unit: "bpm", domain: [30, 200] },
  "Weight (kg)": { keys: ["weight"], unit: "kg", domain: [0, 250] },
};

const getLabTrendData = (labs, type, rangeMonths) => {
  const config = labTypes[type];
  const normalizeName = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - rangeMonths);
  return labs
    .filter((lab) => {
      const name = lab.type || lab.testName || lab.name || "";
      return config.keys.some((key) => normalizeName(name).includes(normalizeName(key)));
    })
    .map((lab) => {
      const rawValue = lab.value ?? lab.result ?? lab.numericValue;
      const dateValue = lab.month || lab.date || lab.createdAt || "—";
      const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
      return {
        month: Number.isNaN(date.getTime()) ? String(dateValue) : date.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
        value: Number.parseFloat(String(rawValue ?? "").replace(/,/g, "")),
        date,
      };
    })
    .filter((lab) => Number.isFinite(lab.value) && lab.value > 0 && (Number.isNaN(lab.date.getTime()) || lab.date >= cutoff))
    .sort((first, second) => first.date - second.date);
};


/* ============================================================
   DASHBOARD
============================================================ */

export default function Dashboard() {
  const navigate = useNavigate();
  const { user: sessionUser } = useAuth();

  const [patient, setPatient] = useState({
    ...emptyPatient,
    name: sessionUser?.name || sessionUser?.displayName || "Patient",
  });

  const [medications, setMedications] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [labs, setLabs] = useState([]);
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [clinicalInsights, setClinicalInsights] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedLab, setSelectedLab] =
    useState("HbA1c (%)");
  const [trendRange, setTrendRange] = useState(6);
  const initialLabSelection = useRef(false);

  const [uploadFiles, setUploadFiles] =
    useState([]);

  const [uploading, setUploading] =
    useState(false);

  const [uploadMessage, setUploadMessage] =
    useState("");

  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const isPatientOwnedReport = (report) =>
    String(report.uploadedByRole || "patient").toLowerCase() === "patient";

  /* ==========================================================
     LOAD USER DATA
  ========================================================== */

  useEffect(() => {

    let unsubscribe;

    const loadPatientData = async (user) => {
      const authenticatedUser = user || sessionUser;

      if (!authenticatedUser) {

        setLoading(false);

        return;
      }

      try {

        const loginName = sessionUser?.name || sessionUser?.displayName || user?.displayName || "Patient";
        setPatient((current) => ({ ...current, name: loginName }));

        /* ------------------------------------------------------
           PATIENT
        ------------------------------------------------------ */

        let profile;
        try {
          profile = await fetchProfile();
        } catch {
          profile = null;
        }
        if (!profile?.patient || (user?.getIdToken && profile.firebaseUid !== user.uid)) {
          if (!user?.getIdToken) throw new Error("Patient profile is unavailable for the current session.");
          const serverSession = await exchangeFirebaseSession(user, {
            role: "patient",
            name: loginName,
            phone: user?.phone || sessionUser?.phone || "",
          });
          profile = await fetchProfile(serverSession.token);
        }
        const profilePatient = profile.patient || {};
        const dateOfBirth = profilePatient.dateOfBirth ? new Date(profilePatient.dateOfBirth) : null;
        const calculatedAge = dateOfBirth && !Number.isNaN(dateOfBirth.getTime())
          ? Math.max(0, new Date().getFullYear() - dateOfBirth.getFullYear() - ((new Date().getMonth() < dateOfBirth.getMonth() || (new Date().getMonth() === dateOfBirth.getMonth() && new Date().getDate() < dateOfBirth.getDate())) ? 1 : 0))
          : "—";

        const profileName = [
          profile.name,
          profile.fullName,
          profile.displayName,
          profilePatient.userId?.name,
          loginName,
          sessionUser?.name,
          sessionUser?.displayName,
        ].find((value) => String(value || "").trim());

        setPatient({
          ...emptyPatient,
          name: String(profileName || "Patient").trim(),
          patientId: profilePatient.patientCode || profilePatient._id || profile.id || "—",
          age: profilePatient.age ?? calculatedAge,
          gender: profilePatient.gender || "—",
          bloodGroup: profilePatient.bloodGroup || "—",
          phone: profile.phone || profilePatient.phone || sessionUser?.phone || user?.phone || "—",
          height: profilePatient.height || "",
          weight: profilePatient.weight || "",
          bmi: profilePatient.bmi || "",
          profileImage: "",
        });

        const timelineIdentity = user?.uid || profile.firebaseUid || authenticatedUser.uid || authenticatedUser.firebaseUid || profile._id || profile.id;
        const timeline = await loadPatientTimeline(timelineIdentity).catch(() => ({ healthTrends: {}, insights: [] }));
        setClinicalInsights(timeline.insights || []);


        /* ------------------------------------------------------
           LOAD ALL COLLECTIONS IN PARALLEL TO REDUCE DASHBOARD WAIT
        ------------------------------------------------------ */

        const apiPatientId = profile._id || profile.id || profilePatient.userId?._id || profilePatient.userId || timelineIdentity;
        const [apiReports, diagnosisRecords, medicationRecords, labRecords, appointmentRecords, safetyRecords, reminderRecords] = await Promise.all([
          fetchReports().catch(() => []),
          fetchPatientApi(`/api/medical-records/diagnoses/${encodeURIComponent(apiPatientId)}`).catch(() => []),
          fetchPatientApi(`/api/medical-records/medications/${encodeURIComponent(apiPatientId)}`).catch(() => []),
          fetchPatientApi(`/api/medical-records/labs/${encodeURIComponent(apiPatientId)}`).catch(() => []),
          fetchPatientApi("/api/appointments").catch(() => []),
          fetchPatientApi(`/api/safety/patient/${encodeURIComponent(apiPatientId)}/alerts`).catch(() => []),
          fetchPatientApi("/api/reminders").catch(() => []),
        ]);
        const serverReportList = Array.isArray(apiReports)
          ? apiReports
          : apiReports.reports || [];
        setReports(serverReportList);

        const profileConditions = (profilePatient.conditions || []).map((item, index) => ({
          id: item._id || `profile-condition-${index}`,
          ...(typeof item === "string" ? { name: item } : item),
        }));
        const diagnosisConditions = (Array.isArray(diagnosisRecords) ? diagnosisRecords : []).map((item) => ({
          id: item._id,
          name: item.condition || item.name,
          status: item.status,
        }));
        setConditions(
          [...profileConditions, ...diagnosisConditions].filter((condition, index, all) =>
            all.findIndex((item) => String(item.name || item.condition || "").toLowerCase() === String(condition.name || condition.condition || "").toLowerCase()) === index
          )
        );

        setMedications(Array.isArray(medicationRecords) ? medicationRecords : []);

        const structuredLabs = (Array.isArray(labRecords) ? labRecords : []).flatMap((record) =>
          (record.results || []).map((result, index) => ({
            id: `${record._id || record.id}-${index}`,
            type: result.parameter || record.testName,
            testName: result.parameter || record.testName,
            value: result.value,
            unit: result.unit,
            status: result.status,
            date: record.testDate || record.createdAt,
          }))
        );
        const reportLabs = serverReportList.filter((report) => report.type === "lab").map((report) => ({
          ...report,
          type: report.testName || report.name || "Lab result",
          testName: report.testName || report.name || "Lab result",
          value: report.clinicalResult,
          status: report.resultStatus && report.resultStatus !== "not_specified" ? report.resultStatus : report.status,
        }));
        const timelineLabs = Object.entries(timeline.healthTrends || {}).flatMap(([metric, values]) => values.map((item) => ({
          id: `timeline-${metric}-${item.label}`,
          type: metric,
          value: item.value,
          unit: item.unit,
          date: item.label,
        })));
        setLabs([...structuredLabs, ...reportLabs, ...timelineLabs]);

        setAppointments(Array.isArray(appointmentRecords) ? appointmentRecords : appointmentRecords.appointments || []);
        setReminders(Array.isArray(reminderRecords) ? reminderRecords : []);

        const alertItems = Array.isArray(safetyRecords) ? safetyRecords : safetyRecords.alerts || [];
        setAlerts(alertItems.flatMap((record) => {
          const details = record.alerts || [];
          if (!details.length && record.status && record.status !== "SAFE") {
            return [{ id: record._id, type: record.status === "HIGH_RISK" ? "red" : "orange", title: record.status.replaceAll("_", " "), description: "Review this medication safety alert with your care team.", date: record.createdAt }];
          }
          return details.map((alert, index) => ({
            id: `${record._id}-${index}`,
            type: alert.severity === "HIGH" ? "red" : alert.severity === "MEDIUM" ? "orange" : "yellow",
            title: alert.type?.replaceAll("_", " ") || "Medication safety alert",
            description: alert.message || alert.recommendation || alert.evidence,
            date: record.createdAt,
          }));
        }));

      } catch (error) {

        console.error(
          "Error loading patient dashboard:",
          error
        );

      } finally {

        setLoading(false);

      }

    };


    unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          loadPatientData(user || sessionUser);
        }
      );

    const refreshOnFocus = () => {
      if (!document.hidden) loadPatientData(auth.currentUser || sessionUser);
    };
    window.addEventListener("focus", refreshOnFocus);


    return () => {

      if (unsubscribe) {
        unsubscribe();
      }
      window.removeEventListener("focus", refreshOnFocus);

    };

  }, [sessionUser]);


  /* ============================================================
     BMI
  ============================================================ */

  const bmi = useMemo(() => {

    if (patient.bmi) {
      return Number(patient.bmi).toFixed(1);
    }

    const height =
      Number(patient.height);

    const weight =
      Number(patient.weight);

    if (
      !height ||
      !weight ||
      height <= 0 ||
      weight <= 0
    ) {
      return null;
    }

    const heightMeters =
      height / 100;

    return (
      weight /
      (heightMeters * heightMeters)
    ).toFixed(1);

  }, [
    patient.height,
    patient.weight,
  ]);


  /* ============================================================
     BMI STATUS
  ============================================================ */

  const bmiStatus = useMemo(() => {

    if (!bmi) {
      return "Not available";
    }

    const value =
      Number(bmi);

    if (value < 18.5) {
      return "Underweight";
    }

    if (value < 25) {
      return "Normal";
    }

    if (value < 30) {
      return "Overweight";
    }

    return "Obese";

  }, [bmi]);


  /* ============================================================
     CURRENT LAB CONFIG
  ============================================================ */

  const currentLabConfig =
    labTypes[selectedLab];

  const availableLabType = useMemo(
    () => Object.keys(labTypes).find((type) => getLabTrendData(labs, type, trendRange).length > 0) || null,
    [labs, trendRange]
  );
  const hasLabTrendData = Boolean(availableLabType);

  useEffect(() => {
    if (!availableLabType || initialLabSelection.current) return;
    initialLabSelection.current = true;
    if (!getLabTrendData(labs, selectedLab, trendRange).length) {
      setSelectedLab(availableLabType);
    }
  }, [availableLabType, labs, selectedLab, trendRange]);


  /* ============================================================
     LAB TREND DATA
  ============================================================ */

  const labData = useMemo(
    () => getLabTrendData(labs, selectedLab, trendRange),
    [labs, selectedLab, trendRange]
  );


  /* ============================================================
     LATEST LAB
  ============================================================ */

  const latestLab = useMemo(() => {

    if (!labData.length) {
      return null;
    }

    return labData[
      labData.length - 1
    ];

  }, [labData]);


  /* ============================================================
     PREVIOUS LAB
  ============================================================ */

  const previousLab = useMemo(() => {

    if (labData.length < 2) {
      return null;
    }

    return labData[
      labData.length - 2
    ];

  }, [labData]);

  const recentPatientMeasurements = useMemo(() => {
    const labels = {
      bloodPressure: "Blood pressure",
      heartRate: "Heart rate",
      glucose: "HbA1c / glucose",
      weight: "Weight",
    };
    const latestByMetric = new Map();
    labs
      .filter((item) => labels[item.type])
      .map((item) => ({
        metric: item.type,
        label: labels[item.type],
        value: item.value,
        unit: item.unit || ({ bloodPressure: "mmHg", heartRate: "bpm", glucose: "mg/dL", weight: "kg" }[item.type] || ""),
        date: item.date,
      }))
      .sort((first, second) => new Date(second.date) - new Date(first.date))
      .forEach((item) => {
        if (!latestByMetric.has(item.metric)) latestByMetric.set(item.metric, item);
      });
    return [...latestByMetric.values()].sort((first, second) => new Date(second.date) - new Date(first.date));
  }, [labs]);


  /* ============================================================
     LAB CHANGE
  ============================================================ */

  const labChange = useMemo(() => {

    if (
      !latestLab ||
      !previousLab
    ) {
      return null;
    }

    return (
      latestLab.value -
      previousLab.value
    ).toFixed(1);

  }, [
    latestLab,
    previousLab,
  ]);


  /* ============================================================
     HEALTH SCORE
  ============================================================ */

  const healthScore = useMemo(() => {
    const profileValues = [
      patient.age !== "—" && patient.age !== "",
      patient.gender !== "—" && patient.gender !== "",
      patient.bloodGroup !== "—" && patient.bloodGroup !== "",
      Number(patient.height) > 0,
      Number(patient.weight) > 0,
      Number(patient.bmi) > 0 || Boolean(bmi),
    ];
    const profileScore = (profileValues.filter(Boolean).length / profileValues.length) * 25;
    const labScore = labs.length
      ? labs.reduce((total, lab) => {
          const status = String(lab.status || "recorded").toLowerCase();
          return total + (status === "normal" ? 45 : status === "abnormal" ? 28 : status === "critical" ? 10 : 32);
        }, 0) / labs.length
      : 0;
    const alertScore = Math.max(
      0,
      20 - alerts.filter((alert) => alert.type === "red").length * 12 - alerts.filter((alert) => alert.type === "orange").length * 7 - alerts.filter((alert) => alert.type === "yellow").length * 3,
    );
    const activityScore = Math.min(10, medications.length * 2 + appointments.length);
    return Math.round(Math.min(100, profileScore + labScore + alertScore + activityScore));
  }, [alerts, appointments.length, bmi, labs, medications.length, patient]);


  /* ============================================================
     LAB STATUS COUNTS
  ============================================================ */

  const activeMedicationCount = medications.filter((medication) => !medication.status || String(medication.status).toLowerCase() === "active").length;
  const upcomingAppointments = appointments.filter(isUpcomingAppointment);


  /* ============================================================
     FILE SELECTION
  ============================================================ */

  const handleChooseFile = () => {

    fileInputRef.current?.click();

  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 512 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        const profileImage = canvas.toDataURL("image/jpeg", 0.82);
        setPatient((current) => ({ ...current, profileImage }));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };


  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    const invalidFile = files.find((file) => !allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024);
    if (invalidFile) {
      setUploadMessage("Each file must be a PDF, JPG or PNG under 10MB.");
      setUploadFiles([]);
      return;
    }
    setUploadFiles(files);
    setUploadMessage(`${files.length} report${files.length === 1 ? "" : "s"} selected`);

  };

  const handleUploadReports = async () => {
    if (!uploadFiles.length) return;
    try {
      setUploading(true);
      setUploadMessage("Uploading reports...");
      const uploaded = await Promise.all(uploadFiles.map((file) => uploadReport(file)));
      const uploadedReports = uploaded.map((item) => item.report || item);
      setReports((currentReports) => mergeReports(uploadedReports, currentReports));
      fetchReports().then((latestReports) => {
        const serverReports = Array.isArray(latestReports) ? latestReports : latestReports.reports || [];
        setReports((currentReports) => mergeReports(currentReports, serverReports));
      }).catch(() => {});
      setUploadFiles([]);
      setUploadMessage("Reports uploaded successfully.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setUploadMessage(error.message || "Unable to upload reports.");
    } finally {
      setUploading(false);
    }
  };


  const clearSelectedFile = () => {

    setUploadFiles([]);

    setUploadMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

  };

  const handleDeleteReport = async (report) => {
    const reportId = report._id || report.reportId || report.id;
    if (!reportId || !window.confirm(`Delete ${report.name || report.fileName || "this report"}?`)) return;
    try {
      await deleteReport(reportId);
      setReports((currentReports) => currentReports.filter((item) => String(item._id || item.id || item.reportId) !== String(reportId)));
      setUploadMessage("Report deleted successfully.");
    } catch (error) {
      setUploadMessage(error.message || "Unable to delete report.");
    }
  };

  const handleDownloadReport = async (report) => {
    try {
      await downloadReport(report);
    } catch (error) {
      setUploadMessage(error.message || "Unable to download report.");
    }
  };

  const loadPatientSummaryRecords = async () => {
    let token;
    if (auth.currentUser) {
      const serverSession = await exchangeFirebaseSession(auth.currentUser, {
        role: "patient",
        name: patient.name,
        phone: patient.phone === "—" ? "" : patient.phone,
      });
      token = serverSession.token;
    }
    const profile = await fetchProfile(token);
    const identity = profile?._id || profile?.id || profile?.patient?.userId?._id || profile?.patient?.userId || sessionUser?.id || sessionUser?.uid || sessionUser?.firebaseUid;
    const apiOrigin = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "").replace(/\/$/, "");
    const request = async (path) => {
      if (!path) return null;
      const response = await fetch(`${apiOrigin}${path}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(`Unable to load ${path}`);
      const payload = await response.json();
      return payload?.success && "data" in payload ? payload.data : payload;
    };
    const [medicationRecords, prescriptions, labRecords, appointmentRecords, diagnoses] = await Promise.all([
      request("/api/medications"),
      request("/api/prescriptions"),
      request(identity ? `/api/medical-records/labs/${encodeURIComponent(identity)}` : null),
      request("/api/appointments"),
      request(identity ? `/api/medical-records/diagnoses/${encodeURIComponent(identity)}` : null),
    ]);
    const profileConditions = profile?.patient?.conditions || [];
    const diagnosisConditions = (Array.isArray(diagnoses) ? diagnoses : []).map((item) => ({ name: item.condition, diagnosedDate: item.diagnosedDate, status: item.status }));
    const uniqueBy = (items, getKey) => [...new Map(items.filter(Boolean).map((item) => [getKey(item).toLowerCase(), item])).values()];
    const conditionItems = [
      ...(Array.isArray(profileConditions) ? profileConditions : []),
      ...diagnosisConditions,
      ...conditions,
    ].map((item) => typeof item === "string" ? { name: item } : item);
    const prescribedMedications = (Array.isArray(prescriptions) ? prescriptions : []).flatMap((prescription) => (prescription.medications || []).map((medication) => ({
      ...medication,
      prescriptionId: prescription.prescriptionId,
      status: prescription.status,
    })));
    const structuredLabs = (Array.isArray(labRecords) ? labRecords : []).flatMap((lab) => (lab.results || []).map((result) => ({
      testName: result.parameter || lab.testName,
      value: result.value,
      unit: result.unit,
      date: lab.testDate,
    })));
    return {
      conditions: uniqueBy(conditionItems, (item) => String(item.name || item.condition || "Condition")),
      medications: uniqueBy([
        ...(Array.isArray(medicationRecords) ? medicationRecords : []),
        ...prescribedMedications,
        ...medications,
      ], (item) => `${item.name || item.medicationName || "Medication"}-${item.dosage || item.dose || ""}`),
      labs: [...structuredLabs, ...labs],
      appointments: Array.isArray(appointmentRecords) ? appointmentRecords : appointments,
      reports,
      profile,
    };
  };

  const buildPatientSummary = (records = {}) => {
    const summaryPatient = records.profile?.patient || {};
    const summaryName = records.profile?.name || patient.name;
    const summaryPatientId = summaryPatient.patientCode || patient.patientId;
    const list = (items, getLabel) => items.length ? items.map((item) => `- ${getLabel(item)}`) : ["- None recorded"];
    const valueOrUnknown = (value) => value || "Not recorded";
    return [
      "MERIDIAN PATIENT SUMMARY",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "PATIENT",
      `Name: ${valueOrUnknown(summaryName)}`,
      `Patient ID: ${valueOrUnknown(summaryPatientId)}`,
      `Age: ${valueOrUnknown(summaryPatient.age ?? patient.age)}`,
      `Gender: ${valueOrUnknown(summaryPatient.gender || patient.gender)}`,
      `Blood group: ${valueOrUnknown(summaryPatient.bloodGroup || patient.bloodGroup)}`,
      `Phone: ${valueOrUnknown(records.profile?.phone || summaryPatient.phone || patient.phone)}`,
      `Height: ${summaryPatient.height || patient.height ? `${formatHeight(summaryPatient.height || patient.height)} (${summaryPatient.height || patient.height} cm)` : "Not recorded"}`,
      `Weight: ${summaryPatient.weight || patient.weight ? `${summaryPatient.weight || patient.weight} kg` : "Not recorded"}`,
      `BMI: ${summaryPatient.bmi || bmi || "Not available"}`,
      "",
      "CONDITIONS",
      ...list(records.conditions || conditions, (item) => item.name || item.condition || "Condition"),
      "",
      "MEDICATIONS",
      ...list(records.medications || medications, (item) => [item.name || item.medicationName || "Medication", item.dosage || item.dose, item.frequency, item.timing, item.duration].filter(Boolean).join(" - ")),
      "",
      "LAB RESULTS",
      ...list(records.labs || labs, (item) => [item.testName || item.name || item.type || "Lab result", item.value, item.unit, item.date || item.testDate ? formatUploadDateTime(item.date || item.testDate) : ""].filter(Boolean).join(" - ")),
      "",
      "REPORTS",
      ...list(records.reports || reports, (item) => [item.name || item.fileName || item.testName || "Report", item.date ? formatUploadDateTime(item.date) : ""].filter(Boolean).join(" - ")),
      "",
      "APPOINTMENTS",
      ...list(records.appointments || appointments, (item) => [item.date ? formatUploadDateTime(item.date) : "Appointment", item.chiefComplaint || item.reason || item.appointmentType, item.status].filter(Boolean).join(" - ")),
    ].join("\n");
  };

  const handleShareRecords = async () => {
    const text = buildPatientSummary();
    try {
      if (navigator.share) {
        await navigator.share({ title: "Patient health summary", text });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success("Health summary copied to clipboard");
      } else {
        handleDownloadSummary();
      }
    } catch (error) {
      if (error.name !== "AbortError") toast.error("Unable to share the health summary");
    }
  };

  const handleDownloadSummary = async () => {
    try {
    const records = await loadPatientSummaryRecords();
    const blob = new Blob([buildPatientSummary(records)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safePatientId = String(records.profile?.patient?.patientCode || patient.patientId || "patient").replace(/[^a-z0-9_-]/gi, "_");
    link.href = url;
    link.download = `meridian-summary-${safePatientId}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Patient summary downloaded");
    } catch (error) {
      toast.error(error.message || "Unable to download patient summary");
    }
  };

  const recentReports = [...reports]
    .sort((first, second) => new Date(second.date || second.createdAt) - new Date(first.date || first.createdAt))
    .slice(0, 3);


  /* ============================================================
     UI
  ============================================================ */

  return (

    <div className="min-h-screen bg-[#f5faf7] text-[#183a28]">


      <Navbar />


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-[1500px] space-y-5 px-4 pb-10 pt-5 sm:px-6 lg:px-8">


        {/* ====================================================
            PATIENT HEADER
        ==================================================== */}

        <section className="rounded-[26px] border border-[#d5ebdc] bg-gradient-to-br from-white via-white to-[#edf9f0] p-5 shadow-[0_12px_40px_rgba(31,105,59,0.07)] sm:p-7">

          <div className="flex flex-col justify-between gap-6 2xl:flex-row">


            {/* PATIENT */}

            <div className="flex items-center gap-5">

              <button type="button" onClick={() => avatarInputRef.current?.click()} title="Upload profile photo" className="group relative flex h-[92px] w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#dff3e5] text-2xl font-bold text-[#25854d] shadow-[0_8px_20px_rgba(31,105,59,0.12)]">
                {patient.profileImage ? <img src={patient.profileImage} alt="Patient" className="h-full w-full object-cover" /> : patient.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#25854d] text-white"><Camera size={14} /></span>
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />


              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#25854d]">Patient overview</p>
                <h2 className="mt-1 text-[25px] font-bold tracking-tight text-[#183a28]">

                  Welcome back,{" "}

                  {patient.name}

                </h2>


                <div className="mt-3 flex flex-wrap gap-6 lg:gap-9">

                  <PatientInfo
                    label="Patient ID"
                    value={
                      patient.patientId
                    }
                  />

                  <PatientInfo
                    label="Age / Gender"
                    value={`${patient.age} Y / ${patient.gender}`}
                  />

                  <PatientInfo
                    label="Blood Group"
                    value={
                      patient.bloodGroup
                    }
                  />

                  <PatientInfo
                    label="Phone"
                    value={
                      patient.phone
                    }
                  />

                </div>


                <div className="mt-3 flex flex-wrap gap-2">

                  <Tag>

                    Height:{" "}

                    {patient.height
                      ? formatHeight(patient.height)
                      : "—"}

                  </Tag>


                  <Tag>

                    Weight:{" "}

                    {patient.weight
                      ? `${patient.weight} kg`
                      : "—"}

                  </Tag>


                  <Tag>

                    BMI:{" "}

                    <span className="font-bold text-[#159447]">

                      {bmi
                        ? `${bmi} (${bmiStatus})`
                        : "Not available"}

                    </span>

                  </Tag>

                </div>

              </div>

            </div>


            {/* HEALTH SCORE */}

              <div className="w-full rounded-2xl border border-[#d5ebdc] bg-white/80 p-4 shadow-sm 2xl:w-[235px]">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f7ed] text-[#159447]">

                  <Activity size={24} />

                </div>


                <div className="flex-1">

                  <p className="text-[12px] text-gray-500">

                    Health Score

                  </p>


                  <div className="flex items-end gap-1">

                    <strong className="text-[29px] font-bold">

                      {healthScore}

                    </strong>

                    <span className="mb-1 text-[12px] text-gray-400">

                      /100

                    </span>

                  </div>

                </div>


                <span className="text-[12px] font-semibold text-[#159447]">

                  {healthScore >= 80
                    ? "Good"
                    : healthScore >= 60
                    ? "Fair"
                    : "Needs Attention"}

                </span>

              </div>


              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">

                <div
                  className="h-full rounded-full bg-[#159447] transition-all duration-500"
                  style={{
                    width:
                      `${healthScore}%`,
                  }}
                />

              </div>


              <p className="mt-2 text-[11px] text-gray-500">

                {healthScore >= 80
                  ? "Your profile and recent records are looking healthy."
                  : "Complete your profile and review your recent health records."}

              </p>

            </div>


            {/* CONDITIONS */}

              <div className="w-full rounded-2xl border border-[#cfe9d6] bg-gradient-to-br from-[#f8fff9] to-[#eaf7ed] p-4 shadow-sm 2xl:w-[210px]">

              <MiniMetric
                icon={
                  <Heart size={19} />
                }
                title="Active Conditions"
                value={
                  conditions.length
                }
                subtitle="Managed"
              />


              <div className="my-3 h-px bg-[#d9eddd]" />


              <MiniMetric
                icon={
                  <Pill size={19} />
                }
                title="Total Medications"
                value={activeMedicationCount}
                subtitle="Active"
              />

            </div>

          </div>

        </section>


        {/* ====================================================
            MAIN GRID
        ==================================================== */}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1.45fr_1fr]">


          {/* ==================================================
              LEFT
          ================================================== */}

          <div className="space-y-4">


            {/* HEALTH GLANCE */}

            <DashboardCard>

              <CardHeading
                icon={
                  <LineChart size={17} />
                }
                title="Health At a Glance"
              />


              <div className="mt-4 grid grid-cols-3 gap-2">

                <StatCard
                  title="Recent Labs"
                  value={
                    labs.length
                  }
                  subtitle="Available"
                  icon={TestTube2}
                />

                <StatCard
                  title="Active Conditions"
                  value={
                    conditions.length
                  }
                  subtitle="Managed"
                  icon={Heart}
                />

                <StatCard
                  title="Medications"
                  value={activeMedicationCount}
                  subtitle="Active"
                  icon={Pill}
                />

                <StatCard
                  title="Upcoming Tests"
                  value={upcomingAppointments.filter((appointment) => /test|lab/i.test(appointment.appointmentType || appointment.type || "")).length}
                  subtitle="Due Soon"
                  icon={TestTube2}
                />

                <StatCard
                  title="Appointments"
                  value={upcomingAppointments.length}
                  subtitle="Scheduled"
                  icon={CalendarDays}
                />

                <StatCard
                  title="Critical Alerts"
                  value={
                    alerts.filter(
                      (a) =>
                        a.type === "red"
                    ).length
                  }
                  subtitle="Right Now"
                  icon={AlertTriangle}
                />

              </div>

            </DashboardCard>


            {/* INSIGHTS */}

            <DashboardCard className="relative overflow-hidden">

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="text-[15px] font-semibold text-[#16833d]">

                    Health Insights

                  </h3>


                  <p className="mt-3 max-w-[280px] text-[12px] leading-5 text-gray-600">

                    {clinicalInsights.length > 0
                      ? clinicalInsights[0].description
                      : labs.length > 0
                      ? "Your recent lab records are available for review."
                      : "Add your lab results to receive personalized health insights."}

                  </p>


                  <button onClick={() => navigate("/patient/labs")} className="mt-4 flex items-center gap-1 rounded-lg border border-[#d9eadc] bg-white px-3 py-2 text-[11px] font-semibold text-[#159447] transition hover:bg-[#f1faf3]">

                    {clinicalInsights.length > 0 ? clinicalInsights[0].title : "View Detailed Insights"}

                    <ChevronRight
                      size={14}
                    />

                  </button>

                </div>


                {/* GRAPH DECORATION */}

                <div className="relative mr-3 hidden h-24 w-28 sm:block">

                  <div className="absolute bottom-2 left-2 h-12 w-4 rounded-t bg-[#bce6c9]" />

                  <div className="absolute bottom-2 left-8 h-20 w-4 rounded-t bg-[#72ce8c]" />

                  <div className="absolute bottom-2 left-14 h-14 w-4 rounded-t bg-[#35ae5d]" />

                  <div className="absolute right-1 top-2 h-14 w-14 rounded-full border-[9px] border-[#159447] border-r-transparent" />

                  <Leaf
                    size={25}
                    className="absolute right-0 top-0 text-[#b8e4c3]"
                  />

                </div>

              </div>

            </DashboardCard>

          </div>


          {/* ==================================================
              CENTER
          ================================================== */}

          {hasLabTrendData ? (
          <DashboardCard className="min-w-0">

            <div className="flex items-center justify-between gap-3">

              <CardHeading
                icon={
                  <Heart size={17} />
                }
                title="Lab Trends Overview"
              />


              <select value={trendRange} onChange={(event) => setTrendRange(Number(event.target.value))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-600 outline-none">
                <option value={6}>Last 6 Months</option>
                <option value={12}>Last 1 Year</option>
              </select>

            </div>


            {/* LAB TABS */}

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">

              {Object.keys(
                labTypes
              ).map((type) => (

                <LabTab
                  key={type}
                  active={
                    selectedLab ===
                    type
                  }
                  onClick={() =>
                    setSelectedLab(type)
                  }
                >

                  {type}

                </LabTab>

              ))}

            </div>


            {/* CHART */}

            <div className="mt-3 h-[230px] w-full">

              {labData.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <AreaChart
                    data={labData}
                  >

                    <defs>

                      <linearGradient
                        id="meridianGreen"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >

                        <stop
                          offset="0%"
                          stopColor="#159447"
                          stopOpacity={0.2}
                        />

                        <stop
                          offset="100%"
                          stopColor="#159447"
                          stopOpacity={0.01}
                        />

                      </linearGradient>

                    </defs>


                    <CartesianGrid
                      stroke="#edf1ee"
                      strokeDasharray="3 3"
                      vertical={false}
                    />


                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 10,
                        fill: "#737b76",
                      }}
                    />


                    <YAxis
                      domain={
                        currentLabConfig.domain
                      }
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 10,
                        fill: "#737b76",
                      }}
                    />


                    <Tooltip
                      formatter={(value) =>
                        [
                          `${value} ${currentLabConfig.unit}`,
                          selectedLab,
                        ]
                      }
                    />


                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#159447"
                      strokeWidth={2.5}
                      fill="url(#meridianGreen)"
                      dot={{
                        r: 4,
                        fill: "#159447",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                    />

                  </AreaChart>

                </ResponsiveContainer>

              ) : (

                <div className="flex h-full items-center justify-center rounded-xl bg-[#fbfdfb]">

                  <div className="text-center">

                    <TestTube2
                      size={30}
                      className="mx-auto text-[#b9dec2]"
                    />

                    <p className="mt-3 text-[11px] font-medium text-gray-500">

                      No {selectedLab} data available

                    </p>

                    <p className="mt-1 text-[9px] text-gray-400">

                      Add lab results to see trends.

                    </p>

                  </div>

                </div>

              )}

            </div>


            {/* SUMMARY */}

            <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-gray-200">

              <LabSummary
                label={`Latest ${selectedLab}`}
                value={
                  latestLab
                    ? `${latestLab.value} ${currentLabConfig.unit}`
                    : "—"
                }
                sub={
                  latestLab
                    ? latestLab.month
                    : "No data"
                }
              />


              <LabSummary
                label="Change"
                value={
                  labChange !== null
                    ? `${Number(labChange) > 0 ? "+" : ""}${labChange}`
                    : "—"
                }
                sub={
                  previousLab
                    ? "vs previous result"
                    : "Add more lab records"
                }
              />


              <LabSummary
                label="Interpretation"
                value={
                  latestLab
                    ? selectedLab ===
                        "HbA1c (%)"
                      ? latestLab.value >
                        6.5
                        ? "Above target"
                        : "Within target"
                      : "Recorded"
                    : "No data"
                }
                valueClass={
                  latestLab &&
                  selectedLab ===
                    "HbA1c (%)" &&
                  latestLab.value >
                    6.5
                    ? "text-orange-500"
                    : "text-[#159447]"
                }
              />

            </div>


            {/* RECOMMENDATION */}

            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#d9eddd] bg-[#f4fbf6] px-3 py-2.5 text-[11px] text-[#3c6247]">

              <Leaf
                size={16}
                className="shrink-0 text-[#159447]"
              />

              <span>

                <b className="text-[#16833d]">

                  Recommendation:

                </b>{" "}

                {latestLab &&
                selectedLab ===
                  "HbA1c (%)" &&
                latestLab.value >
                  6.5
                  ? "Please follow your doctor's advice and maintain regular monitoring."
                  : latestLab
                  ? "Continue monitoring your health records regularly."
                  : "Add your health records to receive personalized recommendations."}

              </span>

            </div>

          </DashboardCard>
          ) : (
            <DashboardCard className="min-w-0">
              <UpcomingCarePanel
                appointments={appointments}
                reminders={reminders}
                onBook={() => navigate("/patient/appointments", { state: { openBooking: true } })}
                onViewAppointments={() => navigate("/patient/appointments")}
                onViewReminders={() => navigate("/patient/reminders")}
              />
            </DashboardCard>
          )}

          {/* ==================================================
              RIGHT
          ================================================== */}

          <div className="space-y-4">


            <DashboardCard>

              <CardHeading
                icon={<FileText size={17} />}
                title="Recent Uploads"
              />

              <div className="mt-4 flex items-center justify-between">

                <h4 className="text-[11px] font-bold text-gray-700">

                  Recent Uploads

                </h4>


                <button type="button" onClick={() => navigate("/patient/reports")} className="text-[10px] font-semibold text-[#159447]">

                  View All

                </button>

              </div>


              <div className="mt-2 divide-y divide-[#edf3ee] overflow-hidden rounded-xl border border-[#edf3ee]">

                {recentReports.length > 0 ? (

                  recentReports
                    .map(
                      (report) => (

                        <UploadedFile
                          key={report._id || report.id || report.reportId}
                          icon={
                            report.type?.includes(
                              "image"
                            )
                              ? <FileImage />
                              : <FileText />
                          }
                          iconClassName={report.type?.includes("image") ? "bg-[#edf8f0] text-[#43a965]" : "bg-[#fff2ed] text-[#e6754d]"}
                          name={
                            report.name ||
                            report.fileName ||
                            "Health Report"
                          }
                          details={formatUploadDateTime(report.date || report.createdAt)}
                          onDownload={() => handleDownloadReport(report)}
                          onDelete={() => handleDeleteReport(report)}
                        />

                      )
                    )

                ) : (

                  <p className="px-2 py-3 text-center text-[9px] text-gray-400">

                    No reports uploaded yet.

                  </p>

                )}

              </div>

            </DashboardCard>


            {/* QUICK ACTIONS */}

            <DashboardCard>

              <CardHeading
                title="Quick Actions"
              />


              <div className="mt-3 grid grid-cols-2 gap-2">

                <QuickAction
                  icon={
                    <CalendarDays />
                  }
                  label="Book Appointment"
                  onClick={() => navigate("/patient/appointments", { state: { openBooking: true } })}
                />

                <QuickAction
                  icon={
                    <ClipboardList />
                  }
                  label="View Prescriptions"
                  onClick={() => navigate("/patient/prescriptions")}
                />

                <QuickAction
                  icon={
                    <Share2 />
                  }
                  label="Share Records"
                  onClick={handleShareRecords}
                />

                <QuickAction
                  icon={
                    <Download />
                  }
                  label="Download Summary"
                  onClick={handleDownloadSummary}
                />

              </div>

            </DashboardCard>

          </div>

        </section>


        {/* ====================================================
            BOTTOM
        ==================================================== */}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_1.7fr]">


          {/* NEED HELP */}

          <DashboardCard>

            <div className="flex gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eaf8ee] text-[#159447]">

                <HelpCircle
                  size={27}
                />

              </div>


              <div>

                <h3 className="text-[14px] font-semibold">

                  Need Help?

                </h3>


                <p className="mt-2 text-[11px] leading-5 text-gray-500">

                  Our support team is here
                  to assist you with any
                  queries or issues.

                </p>


                <button
                  type="button"
                  onClick={() => navigate("/patient/assistant")}
                  className="mt-3 flex items-center gap-1 rounded-lg border border-[#d5ead9] px-3 py-2 text-[10px] font-semibold text-[#159447] hover:bg-[#f2faf4]"
                >

                  Contact Support

                  <ChevronRight
                    size={13}
                  />

                </button>

              </div>

            </div>

          </DashboardCard>


          {/* HEALTH PROGRESS */}

          <DashboardCard className="xl:col-span-2">

            <div className="flex flex-wrap items-start justify-between gap-3">

              <div>
                <CardHeading icon={<LineChart size={17} />} title="Health Progress" />
                <p className="mt-1 text-[10px] text-gray-400">
                  Your latest measurements and recorded health trends
                </p>
              </div>

            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_1fr]">

              <div className="grid grid-cols-3 gap-2">
                <ProgressMetric label="BMI" value={bmi || "—"} caption={bmi ? bmiStatus : "Not recorded"} />
                <ProgressMetric label="Weight" value={patient.weight ? `${patient.weight}` : "—"} caption={patient.weight ? "kg" : "Not recorded"} />
                <ProgressMetric label="Height" value={patient.height ? `${patient.height}` : "—"} caption={patient.height ? "cm" : "Not recorded"} />
              </div>
              {recentPatientMeasurements.length > 0 && (
                <div className="mt-4 border-t border-[#edf3ee] pt-4">
                  <p className="text-[10px] font-semibold text-[#244b35]">Recent values</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {recentPatientMeasurements.map((measurement, index) => (
                      <div key={`${measurement.metric}-${measurement.date}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-[#fbfefc] px-2.5 py-2">
                        <span className="text-[10px] text-[#6f8376]">{measurement.label}</span>
                        <span className="shrink-0 text-[10px] font-bold text-[#159447]">{measurement.value} {measurement.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </DashboardCard>

        </section>

      </main>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="mt-2 border-t border-gray-200 bg-white px-6 py-3">

        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 text-[10px] text-gray-400">

          <ShieldCheck
            size={13}
            className="text-[#159447]"
          />

          <span>
            Your data is secure & encrypted
          </span>

          <span>
            •
          </span>

          <span>
            MERIDIAN follows HIPAA compliant practices
          </span>

          <span className="ml-auto">

            © 2025 MERIDIAN Health Systems

          </span>

        </div>

      </footer>

    </div>

  );
}


/* ============================================================
   PATIENT INFO
============================================================ */

function PatientInfo({
  label,
  value,
}) {

  return (

    <div>

                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#7a9683]">

        {label}

      </p>


                  <p className="mt-1 text-[12px] font-semibold text-[#315343]">

        {value || "—"}

      </p>

    </div>

  );

}


/* ============================================================
   TAG
============================================================ */

function Tag({
  children,
}) {

  return (

    <span className="rounded-full border border-[#d4ead9] bg-[#f1faf3] px-3 py-1 text-[9px] font-semibold text-[#4d765c]">

      {children}

    </span>

  );

}


/* ============================================================
   MINI METRIC
============================================================ */

function MiniMetric({
  icon,
  title,
  value,
  subtitle,
}) {

  return (

    <div className="flex items-center gap-3">

      <div className="text-[#159447]">

        {icon}

      </div>


      <div>

        <p className="text-[10px] text-gray-600">

          {title}

        </p>


        <div className="flex items-baseline gap-2">

          <strong className="text-[20px]">

            {value}

          </strong>

          <span className="text-[9px] text-[#159447]">

            {subtitle}

          </span>

        </div>

      </div>

    </div>

  );

}


/* ============================================================
   DASHBOARD CARD
============================================================ */

function DashboardCard({
  children,
  className = "",
}) {

  return (

    <div
      className={`rounded-2xl border border-[#dcece1] bg-white p-5 shadow-[0_8px_28px_rgba(31,105,59,0.05)] ${className}`}
    >

      {children}

    </div>

  );

}


/* ============================================================
   CARD HEADING
============================================================ */

function CardHeading({
  icon,
  title,
}) {

  return (

    <div className="flex items-center gap-2">

      {icon && (

        <span className="text-[#159447]">

          {icon}

        </span>

      )}


      <h3 className="text-[14px] font-bold text-[#244b35]">

        {title}

      </h3>

    </div>

  );

}


/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}) {

  return (

    <div className="group flex min-h-[100px] flex-col items-center justify-center rounded-xl border border-[#e1eee4] bg-[#f9fdf9] px-2 py-3 text-center transition hover:-translate-y-0.5 hover:border-[#b9ddc2] hover:bg-[#f1faf3]">

      <Icon
        size={19}
        className="text-[#159447]"
        strokeWidth={1.8}
      />


      <strong className="mt-2 text-[18px] text-[#183a28]">

        {value}

      </strong>


      <span className="mt-0.5 text-[10px] font-bold text-[#315343]">

        {title}

      </span>


      <small className="mt-0.5 text-[8px] text-gray-400">

        {subtitle}

      </small>

    </div>

  );

}


/* ============================================================
   LAB TAB
============================================================ */

function LabTab({
  children,
  active = false,
  onClick,
}) {

  return (

    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg px-3 py-2 text-[10px] font-medium transition ${
        active
          ? "bg-[#159447] text-white shadow-sm"
          : "border border-gray-200 bg-white text-gray-600 hover:border-[#b9ddc2] hover:text-[#159447]"
      }`}
    >

      {children}

    </button>

  );

}


/* ============================================================
   LAB SUMMARY
============================================================ */

function LabSummary({
  label,
  value,
  sub,
  valueClass = "",
}) {

  return (

    <div className="border-r border-gray-100 px-4 py-3 last:border-0">

      <p className="text-[10px] font-medium text-[#159447]">

        {label}

      </p>


      <strong
        className={`mt-1 block text-[18px] font-semibold ${valueClass}`}
      >

        {value}

      </strong>


      {sub && (

        <span className="text-[9px] text-gray-400">

          {sub}

        </span>

      )}

    </div>

  );

}


/* ============================================================
   UPLOADED FILE
============================================================ */

function UploadedFile({
  icon,
  name,
  details,
  iconClassName = "text-[#159447] bg-[#f0f8f2]",
  onDownload,
  onDelete,
}) {

  return (

    <div className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-[#f7faf8]">

      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClassName}`}>

        {React.cloneElement(
          icon,
          {
            size: 16,
          }
        )}

      </div>


      <div className="min-w-0 flex-1">

        <p className="truncate text-[10px] font-semibold text-gray-700">

          {name}

        </p>


        <p className="mt-0.5 text-[8px] text-gray-400">

          {details}

        </p>

      </div>


      <div className="flex items-center gap-1">
        <button type="button" onClick={onDownload} title="Download report" className="flex h-7 w-7 items-center justify-center rounded-lg text-[#159447] transition hover:bg-[#edf8f0]"><Download size={14} /></button>
        <button type="button" onClick={onDelete} title="Delete report" className="flex h-7 w-7 items-center justify-center rounded-lg text-[#c96a61] transition hover:bg-[#fff1ef]"><Trash2 size={14} /></button>
      </div>

    </div>

  );

}


/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  icon,
  label,
  onClick,
}) {

  return (

    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl border border-[#e3eee5] bg-[#f8fcf9] px-3 py-3 text-left text-[10px] font-semibold text-gray-700 transition hover:border-[#b8ddc0] hover:bg-[#eef9f1] hover:text-[#159447] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25854d] focus-visible:ring-offset-2"
    >

      {React.cloneElement(
        icon,
        {
          size: 17,
          className:
            "text-[#159447]",
        }
      )}

      {label}

    </button>

  );

}


/* ============================================================
   PROGRESS METRIC
============================================================ */

function ProgressMetric({
  label,
  value,
  caption,
}) {

  return (

    <div className="rounded-xl border border-[#edf3ee] bg-[#fbfefc] p-3">

      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <strong className="mt-2 block text-base text-[#244b35]">
        {value}
      </strong>

      <p className="mt-1 text-[9px] text-[#159447]">
        {caption}
      </p>

    </div>

  );

}