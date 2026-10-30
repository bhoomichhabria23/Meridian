import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  Download,
  FileText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  X,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar";
import {
  downloadReport,
  deleteReport,
  fetchPatient,
  fetchReports,
  uploadReport,
  generateReportSummary,
} from "../../services/reportService";
import { useAuth } from "../../context/AuthContext";

const TYPES = [
  ["all", "All reports"],
  ["lab", "Lab"],
  ["imaging", "Imaging"],
  ["cardiology", "Cardiology"],
  ["pathology", "Pathology"],
  ["radiology", "Radiology"],
  ["other", "Other"],
];
const formatDate = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not dated";
};
const formatDateTime = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime())
    ? date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Not dated";
};
const normalize = (value) => String(value || "").toLowerCase();
const normalizePatient = (data, sessionUser = {}) => {
  if (!data) return null;
  const account = data.userId && typeof data.userId === "object" ? data.userId : {};
  return {
    ...data,
    name: account.name || sessionUser.name || "Patient",
    patientId: data.patientCode || data._id || "Not available",
    age: data.age ?? "--",
    gender: data.gender || "--",
    bloodGroup: data.bloodGroup || "--",
  };
};

function ReportCard({ report, onPreview, onDownload, onDelete }) {
  return (
    <article className="group flex-shrink-0 w-full sm:w-[30rem] rounded-2xl border border-[#dcebe0] bg-gradient-to-br from-white to-[#f8fcf9] p-7 shadow-[0_8px_28px_rgba(31,105,59,0.04)] transition hover:-translate-y-1 hover:border-[#9fcfb0] hover:shadow-[0_16px_48px_rgba(31,105,59,0.12)]">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#eaf7ed] to-[#d4f1e0] text-[#25854d] flex-shrink-0">
            <FileText size={24} />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#1b3c2a] truncate text-sm">
              {report.name || report.testName || "Clinical report"}
            </h3>
            <p className="text-[11px] text-[#83938a] mt-1">{formatDate(report.date)}</p>
          </div>
        </div>
        <span className="rounded-lg bg-gradient-to-r from-[#eaf7ed] to-[#f0f8f2] px-2.5 py-1 text-[10px] font-bold capitalize text-[#25854d] flex-shrink-0 whitespace-nowrap">
          {report.type || "other"}
        </span>
      </div>
      
      <p className="line-clamp-2 text-xs leading-5 text-[#788a80] mb-4">
        {report.description || "Clinical document from your health record."}
      </p>
      
      <div className="flex items-center gap-2 mb-4">
        {report.status && report.status !== "pending" && (
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
              report.status === "abnormal" ? "bg-[#f3f7e9] text-[#708438]" : "bg-[#edf8f0] text-[#25854d]"
            }`}
          >
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </span>
        )}
        {report.ocrStatus && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#819b89] bg-[#f5fcf7] px-2 py-1 rounded-lg">
            OCR {report.ocrStatus}
          </span>
        )}
        {report.reviewStatus && (
          <span className="rounded-lg bg-[#eef5ff] px-2.5 py-1 text-[10px] font-bold capitalize text-[#42648f]">
            {report.reviewStatus === "pending" ? "Awaiting doctor review" : report.reviewStatus === "viewed" ? "Viewed by doctor" : `Reviewed${report.resultStatus && report.resultStatus !== "not_specified" ? ` · ${report.resultStatus}` : ""}`}
          </span>
        )}
      </div>
      {report.clinicalResult && <p className="mb-4 line-clamp-3 whitespace-pre-line rounded-lg bg-[#f2faf4] p-3 text-xs leading-5 text-[#365a43]"><strong>Doctor&apos;s result:</strong> {report.clinicalResult}</p>}
      
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPreview(report)}
          className="flex-1 rounded-lg border border-[#cfe5d5] px-3 py-2 text-xs font-bold text-[#25854d] hover:bg-[#f1f8f3] transition"
        >
          View
        </button>
        <button
          type="button"
          onClick={() => onDownload(report)}
          title="Download report"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#25854d] to-[#176b3d] text-white hover:shadow-lg transition flex-shrink-0"
        >
          <Download size={15} />
        </button>
        <button type="button" onClick={() => onDelete(report)} title="Delete report" className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition flex-shrink-0"><Trash2 size={15} /></button>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center text-center">
      <FileText size={30} className="text-[#6ca67b]" />
      <h3 className="mt-3 font-bold text-[#315343]">
        No clinical reports found
      </h3>
      <p className="mt-1 text-sm text-[#83938a]">
        Try changing your filters or upload a new report.
      </p>
    </div>
  );
}
function ErrorState({ message, retry }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center text-center">
      <AlertTriangle size={29} className="text-[#6ca67b]" />
      <h3 className="mt-3 font-bold">Unable to load reports</h3>
      <p className="mt-1 text-sm text-[#83938a]">{message}</p>
      <button
        type="button"
        onClick={retry}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25854d] px-4 py-2 text-xs font-bold text-white"
      >
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}

const isPatientOwnedReport = (report) =>
  String(report.uploadedByRole || "patient").toLowerCase() === "patient";

export default function PatientReports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const patientId =
    user?.patientId ||
    user?.id ||
    user?._id ||
    user?.uid;
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const reportData = await fetchReports();
      const allReports = Array.isArray(reportData) ? reportData : reportData.reports || [];
      setReports(allReports.filter((report) => isPatientOwnedReport(report, user)));
      const patientData = await fetchPatient(patientId).catch(() => null);
      setPatient(normalizePatient(patientData, user));
    } catch (requestError) {
      setError(requestError.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [patientId]);
  const filtered = useMemo(
    () =>
      reports
        .filter((report) => type === "all" || report.type === type)
        .filter((report) => status === "all" || report.status === status)
        .filter((report) => {
          const value = normalize(search);
          return (
            !value ||
            [
              report.name,
              report.testName,
              report.description,
              report.type,
              report.doctor?.name,
              report.labName,
            ].some((field) => normalize(field).includes(value))
          );
        })
        .filter((report) => {
          const date = new Date(report.date);
          return (
            (!from || date >= new Date(`${from}T00:00:00`)) &&
            (!to || date <= new Date(`${to}T23:59:59`))
          );
        })
        .sort((a, b) =>
          sort === "newest"
            ? new Date(b.date) - new Date(a.date)
            : new Date(a.date) - new Date(b.date),
        ),
    [from, reports, search, sort, status, to, type],
  );
  const exportReports = () => {
    const rows = filtered.map((report) =>
      [
        report.name,
        report.type,
        report.status,
        report.date,
        report.doctor?.name || report.labName,
      ]
        .map((value) => `"${String(value || "").replaceAll('"', '""')}"`)
        .join(","),
    );
    const blob = new Blob(
      [["Report,Type,Status,Date,Doctor or Facility", ...rows].join("\n")],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "meridian-clinical-reports.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setUploadError("");
      await uploadReport(file, patientId);
      toast.success("Report uploaded successfully!");
      await load();
      setUploadSuccess("Report uploaded successfully.");
      window.setTimeout(() => setUploadSuccess(""), 4000);
    } catch (requestError) {
      setUploadError(requestError.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };
  const handleDelete = async (report) => {
    if (!window.confirm(`Delete ${report.name || "this report"}?`)) return;
    try {
      setError("");
      await deleteReport(report._id);
      if (selected?._id === report._id) setSelected(null);
      await load();
      toast.success("Report deleted successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to delete report.");
    }
  };
  const handleDownload = async (report) => {
    try {
      await downloadReport(report);
      toast.success("Report download started.");
    } catch (requestError) {
      setError(requestError.message || "Unable to download report.");
    }
  };
  const labCount = reports.filter((report) => report.type === "lab").length;
  const imagingCount = reports.filter((report) =>
    ["imaging", "radiology"].includes(report.type),
  ).length;
  const clinicalCount = reports.filter(
    (report) => !["lab", "imaging", "radiology"].includes(report.type),
  ).length;
  return (
    <div className="min-h-screen bg-[#f7fbf8] text-[#173a28]">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-12 pt-7 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-[#d8eee0] bg-[#eaf7ed] px-6 py-8 shadow-[0_12px_40px_rgba(31,105,59,0.07)] sm:px-10 lg:py-10">
          <img
            src="/images/medical-login.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#eaf7ed] via-[#eaf7ed]/95 to-transparent" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#25854d]">
                <ShieldCheck size={15} /> Secure clinical documents
              </div>
              <h1 className="mt-3 text-3xl font-bold text-[#173a28] sm:text-4xl">
                Clinical Reports
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#62786b]">
                View and manage patient clinical reports.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#25854d] px-4 py-3 text-sm font-bold text-white hover:bg-[#176b3d] disabled:opacity-60"
              >
                <UploadCloud size={17} />{" "}
                {uploading ? "Uploading..." : "Upload report"}
              </button>
              <button
                type="button"
                onClick={exportReports}
                className="inline-flex items-center gap-2 rounded-xl border border-[#b9dac2] bg-white/80 px-4 py-3 text-sm font-bold text-[#25854d] hover:bg-white"
              >
                <Download size={17} /> Export
              </button>
            </div>
          </div>
        </section>
        {uploadError && (
          <p className="rounded-xl border border-[#d8e8dc] bg-[#f5fbf6] p-3 text-sm text-[#66806f]">
            {uploadError}
          </p>
        )}
        {uploadSuccess && (
          <p className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
            {uploadSuccess}
          </p>
        )}
        <section className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf7ed] text-lg font-bold text-[#25854d]">
                {String(patient?.name || "Patient")
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {patient?.name || "Patient profile"}
                </h2>
                <p className="mt-1 text-xs text-[#829188]">
                  Patient ID:{" "}
                  {patient?.patientId || patient?._id || "Not available"}
                </p>
                <p className="mt-1 text-sm text-[#587064]">
                  {patient?.age || "--"} years{" "}
                  {" "}
                  {patient?.gender || "--"}{" "}
                  {" "}
                  {patient?.bloodGroup || "--"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/patient/timeline")}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-[#cfe5d5] px-4 py-2.5 text-xs font-bold text-[#25854d] hover:bg-[#f1f8f3]"
            >
              View Timeline <ArrowUpRight size={15} />
            </button>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Total reports" value={reports.length} />
          <Stat label="Lab reports" value={labCount} />
          <Stat label="Imaging reports" value={imagingCount} />
          <Stat label="Clinical reports" value={clinicalCount} />
        </section>
        <section className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#dbe9df] px-3 text-sm text-[#829188] xl:max-w-md">
              <Search size={16} className="text-[#25854d]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reports, doctors, facilities"
                className="w-full bg-transparent outline-none"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="h-10 rounded-xl border border-[#dbe9df] px-3 text-xs font-semibold text-[#486355]"
              >
                {TYPES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 rounded-xl border border-[#dbe9df] px-3 text-xs font-semibold text-[#486355]"
              >
                <option value="all">All statuses</option>
                <option value="normal">Normal</option>
                <option value="abnormal">Abnormal</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="h-10 rounded-xl border border-[#dbe9df] px-3 text-xs text-[#486355]"
              />
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="h-10 rounded-xl border border-[#dbe9df] px-3 text-xs text-[#486355]"
              />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-10 rounded-xl border border-[#dbe9df] px-3 text-xs font-semibold text-[#486355]"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#25854d]">
                Document library
              </p>
              <h2 className="mt-1 text-xl font-bold">
                Reports list{" "}
                <span className="text-sm font-normal text-[#87958d]">
                  ({filtered.length})
                </span>
              </h2>
            </div>
            <SlidersHorizontal size={19} className="text-[#75ad84]" />
          </div>
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 sm:-mx-6 sm:px-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-48 w-96 flex-shrink-0 animate-pulse rounded-2xl bg-[#eef7f0]"
                />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error} retry={load} />
          ) : filtered.length ? (
            <>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 sm:-mx-6 sm:px-6 snap-x snap-mandatory">
                {filtered.map((report) => (
                  <div key={report._id} className="snap-start">
                    <ReportCard
                      report={report}
                      onPreview={setSelected}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-center text-[#83938a] mt-2">💡 Scroll horizontally to view more reports</p>
            </>
          ) : (
            <EmptyState />
          )}
        </section>
      </main>
      {selected && (
        <ReportDrawer
          report={selected}
          onClose={() => setSelected(null)}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-[0_8px_28px_rgba(31,105,59,0.04)]">
      <p className="text-xs text-[#84948b]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#25854d]">{value}</p>
      <div className="mt-3 h-1.5 rounded-full bg-[#edf6ef]">
        <div className="h-full w-2/3 rounded-full bg-[#74b587]" />
      </div>
    </div>
  );
}
function ReportDrawer({ report, onClose, onDownload, onDelete }) {
  const [summary, setSummary] = useState(report.aiSummary || "");
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    setSummary(report.aiSummary || "");
  }, [report._id, report.aiSummary]);

  const createSummary = async () => {
    try {
      setSummaryLoading(true);
      const result = await generateReportSummary(report._id);
      setSummary(result.summary || "");
    } catch (error) {
      setSummary(`Unable to generate summary: ${error.message}`);
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-[#123a28]/20">
      <aside className="h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#25854d]">
              Report preview
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#173a28]">
              {report.name || report.testName || "Clinical report"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0f8f2] text-[#25854d]"
          >
            <X size={17} />
          </button>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-4 rounded-2xl bg-[#f4faf5] p-5">
          <Detail label="Type" value={report.type} />
          <Detail label="Status" value={report.status} />
          <Detail label="Doctor review" value={report.reviewStatus === "viewed" ? "Viewed by doctor · result pending" : report.reviewStatus === "reviewed" ? `Reviewed${report.resultStatus && report.resultStatus !== "not_specified" ? ` · ${report.resultStatus}` : ""}` : "Awaiting doctor review"} />
          <Detail label="Date" value={formatDate(report.date)} />
          <Detail label="Time" value={formatDateTime(report.date).split(", ").pop()} />
          <Detail
            label="Doctor / facility"
            value={report.doctor?.name || report.labName}
          />
        </div>
        <DetailBlock
          label="Findings"
          value={
            report.description || "No findings were provided with this report."
          }
        />
        <DetailBlock
          label="Lab results"
          value={report.testName || "No structured lab values were provided."}
        />
        {report.clinicalResult && <DetailBlock label="Doctor's result" value={report.clinicalResult} />}
        <DetailBlock
          label="Extracted report text"
          value={report.extractedText || "No text was extracted from this file."}
        />
        {report.fileUrl && (
          <div className="mt-7 overflow-hidden rounded-2xl border border-[#dcebe0] bg-[#f7fbf8]">
            <div className="border-b border-[#dcebe0] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#527261]">Original file</div>
            {report.fileType?.startsWith("image/") ? <img src={report.fileUrl} alt={report.name || "Clinical report"} className="max-h-[420px] w-full object-contain p-3" /> : <iframe title="Clinical report file" src={report.fileUrl} className="h-[520px] w-full bg-white" />}
          </div>
        )}
        <div className="mt-6 rounded-2xl border border-[#cfe8d6] bg-[#eff9f1] p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[#25854d]">
              <Sparkles size={17} />
              <h3 className="font-bold">AI clinical summary</h3>
            </div>
            {!summary && report.extractedText && (
              <button type="button" onClick={createSummary} disabled={summaryLoading} className="inline-flex items-center gap-2 rounded-xl bg-[#25854d] px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                <Sparkles size={14} /> {summaryLoading ? "Interpreting..." : "Generate summary"}
              </button>
            )}
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#365a43]">
            {summary || "AI summary will appear when clinical interpretation is available."}
          </p>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => onDownload(report)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25854d] px-4 py-3 text-sm font-bold text-white"
          >
            <Download size={16} /> Download report
          </button>
          <button
            type="button"
            onClick={() => onDelete(report)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </aside>
    </div>
  );
}
function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#9aaa9f]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold capitalize text-[#3a5a48]">
        {value || "Not recorded"}
      </p>
    </div>
  );
}
function DetailBlock({ label, value }) {
  return (
    <div className="mt-7">
      <h3 className="font-bold text-[#315343]">{label}</h3>
      <p className={`mt-2 text-sm leading-6 text-[#71857a] ${label === "Extracted report text" ? "max-h-48 overflow-y-auto whitespace-pre-line rounded-xl bg-[#f7fbf8] p-3 font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}
