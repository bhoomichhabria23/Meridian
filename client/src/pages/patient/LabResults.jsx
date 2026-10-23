import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CalendarDays, Download, FlaskConical, Search, ShieldCheck, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import Navbar from "../../components/Navbar";
import api from "../../api/axios";
import { fetchProfile } from "../../services/profileService";
import { deleteReport, downloadReport } from "../../services/reportService";
import toast from "react-hot-toast";

const formatDate = (value) => {
  if (!value) return "Not dated";
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const normalizeLab = (item) => {
  const data = item || {};
  const uploadedName = data.fileName ? data.fileName.replace(/\.[^/.]+$/, "") : "";
  const resultLines = (data.results || []).map((result) => `${result.parameter || data.testName || "Result"}: ${result.value ?? ""}${result.unit ? ` ${result.unit}` : ""}`);
  const resultStatuses = (data.results || []).map((result) => String(result.status || "").toLowerCase());
  const structuredStatus = resultStatuses.includes("critical") ? "critical" : resultStatuses.includes("abnormal") ? "abnormal" : resultStatuses.includes("normal") ? "normal" : "";
  return {
    id: data._id || data.id,
    name: data.testName || data.name || uploadedName || "Uploaded lab report",
    value: String(data.clinicalResult || resultLines.join("\n") || "").trim(),
    unit: data.unit || "",
    status: String(data.resultStatus && data.resultStatus !== "not_specified" ? data.resultStatus : data.status || structuredStatus || "Not provided").toLowerCase(),
    reviewStatus: String(data.reviewStatus || "pending").toLowerCase(),
    resultStatus: String(data.resultStatus || "not_specified").toLowerCase(),
    ocrStatus: String(data.ocrStatus || "not_applicable").toLowerCase(),
    date: data.date || data.createdAt || data.month || null,
    labName: data.labName?.name || data.labName || data.laboratory?.name || data.facility || "Facility not recorded",
    notes: data.notes || data.description || "No additional notes provided",
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    attachments: data.attachments || [],
    source: data.source || "report",
  };
};

function StatusBadge({ status, reviewStatus, resultStatus }) {
  if (reviewStatus === "viewed") return <span className="rounded-full bg-[#eef5ff] px-2.5 py-1 text-[10px] font-bold text-[#42648f]">Viewed by doctor · result pending</span>;
  if (reviewStatus === "reviewed") {
    const label = resultStatus && resultStatus !== "not_specified" ? `Reviewed · ${resultStatus}` : "Reviewed";
    return <span className="rounded-full bg-[#edf8f0] px-2.5 py-1 text-[10px] font-bold capitalize text-[#25854d]">{label}</span>;
  }
  if (reviewStatus === "pending" && status === "pending") return <span className="rounded-full bg-[#f1f3f2] px-2.5 py-1 text-[10px] font-bold text-[#718078]">Awaiting doctor review</span>;
  const tone = status === "critical" ? "bg-[#fff0ef] text-[#c7524e]" : status === "abnormal" ? "bg-[#fff7e8] text-[#b47821]" : ["normal", "completed"].includes(status) ? "bg-[#edf8f0] text-[#25854d]" : "bg-[#f1f3f2] text-[#718078]";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${tone}`}>{status === "pending" ? "Pending review" : status}</span>;
}

function Metric({ icon: Icon, label, value, caption }) {
  return <div className="rounded-2xl border border-[#dcece1] bg-white p-4 shadow-[0_8px_24px_rgba(31,105,59,0.04)]"><div className="flex items-center gap-2 text-[#25854d]"><Icon size={17} /><span className="text-[11px] font-bold text-[#587966]">{label}</span></div><strong className="mt-3 block text-2xl text-[#183a28]">{value}</strong><p className="mt-1 text-[10px] text-[#83938a]">{caption}</p></div>;
}

export default function LabResults() {
  const [results, setResults] = useState([]);
  const [selectedTest, setSelectedTest] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const profile = await fetchProfile();
        const patientId = profile?._id || profile?.id || profile?.patient?.userId?._id || profile?.patient?.userId;
        const [reportsResponse, labsResponse] = await Promise.all([
          api.get("/api/reports/lab-results"),
          patientId ? api.get(`/api/medical-records/labs/${encodeURIComponent(patientId)}`) : Promise.resolve({ data: [] }),
        ]);
        const reportRecords = Array.isArray(reportsResponse.data) ? reportsResponse.data : reportsResponse.data?.reports || [];
        const labRecords = Array.isArray(labsResponse.data) ? labsResponse.data : labsResponse.data?.data || [];
        const records = [
          ...reportRecords.filter((report) => report.type === "lab").map((report) => ({ ...report, source: "report" })),
          ...labRecords.map((lab) => ({ ...lab, source: "lab-record" })),
        ];
        setResults(records.map(normalizeLab).sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch (requestError) {
        setError(requestError.response?.data?.message || requestError.message || "Unable to load lab results.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const testTypes = useMemo(() => ["all", ...new Set(results.map((result) => result.name))], [results]);
  const filtered = useMemo(() => results.filter((result) => selectedTest === "all" || result.name === selectedTest).filter((result) => !search.trim() || [result.name, result.labName, result.status, result.reviewStatus, result.notes, result.value].some((value) => String(value || "").toLowerCase().includes(search.toLowerCase().trim()))), [results, search, selectedTest]);
  const normalCount = results.filter((result) => result.status === "normal").length;
  const attentionCount = results.filter((result) => ["abnormal", "critical"].includes(result.status)).length;
  const latest = filtered[0];
  const uploadedFiles = results.flatMap((result) => [
    ...(result.fileUrl ? [{ key: `${result.id}-report-file`, name: result.fileName || result.name, report: result }] : []),
    ...result.attachments.filter((file) => file.fileUrl).map((file, index) => ({
      key: `${result.id}-attachment-${index}`,
      name: file.fileName || result.name,
      url: file.fileUrl,
    })),
  ]).filter((file, index, all) => all.findIndex((item) => item.key === file.key || (item.name === file.name && item.url === file.url)) === index);

  const handleDeleteReport = async (report) => {
    const reportId = report?._id || report?.reportId || report?.id;
    if (!reportId || !window.confirm(`Delete ${report.name || report.fileName || "this report"}?`)) return;

    try {
      await deleteReport(reportId);
      setResults((current) => current.filter((item) => String(item.id) !== String(reportId)));
      toast.success("Report deleted successfully.");
    } catch (requestError) {
      toast.error(requestError.message || "Unable to delete report.");
    }
  };

  return <div className="min-h-screen bg-[#f5faf7] text-[#183a28]"><Navbar /><main className="mx-auto max-w-[1500px] space-y-6 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[26px] border border-[#cfe7d6] bg-gradient-to-br from-white via-white to-[#e8f7ec] p-6 shadow-[0_14px_44px_rgba(31,105,59,0.08)] sm:p-8"><div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#25854d]">Clinical records</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#183a28]">Lab Results</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#6d8375]">Review your test history, monitor changes, and keep your care team informed.</p></div><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#25854d] shadow-sm"><FlaskConical size={28} /></div></div></section>

    <section className="grid gap-4 sm:grid-cols-3"><Metric icon={FlaskConical} label="Total records" value={results.length} caption="Uploaded reports and test results" /><Metric icon={ShieldCheck} label="Normal results" value={normalCount} caption="Marked within expected range" /><Metric icon={AlertTriangle} label="Needs attention" value={attentionCount} caption="Marked abnormal or critical" /></section>

    <section className="rounded-2xl border border-[#dcece1] bg-white p-5 shadow-[0_8px_28px_rgba(31,105,59,0.05)] sm:p-6"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><h2 className="text-lg font-bold text-[#244b35]">Your test history</h2><p className="mt-1 text-xs text-[#83938a]">Every result shown here belongs to your health record.</p></div><label className="relative block w-full lg:w-72"><Search size={16} className="absolute left-3 top-3 text-[#8ba293]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search results" className="h-10 w-full rounded-xl border border-[#dbe9df] bg-[#fbfefc] pl-9 pr-3 text-xs text-[#315343] outline-none focus:border-[#25854d]" /></label></div><div className="mt-5 flex gap-2 overflow-x-auto pb-1">{testTypes.map((test) => <button key={test} type="button" onClick={() => setSelectedTest(test)} className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-bold transition ${selectedTest === test ? "bg-[#25854d] text-white" : "border border-[#d5e9da] bg-[#f7fcf8] text-[#587966] hover:bg-[#edf8f0]"}`}>{test === "all" ? "All tests" : test}</button>)}</div>
      {loading ? <div className="flex min-h-64 items-center justify-center text-sm text-[#83938a]">Loading lab results...</div> : error ? <div className="flex min-h-64 flex-col items-center justify-center text-center"><AlertTriangle className="text-[#c7524e]" size={28} /><p className="mt-3 text-sm font-bold">Unable to load lab results</p><p className="mt-1 text-xs text-[#83938a]">{error}</p></div> : filtered.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center text-center"><FlaskConical className="text-[#8fc39d]" size={32} /><p className="mt-3 font-bold text-[#315343]">No lab results found</p><p className="mt-1 text-sm text-[#83938a]">Results will appear here after they are added to your record.</p></div> : <div className="mt-4 overflow-x-auto"><div className="min-w-[650px]"><div className="grid grid-cols-[1.6fr_0.8fr_1fr_0.8fr] gap-4 border-b border-[#edf3ee] px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8aa091]"><span>Test</span><span>Doctor&apos;s result</span><span>Facility / date</span><span>Status</span></div>{filtered.map((result) => <article key={result.id} className="grid grid-cols-[1.6fr_0.8fr_1fr_0.8fr] items-start gap-4 border-b border-[#edf3ee] px-3 py-4 last:border-0"><div><p className="text-sm font-bold text-[#315343]">{result.name}</p><p className="mt-1 text-[11px] text-[#8a9b90]">{result.notes || "No additional notes provided"}</p></div><p className="whitespace-pre-line text-sm leading-5 text-[#244b35]">{result.value || "Awaiting doctor result"}</p><div className="text-xs text-[#587966]"><p>{result.labName || "Facility not provided"}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-[#8a9b90]"><CalendarDays size={12} />{formatDate(result.date)}</p></div><div><StatusBadge status={result.status} reviewStatus={result.reviewStatus} resultStatus={result.resultStatus} /></div></article>)}</div></div>}
    </section>

    {latest && <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]"><div className="rounded-2xl border border-[#cfe7d6] bg-[#eff9f1] p-5"><div className="flex items-center gap-2 text-[#25854d]"><Activity size={18} /><h2 className="font-bold">Latest doctor result</h2></div><div className="mt-4">{latest.value ? <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-sm text-[#587966]">{latest.name}</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#405d4c]">{latest.value}</p></div><div className="shrink-0"><StatusBadge status={latest.status} reviewStatus={latest.reviewStatus} resultStatus={latest.resultStatus} /></div></div> : <p className="text-sm leading-6 text-[#405d4c]">Awaiting doctor result</p>}</div></div><div className="rounded-2xl border border-[#dcece1] bg-white p-5"><div className="flex items-center gap-2 text-[#25854d]"><TrendingUp size={18} /><h2 className="font-bold">Stay informed</h2></div><p className="mt-3 text-sm leading-6 text-[#66806f]">Bring your latest results to your next appointment so your care team can review changes with you.</p></div></section>}
    {uploadedFiles.length > 0 && <section className="rounded-2xl border border-[#dcece1] bg-white p-5 shadow-[0_8px_28px_rgba(31,105,59,0.05)] sm:p-6"><div className="flex items-center gap-2 text-[#25854d]"><Download size={18} /><h2 className="font-bold">Uploaded files</h2></div><div className="mt-4 flex flex-wrap gap-3">{uploadedFiles.map((file) => file.report ? <div key={file.key} className="inline-flex items-center gap-1 rounded-xl border border-[#cfe5d5] bg-[#f7fcf8] p-1"><button type="button" onClick={() => downloadReport(file.report).catch((error) => toast.error(error.message || "Unable to download lab report."))} className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-[#25854d] hover:bg-[#edf8f0]"><Download size={14} /> {file.name}</button><button type="button" onClick={() => handleDeleteReport(file.report)} title="Delete report" className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={14} /></button></div> : <a key={file.key} href={file.url} target="_blank" rel="noreferrer" download={file.name} className="inline-flex items-center gap-2 rounded-xl border border-[#cfe5d5] bg-[#f7fcf8] px-3 py-2 text-xs font-bold text-[#25854d] hover:bg-[#edf8f0]"><Download size={14} /> {file.name}</a>)}</div></section>}
  </main></div>;
}
