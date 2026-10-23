import React, { useEffect, useState } from "react";
import { Activity, AlertTriangle, ArrowLeft, CalendarDays, Download, Eye, FileText, HeartPulse, Mail, Phone, Pill, Printer, Save, ShieldCheck, UploadCloud, UserRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../components/common/Layout";
import api from "../../api/axios";

const LINKS = [{ to: "/doctor/dashboard", label: "Dashboard", icon: "🏠" }];

const formatDate = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Date unavailable";
};

const PatientProfile = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] =
    useState(true);
  const [patient, setPatient] =
    useState(null);
  const [timeline, setTimeline] =
    useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertsError, setAlertsError] = useState("");
  const [patientReports, setPatientReports] = useState([]);
  const [stopTarget, setStopTarget] = useState(null);
  const [stopReason, setStopReason] = useState("");
  const [stopping, setStopping] = useState(false);
  const [reportFile, setReportFile] = useState(null);
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState("prescription_copy");
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [labName, setLabName] = useState("");
  const [uploadingReport, setUploadingReport] = useState(false);
  const [alertReviewReasons, setAlertReviewReasons] = useState({});
  const [reviewingAlert, setReviewingAlert] = useState("");
  const [tab, setTab] = useState(
    "timeline"
  );

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      const patientResponse = await api.get(`/api/doctors/patients/${patientId}`);
      const patientData = patientResponse.data?.data || patientResponse.data;

      if (!patientData) {
        throw new Error("Patient not found");
      }

      setPatient(patientData);

      const timelineResponse = await api.get(`/api/doctors/patients/${patientId}/timeline`);
      const timelineData = timelineResponse.data?.data || timelineResponse.data;
      setTimeline(Array.isArray(timelineData?.events) ? timelineData.events : Array.isArray(timelineData) ? timelineData : []);

      const reportsResponse = await api.get(`/api/reports/patient/${patientId}`).catch(() => ({ data: [] }));
      const reportData = reportsResponse.data?.reports || reportsResponse.data?.data || reportsResponse.data;
      setPatientReports(Array.isArray(reportData) ? reportData : []);

      setAlertsError("");
      try {
        const alertsResponse = await api.get(`/api/safety/patient/${patientId}/current-alerts`);
        const alertsData = alertsResponse.data?.data || alertsResponse.data;
        setAlerts(Array.isArray(alertsData) ? alertsData : alertsData?.alerts || []);
      } catch (alertsRequestError) {
        setAlerts([]);
        setAlertsError(alertsRequestError.response?.data?.message || "Unable to load current safety alerts.");
      }
    } catch (error) {
      console.error(
        "Error fetching patient:",
        error
      );
      toast.error(
        "Failed to load patient profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const viewReport = async (report) => {
    const reportWindow = window.open("about:blank", "_blank");
    try {
      const response = await api.post(`/api/reports/${report._id}/viewed`);
      const viewedReport = response.data?.report;
      if (viewedReport) {
        setPatientReports((current) => current.map((item) => item._id === viewedReport._id ? viewedReport : item));
      }
      const fileUrl = response.data?.fileUrl;
      if (!fileUrl) throw new Error("This report has no attached file.");
      if (reportWindow) reportWindow.location.href = fileUrl;
      else window.open(fileUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      reportWindow?.close();
      toast.error(error.response?.data?.message || error.message || "Unable to open report");
    }
  };

  const saveReportReview = async (reportId, values) => {
    try {
      const response = await api.patch(`/api/reports/${reportId}/review`, values);
      const updatedReport = response.data?.report;
      if (updatedReport) {
        setPatientReports((current) => current.map((item) => item._id === updatedReport._id ? updatedReport : item));
      }
      toast.success("Report result saved to the patient record");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save report result");
      throw error;
    }
  };

  const uploadPatientReport = async (event) => {
    event.preventDefault();
    if (!reportFile) return toast.error("Select a prescription or report file first.");
    if (reportType === "lab" && !labName.trim()) return toast.error("Enter the laboratory name for a lab report.");

    const formData = new FormData();
    formData.append("file", reportFile);
    formData.append("patientId", patientId);
    formData.append("title", reportTitle.trim() || reportFile.name);
    formData.append("type", reportType);
    formData.append("date", reportDate);
    if (labName.trim()) formData.append("labName", labName.trim());

    try {
      setUploadingReport(true);
      await api.post("/api/reports/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Report uploaded and OCR validation started");
      setReportFile(null);
      setReportTitle("");
      setLabName("");
      await fetchPatientData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to upload report");
    } finally {
      setUploadingReport(false);
    }
  };

  const reviewAlert = async (alert, action = "acknowledged") => {
    const reason = String(alertReviewReasons[alert._id] || "").trim();
    if (!reason) return toast.error("Enter a reason before recording the review.");
    try {
      setReviewingAlert(alert._id);
      await api.post(`/api/safety/patient/${patientId}/current-alerts/review`, { alertId: alert._id, action, reason });
      setAlerts((current) => current.map((item) => item._id === alert._id ? { ...item, reviewed: true, reviewAction: action, reviewReason: reason } : item));
      toast.success("Safety review recorded");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to record safety review");
    } finally {
      setReviewingAlert("");
    }
  };

  const buildFinalReport = () => {
    const medications = timeline.filter((event) => event.type === "medication" && event.data).map((event) => `${event.data.name} - ${event.data.dosage || "As directed"} - ${event.data.frequency || "No frequency recorded"}`);
    const allergies = timeline.filter((event) => event.type === "allergy" && event.data).map((event) => `${event.data.allergen}: ${event.data.reaction || "Reaction not recorded"}`);
    const labs = timeline.filter((event) => event.type === "lab" && event.data).map((event) => `${event.data.testName || "Lab test"} (${formatDate(event.date)})`);
    const warnings = alerts.flatMap((group) => (group.alerts || []).map((alert) => `${alert.type || "Safety alert"}: ${alert.message}`));
    return [
      "MERIDIAN FINAL CLINICAL REPORT",
      `Patient: ${patientName}`,
      `Patient ID: ${patient.patientCode || patient._id || "Not recorded"}`,
      `Generated: ${formatDate(new Date())}`,
      "",
      "MEDICATIONS",
      ...(medications.length ? medications : ["None recorded"]),
      "",
      "ALLERGIES",
      ...(allergies.length ? allergies : ["None recorded"]),
      "",
      "LAB RESULTS",
      ...(labs.length ? labs : ["None recorded"]),
      "",
      "RISKS AND WARNINGS",
      ...(warnings.length ? warnings : ["No active warnings"]),
      "",
      "UPLOADED REPORTS",
      ...(patientReports.length ? patientReports.map((report) => `${report.name || "Clinical report"} - OCR: ${report.ocrStatus || "unknown"} - Review: ${report.reviewStatus || "pending"}`) : ["None recorded"]),
    ].join("\n");
  };

  const downloadFinalReport = () => {
    const blob = new Blob([buildFinalReport()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `meridian-final-report-${patient.patientCode || patient._id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printFinalReport = () => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return toast.error("Allow pop-ups to print the report.");
    printWindow.document.write(`<html><head><title>Meridian final report</title><style>body{font-family:Arial,sans-serif;padding:32px;white-space:pre-wrap;line-height:1.5}h1{font-size:20px}</style></head><body><h1>Meridian final clinical report</h1><pre>${buildFinalReport().replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[character]))}</pre></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const stopMedication = async (event) => {
    event.preventDefault();
    if (!stopTarget) return;
    try {
      setStopping(true);
      await api.patch(`/api/medications/${stopTarget._id}/stop`, { reason: stopReason });
      toast.success("Medication stopped and reason recorded");
      setStopTarget(null);
      setStopReason("");
      await fetchPatientData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to stop medication");
    } finally {
      setStopping(false);
    }
  };

  if (loading) {
    return <Layout links={LINKS}><div className="flex min-h-80 items-center justify-center"><Activity className="animate-pulse text-[#159447]" size={30} /></div></Layout>;
  }

  if (!patient) {
    return <Layout links={LINKS}><div className="rounded-[28px] border border-red-200 bg-red-50 p-10 text-center text-sm text-red-700">Patient profile not found.</div></Layout>;
  }

  const patientName = patient.userId?.name || patient.name || "Patient";
  const email = patient.userId?.email || patient.email || "Not provided";
  const phone = patient.userId?.phone || patient.phone || "Not provided";
  const initials = patientName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const alertCount = alerts.reduce((total, group) => total + (group.alerts?.length || 0), 0);

  return (
    <Layout links={LINKS}>
      <div className="mx-auto max-w-7xl space-y-6">
        <button type="button" onClick={() => navigate("/doctor/patients")} className="inline-flex items-center gap-2 text-sm font-bold text-[#597266] transition hover:text-[#183a28]"><ArrowLeft size={16} /> Back to patients</button>

        <section className="overflow-hidden rounded-[30px] bg-gradient-to-br from-[#0f5132] via-[#1a7a4a] to-[#19b36d] p-6 text-white shadow-[0_18px_45px_rgba(26,122,74,0.2)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-white/15 text-2xl font-black ring-1 ring-white/25">{initials}</div>
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Patient profile</p><h1 className="mt-2 text-3xl font-black md:text-4xl">{patientName}</h1><p className="mt-2 text-sm text-emerald-50">{patient.patientCode || "Patient record"} · Care record</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={downloadFinalReport} title="Download final report" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"><Download size={16} /> Download report</button>
              <button type="button" onClick={printFinalReport} title="Print final report" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"><Printer size={16} /> Print report</button>
              <button type="button" onClick={() => navigate(`/doctor/prescription/new?patientId=${patientId}`)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#176b3d] shadow-lg transition hover:bg-emerald-50"><Pill size={16} /> Create prescription</button>
            </div>
          </div>
          <div className="mt-7 grid gap-3 border-t border-white/20 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 text-sm text-emerald-50"><Mail size={15} /> {email}</div>
            <div className="flex items-center gap-2 text-sm text-emerald-50"><Phone size={15} /> {phone}</div>
            <div className="flex items-center gap-2 text-sm text-emerald-50"><CalendarDays size={15} /> Age {patient.age ?? "N/A"}</div>
            <div className="flex items-center gap-2 text-sm text-emerald-50"><HeartPulse size={15} /> Blood {patient.bloodGroup || "Unknown"}</div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[ ["Conditions", patient.conditions?.length || 0, FileText], ["Timeline events", timeline.length, Activity], ["Safety alerts", alertCount, ShieldCheck], ["Gender", patient.gender || "N/A", UserRound]].map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-[#dfeee3] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-[#84978b]">{label}</p><Icon size={18} className="text-[#159447]" /></div><p className="mt-3 text-2xl font-black text-[#183a28]">{value}</p></div>)}
        </section>

        <section className="rounded-[28px] border border-[#dfeee3] bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf7ed] text-[#159447]"><UploadCloud size={18} /></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5c7868]">Document intake</p><h2 className="text-xl font-black text-[#183a28]">Upload prescription or lab report</h2></div></div>
          <form onSubmit={uploadPatientReport} className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <input value={reportTitle} onChange={(event) => setReportTitle(event.target.value)} placeholder="Document title" className="h-11 rounded-xl border border-[#dfeee3] bg-[#f8fcf9] px-3 text-sm outline-none focus:border-[#1aa65c] lg:col-span-2" />
            <select value={reportType} onChange={(event) => setReportType(event.target.value)} className="h-11 rounded-xl border border-[#dfeee3] bg-[#f8fcf9] px-3 text-sm outline-none focus:border-[#1aa65c]"><option value="prescription_copy">Prescription</option><option value="lab">Lab report</option><option value="other">Other clinical report</option></select>
            <input type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} className="h-11 rounded-xl border border-[#dfeee3] bg-[#f8fcf9] px-3 text-sm outline-none focus:border-[#1aa65c]" />
            <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#b8d8c1] bg-[#f8fcf9] px-3 text-xs font-bold text-[#1d6b3f]"><UploadCloud size={15} /> {reportFile?.name || "Choose file"}<input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setReportFile(event.target.files?.[0] || null)} className="hidden" /></label>
            {reportType === "lab" && <input value={labName} onChange={(event) => setLabName(event.target.value)} placeholder="Laboratory name" className="h-11 rounded-xl border border-[#dfeee3] bg-[#f8fcf9] px-3 text-sm outline-none focus:border-[#1aa65c] lg:col-span-2" />}
            <button type="submit" disabled={uploadingReport} className="h-11 rounded-xl bg-[#159447] px-4 text-sm font-bold text-white disabled:opacity-60 lg:col-span-2">{uploadingReport ? "Uploading and validating..." : "Upload and run OCR"}</button>
          </form>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-[#dfeee3] bg-white shadow-sm">
          {tab === "timeline" && <DiagnosisEntry patientId={patientId} onSaved={fetchPatientData} />}
          <div className="flex border-b border-[#edf3ee] p-2">
            <button type="button" onClick={() => setTab("timeline")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${tab === "timeline" ? "bg-[#eaf7ed] text-[#159447]" : "text-[#71857a] hover:bg-[#f8fcf9]"}`}><Activity className="mr-2 inline" size={16} />Medical timeline</button>
            <button type="button" onClick={() => setTab("alerts")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${tab === "alerts" ? "bg-[#fff3ed] text-[#c15b3c]" : "text-[#71857a] hover:bg-[#f8fcf9]"}`}><AlertTriangle className="mr-2 inline" size={16} />Safety alerts <span className="ml-1">({alertCount})</span></button>
          </div>

          <div className="p-5 md:p-6">
            {tab === "timeline" && <section className="mb-6 rounded-2xl border border-[#e5efe7] bg-[#fbfefc] p-4"><div className="flex items-center gap-2"><Pill size={17} className="text-[#25854d]" /><h2 className="font-bold text-[#183a28]">Patient medications</h2></div>{timeline.filter((event) => event.type === "medication" && event.data).length ? <div className="mt-3 divide-y divide-[#e8f0ea]">{timeline.filter((event) => event.type === "medication" && event.data).map((event) => { const medication = event.data; return <div key={medication._id} className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center"><div><p className="font-bold text-[#315542]">{medication.name} <span className="ml-2 rounded-full bg-[#edf8f0] px-2 py-1 text-[10px] uppercase text-[#527261]">{medication.status || "active"}</span></p><p className="mt-1 text-xs text-[#71857a]">{medication.dosage} · {medication.frequency || "As directed"}</p>{medication.status === "stopped" && medication.stoppedReason && <p className="mt-1 text-xs text-[#8a4b42]">Stop reason: {medication.stoppedReason}</p>}</div>{medication.status === "active" && <button type="button" onClick={() => { setStopTarget(medication); setStopReason(""); }} className="self-start rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50">Stop medication</button>}</div>; })}</div> : <p className="mt-3 text-sm text-[#84978b]">No medications recorded.</p>}</section>}
            {tab === "timeline" && <DoctorReportsSection reports={patientReports} onView={viewReport} onSave={saveReportReview} />}
            {tab === "timeline" && (timeline.length ? <div className="space-y-4">{timeline.map((event, index) => <div key={event._id || `${event.type}-${index}`} className="relative rounded-2xl border border-[#e5efe7] bg-[#fbfefc] p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf7ed] text-[#159447]"><Activity size={18} /></div><div><h3 className="font-black capitalize text-[#183a28]">{String(event.type || "clinical event").replaceAll("_", " ")}</h3><p className="text-xs text-[#84978b]">{formatDate(event.date)}</p></div></div><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-[#6e8576]">Record {timeline.length - index}</span></div><p className="mt-4 text-sm leading-6 text-[#50685a]">{event.description || event.title || "Clinical event recorded"}</p>{event.data && <div className="mt-3 grid gap-2 text-xs text-[#6e8576] sm:grid-cols-2">{event.data.condition && <p><b>Condition:</b> {event.data.condition}</p>}{event.data.name && <p><b>Medication:</b> {event.data.name}</p>}{event.data.dosage && <p><b>Dosage:</b> {event.data.dosage}</p>}{event.data.status && <p><b>Status:</b> {event.data.status}</p>}</div>}</div>)}</div> : <div className="py-12 text-center"><Activity size={30} className="mx-auto text-[#8bb69a]" /><p className="mt-3 font-bold text-[#315542]">No medical events recorded</p><p className="mt-1 text-sm text-[#84978b]">New clinical activity will appear here.</p></div>)}

            {tab === "alerts" && alertsError && <div role="alert" className="py-12 text-center"><AlertTriangle size={30} className="mx-auto text-amber-600" /><p className="mt-3 font-bold text-[#315542]">Unable to load safety alerts</p><p className="mt-1 text-sm text-[#84978b]">{alertsError}</p></div>}
            {tab === "alerts" && !alertsError && (alerts.length ? <div className="space-y-4">{alerts.map((alert, index) => <div key={alert._id || index} className={`rounded-2xl border p-5 ${alert.status === "HIGH_RISK" ? "border-red-200 bg-red-50" : alert.status === "WARNING" ? "border-amber-200 bg-amber-50" : "border-[#cde8d4] bg-[#f2fbf4]"}`}><div className="flex items-center justify-between gap-3"><h3 className="font-black text-[#183a28]">{alert.title || alert.status || "Safety review"}</h3><span className="text-xs text-[#71857a]">{formatDate(alert.createdAt)}</span></div><div className="mt-4 space-y-3">{(alert.alerts || []).map((singleAlert, alertIndex) => <div key={singleAlert.relevantRecord?.recordId || alertIndex} className="border-t border-black/10 pt-3"><p className="font-bold text-[#315542]">{singleAlert.type || "Clinical alert"}</p><p className="mt-1 text-sm leading-6 text-[#52695b]">{singleAlert.message}</p>{singleAlert.evidence && <p className="mt-1 text-xs leading-5 text-[#71857a]">{singleAlert.evidence}</p>}{singleAlert.recommendation && <p className="mt-2 text-xs font-semibold text-[#25854d]">Recommendation: {singleAlert.recommendation}</p>}</div>)}</div>{alert.reviewed ? <p className="mt-4 text-xs font-bold text-[#25854d]">Reviewed: {alert.reviewAction} · {alert.reviewReason}</p> : <div className="mt-4 border-t border-black/10 pt-4"><input value={alertReviewReasons[alert._id] || ""} onChange={(event) => setAlertReviewReasons((current) => ({ ...current, [alert._id]: event.target.value }))} placeholder="Reason for acknowledging or overriding this alert" className="h-10 w-full rounded-xl border border-[#dfeee3] bg-white px-3 text-xs outline-none focus:border-[#25854d]" /><div className="mt-2 flex flex-wrap gap-2"><button type="button" disabled={reviewingAlert === alert._id} onClick={() => reviewAlert(alert, "acknowledged")} className="rounded-xl bg-[#237c4b] px-3 py-2 text-xs font-bold text-white disabled:opacity-60">Acknowledge</button><button type="button" disabled={reviewingAlert === alert._id} onClick={() => reviewAlert(alert, "overridden")} className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-60">Override with reason</button></div></div>}</div>)}</div> : <div className="py-12 text-center"><ShieldCheck size={30} className="mx-auto text-[#4ba66d]" /><p className="mt-3 font-bold text-[#315542]">No safety alerts</p><p className="mt-1 text-sm text-[#84978b]">This patient has no active safety warnings.</p></div>)}
          </div>
        </section>
      </div>
      {stopTarget && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b2b1c]/45 p-4 backdrop-blur-sm"><form onSubmit={stopMedication} className="w-full max-w-lg rounded-2xl border border-[#dfeee3] bg-white p-6 shadow-2xl"><h2 className="text-lg font-bold text-[#183a28]">Stop {stopTarget.name}</h2><p className="mt-1 text-sm text-[#71857a]">Record why this medication is being discontinued. The patient will see this reason.</p><label className="mt-5 block text-xs font-bold text-[#567064]">Reason for stopping<textarea required minLength={3} value={stopReason} onChange={(event) => setStopReason(event.target.value)} rows={4} className="mt-1.5 w-full rounded-lg border border-[#dfeee3] p-3 text-sm outline-none focus:border-[#25854d]" placeholder="Enter the clinical reason" /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setStopTarget(null)} className="rounded-lg border border-[#dfeee3] px-4 py-2 text-sm font-semibold text-[#567064]">Cancel</button><button type="submit" disabled={stopping || stopReason.trim().length < 3} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{stopping ? "Saving..." : "Confirm stop"}</button></div></form></div>}
    </Layout>
  );
};

function DoctorReportsSection({ reports, onView, onSave }) {
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState("");
  const valueFor = (report, key) => drafts[report._id]?.[key] ?? (key === "clinicalResult" ? report.clinicalResult || "" : report.resultStatus || "not_specified");
  const update = (report, key, value) => setDrafts((current) => ({
    ...current,
    [report._id]: {
      clinicalResult: valueFor(report, "clinicalResult"),
      resultStatus: valueFor(report, "resultStatus"),
      [key]: value,
    },
  }));
  const save = async (event, report) => {
    event.preventDefault();
    setSavingId(report._id);
    try {
      await onSave(report._id, {
        clinicalResult: valueFor(report, "clinicalResult"),
        resultStatus: valueFor(report, "resultStatus"),
      });
    } catch {
      // The parent displays the API error.
    } finally {
      setSavingId("");
    }
  };

  return <section className="mb-6 rounded-2xl border border-[#dcece1] bg-white p-4"><div className="flex items-center gap-2"><FileText size={17} className="text-[#25854d]" /><h2 className="font-bold text-[#183a28]">Laboratory reports</h2></div>{reports.length ? <div className="mt-3 space-y-4">{reports.map((report) => <form key={report._id} onSubmit={(event) => save(event, report)} className="rounded-xl border border-[#e5efe7] bg-[#fbfefc] p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-bold text-[#315542]">{report.name || report.fileName || "Lab report"}</p><p className="mt-1 text-xs text-[#71857a]">{formatDate(report.date)} · OCR {report.ocrStatus || "unknown"} · {report.reviewStatus || "pending"}</p>{report.extractedText && <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs leading-5 text-[#71857a]">{report.extractedText}</p>}</div><button type="button" onClick={() => onView(report)} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#cfe5d5] px-3 py-2 text-xs font-bold text-[#25854d] hover:bg-[#f1f8f3]"><Eye size={14} /> View file</button></div><label className="mt-4 block text-xs font-bold text-[#567064]">Doctor&apos;s result<textarea required value={valueFor(report, "clinicalResult")} onChange={(event) => update(report, "clinicalResult", event.target.value)} rows={3} className="mt-1.5 w-full rounded-lg border border-[#dfeee3] bg-white px-3 py-2 text-sm outline-none focus:border-[#25854d]" placeholder="Enter the reviewed result for the patient" /></label><div className="mt-3 flex flex-wrap items-end justify-between gap-3"><label className="text-xs font-bold text-[#567064]">Result status<select value={valueFor(report, "resultStatus")} onChange={(event) => update(report, "resultStatus", event.target.value)} className="mt-1.5 block h-10 rounded-lg border border-[#dfeee3] bg-white px-3 text-sm"><option value="not_specified">Not specified</option><option value="normal">Normal</option><option value="abnormal">Abnormal</option><option value="critical">Critical</option></select></label><button type="submit" disabled={savingId === report._id || !valueFor(report, "clinicalResult").trim()} className="inline-flex items-center gap-2 rounded-lg bg-[#237c4b] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"><Save size={14} />{savingId === report._id ? "Saving..." : "Save result"}</button></div>{report.reviewStatus === "reviewed" && report.reviewedAt && <p className="mt-3 text-[11px] text-[#71857a]">Reviewed {formatDate(report.reviewedAt)}</p>}</form>)}</div> : <p className="mt-3 text-sm text-[#84978b]">No reports have been uploaded for this patient.</p>}</section>;
}

function DiagnosisEntry({ patientId, onSaved }) {
  const [condition, setCondition] = useState("");
  const [diagnosedDate, setDiagnosedDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("active");
  const [severity, setSeverity] = useState("moderate");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const saveDiagnosis = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await api.post(`/api/medical-records/diagnoses/${patientId}`, {
        condition,
        diagnosedDate,
        status,
        severity,
        notes,
      });
      setCondition("");
      setNotes("");
      toast.success("Diagnosis saved to the patient record");
      await onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save diagnosis");
    } finally {
      setSaving(false);
    }
  };

  return <form onSubmit={saveDiagnosis} className="border-b border-[#edf3ee] bg-[#fbfefc] p-5 md:p-6">
    <h2 className="font-bold text-[#183a28]">Add diagnosis</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs font-semibold text-[#567064]">Condition<input required value={condition} onChange={(event) => setCondition(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#dfeee3] bg-white px-3 text-sm outline-none focus:border-[#25854d]" placeholder="Diagnosis" /></label>
      <label className="text-xs font-semibold text-[#567064]">Diagnosed date<input required type="date" value={diagnosedDate} onChange={(event) => setDiagnosedDate(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#dfeee3] bg-white px-3 text-sm outline-none focus:border-[#25854d]" /></label>
      <label className="text-xs font-semibold text-[#567064]">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#dfeee3] bg-white px-3 text-sm outline-none focus:border-[#25854d]"><option value="active">Active</option><option value="chronic">Chronic</option><option value="resolved">Resolved</option></select></label>
      <label className="text-xs font-semibold text-[#567064]">Severity<select value={severity} onChange={(event) => setSeverity(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#dfeee3] bg-white px-3 text-sm outline-none focus:border-[#25854d]"><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select></label>
    </div>
    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex-1 text-xs font-semibold text-[#567064]">Clinical notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="mt-1.5 w-full rounded-lg border border-[#dfeee3] bg-white px-3 py-2 text-sm outline-none focus:border-[#25854d]" placeholder="Optional notes" /></label>
      <button disabled={saving} className="h-10 rounded-lg bg-[#237c4b] px-4 text-sm font-bold text-white transition hover:bg-[#17633a] disabled:opacity-60">{saving ? "Saving..." : "Save diagnosis"}</button>
    </div>
  </form>;
}

export default PatientProfile;
