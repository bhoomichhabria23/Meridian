import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, ArrowUpRight, CalendarDays, ChevronRight, ClipboardList,
  Clock3, Download, FileText, HeartPulse, RefreshCw, Search, ShieldCheck, Sparkles,
  Stethoscope, TestTube2, Plus, X,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "../../context/AuthContext";
import { addHealthRecord, loadPatientTimeline } from "../../services/timelineService";
import Navbar from "../../components/Navbar";

const FILTERS = [
  ["all", "All"], ["appointment", "Visits"], ["diagnosis", "Diagnoses"],
  ["report", "Lab Reports"], ["medication", "Medications"], ["procedure", "Procedures"],
  ["prescription", "Prescriptions"], ["insight", "AI Insights"],
];

const EVENT_STYLES = {
  appointment: { icon: CalendarDays, tone: "bg-emerald-50 text-emerald-700" },
  diagnosis: { icon: Stethoscope, tone: "bg-green-50 text-green-700" },
  report: { icon: TestTube2, tone: "bg-lime-50 text-lime-700" },
  medication: { icon: Activity, tone: "bg-teal-50 text-teal-700" },
  prescription: { icon: ClipboardList, tone: "bg-green-100 text-green-800" },
  procedure: { icon: HeartPulse, tone: "bg-emerald-100 text-emerald-800" },
  insight: { icon: Sparkles, tone: "bg-green-50 text-green-700" },
  default: { icon: Clock3, tone: "bg-gray-100 text-gray-600" },
};

export default function Timeline() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const patientId = user?.id || user?._id || user?.patientId || user?.uid;
  const [data, setData] = useState({ patient: null, events: [], recordCounts: {}, insights: [], healthTrends: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [record, setRecord] = useState({ type: "update", title: "", description: "", date: new Date().toISOString().slice(0, 10), metric: "", value: "", unit: "" });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      setData(await loadPatientTimeline(patientId));
    } catch (requestError) {
      setError(requestError.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [patientId]);

  const saveRecord = async (event) => {
    event.preventDefault();
    try {
      setError("");
      await addHealthRecord(patientId, record);
      setRecordOpen(false);
      setRecord({ type: "update", title: "", description: "", date: new Date().toISOString().slice(0, 10), metric: "", value: "", unit: "" });
      await fetchData();
    } catch (requestError) {
      setError(requestError.message || "Unable to save health record.");
    }
  };

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.events
      .filter((event) => eventType === "all" || event.type === eventType)
      .filter((event) => {
        const date = new Date(event.date);
        return (!fromDate || date >= new Date(`${fromDate}T00:00:00`))
          && (!toDate || date <= new Date(`${toDate}T23:59:59`));
      })
      .filter((event) => !query || [event.title, event.description, event.doctor, event.facility, event.type, event.summary]
        .some((value) => String(value || "").toLowerCase().includes(query)))
      .sort((first, second) => {
        const difference = new Date(first.date) - new Date(second.date);
        return sortOrder === "newest" ? -difference : difference;
      });
  }, [data.events, eventType, fromDate, search, sortOrder, toDate]);

  const recordExport = () => {
    const rows = filteredEvents.map((event) => [event.date, event.type, event.title, event.description || event.summary, event.doctor, event.facility]
      .map(csvValue).join(","));
    const blob = new Blob([["Date,Type,Event,Description,Clinician,Facility", ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "meridian-medical-timeline.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f8fbf9] text-[#183126]">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-[28px] border border-[#d9eee0] bg-white px-5 py-7 shadow-[0_12px_40px_rgba(36,104,65,0.06)] sm:px-8 lg:px-10">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#e5f5e9] blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#2d9960]"><ShieldCheck size={15} /> Clinical record</div>
              <h1 className="text-3xl font-bold tracking-[-0.03em] text-[#123a28] sm:text-4xl">Patient Timeline</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#708079]">A complete chronological view of the patient&apos;s clinical journey.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex h-10 items-center gap-2 rounded-xl border border-[#dbe9df] bg-[#fbfdfb] px-3 text-sm text-[#6d7f76] focus-within:border-[#2d9960]"><Search size={16} className="text-[#2d9960]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search timeline" className="w-36 bg-transparent outline-none placeholder:text-[#9baa9f] sm:w-44" /></label>
              <button type="button" onClick={() => setRecordOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#b9dac2] bg-white px-4 text-sm font-semibold text-[#237c4b] transition hover:bg-[#f1f8f3]"><Plus size={16} /> Add record</button><button type="button" onClick={recordExport} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#237c4b] px-4 text-sm font-semibold text-white transition hover:bg-[#17633a]"><Download size={16} /> Export</button>
            </div>
          </div>
        </header>

        <PatientOverview patient={data.patient} navigate={navigate} loading={loading} />

        <section className="rounded-2xl border border-[#dfece2] bg-white p-4 shadow-[0_5px_24px_rgba(28,86,51,0.04)] sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">{FILTERS.map(([value, label]) => <button key={value} type="button" onClick={() => setEventType(value)} className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${eventType === value ? "bg-[#237c4b] text-white shadow-sm" : "bg-[#f1f8f3] text-[#5c7668] hover:bg-[#e3f1e7]"}`}>{label}</button>)}</div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-[#83928a]"><span>From</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="rounded-lg border border-[#dbe9df] px-2 py-2 text-xs text-[#486355] outline-none focus:border-[#2d9960]" /></label>
              <label className="flex items-center gap-2 text-xs text-[#83928a]"><span>To</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="rounded-lg border border-[#dbe9df] px-2 py-2 text-xs text-[#486355] outline-none focus:border-[#2d9960]" /></label>
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="h-9 rounded-lg border border-[#dbe9df] bg-white px-3 text-xs font-semibold text-[#486355] outline-none focus:border-[#2d9960]"><option value="newest">Newest First</option><option value="oldest">Oldest First</option></select>
            </div>
          </div>
        </section>

        {error ? <ErrorState message={error} retry={fetchData} /> : <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="min-w-0 rounded-2xl border border-[#dfece2] bg-white p-5 shadow-[0_5px_24px_rgba(28,86,51,0.04)] sm:p-7">
            <div className="mb-7 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#2d9960]">Longitudinal record</p><h2 className="mt-1 text-xl font-bold text-[#183126]">Clinical events</h2></div><span className="text-xs text-[#89988f]">{loading ? "Loading" : `${filteredEvents.length} shown`}</span></div>
            {loading ? <TimelineSkeleton /> : filteredEvents.length ? <div className="relative space-y-5 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-[#c8e4d1]">{filteredEvents.map((event) => <TimelineEvent key={event.id} event={event} expanded={expandedId === event.id} onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)} />)}</div> : <EmptyState />}
          </div>
          <aside className="space-y-6"><InsightsCard insights={data.insights} loading={loading} /><SummaryCard events={data.events} recordCounts={data.recordCounts} /></aside>
        </section>}

        <section><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#2d9960]">Longitudinal signals</p><h2 className="mt-1 text-2xl font-bold text-[#183126]">Health trends</h2></div><Activity size={22} className="text-[#73b889]" /></div><div className="grid gap-4 sm:grid-cols-2">{[["bloodPressure", "Blood pressure", "mmHg"], ["heartRate", "Heart rate", "bpm"], ["glucose", "HbA1c / blood glucose", "mg/dL"], ["weight", "Weight", "kg"]].map(([key, title, unit]) => <HealthTrendCard key={key} title={title} unit={unit} values={data.healthTrends?.[key] || []} loading={loading} />)}</div></section>
      </main>
      {recordOpen && <HealthRecordModal record={record} setRecord={setRecord} onClose={() => setRecordOpen(false)} onSubmit={saveRecord} />}
    </div>
  );
}

function HealthRecordModal({ record, setRecord, onClose, onSubmit }) {
  const update = (key, value) => setRecord((current) => ({ ...current, [key]: value }));
  const metricUnits = { bloodPressure: "mmHg", heartRate: "bpm", glucose: "mg/dL", weight: "kg" };
  const selectMetric = (metric) => setRecord((current) => ({ ...current, metric, unit: metricUnits[metric] || "" }));
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b2b1c]/45 p-4 backdrop-blur-md"><form onSubmit={onSubmit} className="w-full max-w-xl overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_30px_100px_rgba(8,50,30,0.28)]"><div className="bg-gradient-to-br from-[#123f2a] via-[#17633d] to-[#25935b] px-7 py-7 text-white"><div className="flex items-start justify-between gap-5"><div className="flex items-start gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><HeartPulse size={22} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">Clinical record</p><h2 className="mt-2 text-2xl font-bold">Add health record</h2><p className="mt-1 text-sm text-emerald-50/75">Capture a visit, observation, or personal health measurement.</p></div></div><button type="button" onClick={onClose} className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-white/80"><X size={16} /></button></div></div><div className="space-y-4 px-7 py-7"><label className="block text-xs font-bold text-[#315343]">Record title<input required value={record.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Home blood pressure check" className="input mt-1.5 w-full rounded-xl border-[#d7e9dc]" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-bold text-[#315343]">Record type<select value={record.type} onChange={(event) => update("type", event.target.value)} className="input mt-1.5 w-full rounded-xl border-[#d7e9dc]"><option value="update">General update</option><option value="diagnosis">Diagnosis</option><option value="procedure">Procedure</option><option value="allergy">Allergy</option></select></label><label className="block text-xs font-bold text-[#315343]">Date<input required type="date" value={record.date} onChange={(event) => update("date", event.target.value)} className="input mt-1.5 w-full rounded-xl border-[#d7e9dc]" /></label></div><div className="rounded-2xl border border-[#e1efe4] bg-[#f6fbf7] p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#527261]">Trend measurement <span className="font-normal normal-case tracking-normal text-[#84978b]">optional</span></p><div className="mt-3 grid gap-3 sm:grid-cols-3"><select value={record.metric} onChange={(event) => selectMetric(event.target.value)} className="input border-[#d7e9dc]"><option value="">Metric</option><option value="bloodPressure">Blood pressure</option><option value="heartRate">Heart rate</option><option value="glucose">HbA1c / glucose</option><option value="weight">Weight</option></select><input type="number" step="any" value={record.value} onChange={(event) => update("value", event.target.value)} placeholder="Value" className="input border-[#d7e9dc]" /><input readOnly value={record.unit} placeholder="Unit" className="input border-[#d7e9dc] bg-[#edf6ef] text-[#527261]" /></div></div><label className="block text-xs font-bold text-[#315343]">Notes<textarea value={record.description} onChange={(event) => update("description", event.target.value)} placeholder="Add context or notes" className="input mt-1.5 min-h-20 w-full resize-none rounded-xl border-[#d7e9dc]" /></label></div><div className="flex justify-end gap-3 border-t border-[#edf3ee] px-7 py-5"><button type="button" onClick={onClose} className="rounded-xl border border-[#d7e9dc] px-5 py-3 text-sm font-bold text-[#527261]">Cancel</button><button type="submit" className="rounded-xl bg-gradient-to-r from-[#197447] to-[#25935b] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(25,116,71,0.2)]">Save record</button></div></form></div>;
}

function PatientOverview({ patient, navigate, loading }) {
  if (loading) return <div className="h-52 animate-pulse rounded-2xl bg-[#eaf4ed]" />;
  const initials = String(patient?.name || "Patient").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const visitDate = patient?.lastVisit || patient?.nextAppointment;
  const visitLabel = patient?.lastVisit ? "Last visit" : patient?.nextAppointment ? "Next appointment" : "Last visit";
  return <section className="rounded-2xl border border-[#dfece2] bg-white p-5 shadow-[0_5px_24px_rgba(28,86,51,0.04)] sm:p-7"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-start"><div className="flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#e4f3e8] text-lg font-bold text-[#237c4b]">{patient?.profileImage ? <img src={patient.profileImage} alt="" className="h-full w-full object-cover" /> : initials}</div><div><h2 className="text-xl font-bold text-[#183126]">{patient?.name || "Patient profile"}</h2><p className="mt-1 text-xs text-[#829189]">Patient ID: {patient?.patientId || "Awaiting record ID"}</p><p className="mt-2 text-sm text-[#587064]">{patient?.age ? `${patient.age} years` : "Age unavailable"} <span className="mx-1 text-[#c4d4c9]">•</span> {patient?.gender || "Gender unavailable"}</p></div></div><button type="button" onClick={() => navigate("/patient/dashboard")} className="inline-flex items-center gap-2 self-start rounded-xl border border-[#cfe5d5] px-4 py-2.5 text-xs font-bold text-[#237c4b] transition hover:bg-[#f1f8f3]">View Profile <ArrowUpRight size={15} /></button></div><div className="mt-7 grid gap-4 border-t border-[#edf3ee] pt-5 sm:grid-cols-3"><OverviewMetric label="Blood group" value={patient?.bloodGroup || "Not recorded"} /><OverviewMetric label={visitLabel} value={visitDate ? formatDateTime(visitDate) : "Not recorded"} /><OverviewMetric label="Primary condition" value={patient?.primaryCondition || "Not recorded"} /></div></section>;
}

function OverviewMetric({ label, value }) { return <div><p className="text-xs text-[#8a9991]">{label}</p><p className="mt-1 text-sm font-bold text-[#315343]">{value}</p></div>; }

function TimelineEvent({ event, expanded, onToggle }) {
  const style = EVENT_STYLES[event.type] || EVENT_STYLES.default;
  const Icon = style.icon;
  return <article className="relative pl-10"><div className={`absolute left-0 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white ${style.tone}`}><Icon size={14} /></div><div className="rounded-2xl border border-[#e2ede5] bg-[#fcfefd] p-5 transition duration-200 hover:border-[#abd5b7] hover:shadow-[0_8px_25px_rgba(35,124,75,0.08)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${style.tone}`}>{event.type || "event"}</span><span className="text-xs text-[#839289]">{formatDateTime(event.date)}</span></div><h3 className="mt-3 text-base font-bold text-[#183126]">{event.title || "Clinical event"}</h3><p className="mt-1 text-xs text-[#728279]">{event.doctor || "Clinician not recorded"}{event.facility ? ` • ${event.facility}` : ""}</p></div>{event.status && <span className="rounded-full bg-[#edf8f0] px-2.5 py-1 text-[10px] font-bold text-[#237c4b]">{event.status}</span>}</div><p className="mt-4 text-sm leading-6 text-[#5f7167]">{event.summary || event.description || "No clinical summary was provided for this event."}</p>{event.importantValue && <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#d8e8dc] bg-[#f5fbf6] p-3"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#6da778]" /><div><p className="text-xs font-bold text-[#3c6e4d]">Important result</p><p className="mt-1 text-sm text-[#587064]">{event.importantValue}</p></div></div>}<button type="button" onClick={onToggle} className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#237c4b]">{expanded ? "Hide details" : "View details"}<ChevronRight size={14} className={`transition ${expanded ? "rotate-90" : ""}`} /></button>{expanded && <div className="mt-4 grid gap-4 border-t border-[#e8f0ea] pt-4 text-xs text-[#65786d] sm:grid-cols-2"><Detail label="Clinical notes" value={event.details?.notes || event.description} /><Detail label="Diagnosis" value={event.details?.diagnosis} /><Detail label="Vitals" value={event.details?.vitals} /><Detail label="Lab values" value={event.details?.labs} /><Detail label="Medications" value={event.details?.medications} /><Detail label="Recommendations" value={event.details?.recommendations} /><Detail label="Attachments" value={event.details?.attachments} /><Detail label="Timestamp" value={formatDateTime(event.date)} /></div>}</div></article>;
  }

function Detail({ label, value }) { return <div><p className="font-bold text-[#315343]">{label}</p><p className="mt-1 leading-5">{value || "Not recorded"}</p></div>; }
function InsightsCard({ insights, loading }) { return <section className="rounded-2xl border border-[#cde6d4] bg-[#f1f9f3] p-5 sm:p-6"><div className="flex items-center gap-2 text-[#237c4b]"><Sparkles size={17} /><h2 className="font-bold">AI Clinical Insights</h2></div><p className="mt-2 text-xs leading-5 text-[#6f8176]">Longitudinal patterns identified from the patient&apos;s clinical history.</p>{loading ? <div className="mt-6 space-y-3 animate-pulse"><div className="h-4 w-3/4 rounded bg-[#d7eddd]" /><div className="h-10 rounded bg-[#d7eddd]" /></div> : insights.length ? <div className="mt-5 space-y-4">{insights.map((insight) => <div key={insight.id} className="border-t border-[#d8ecdd] pt-4"><p className="text-sm font-bold text-[#285b3a]">{insight.title}</p><p className="mt-1 text-xs leading-5 text-[#65786d]">{insight.description}</p>{insight.recommendation && <p className="mt-3 text-xs font-semibold leading-5 text-[#3f6d4d]">Recommended follow-up: {insight.recommendation}</p>}</div>)}</div> : <p className="mt-5 rounded-xl bg-white/70 p-4 text-xs leading-5 text-[#71857a]">Insights will appear when enough clinical history is available.</p>}<button type="button" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#237c4b]">View full analysis <ArrowUpRight size={14} /></button></section>; }
function SummaryCard({ events, recordCounts }) { const eventCounts = events.reduce((result, event) => ({ ...result, [event.type]: (result[event.type] || 0) + 1 }), {}); const counts = { ...eventCounts, appointment: recordCounts.visits ?? eventCounts.appointment, diagnosis: recordCounts.diagnoses ?? eventCounts.diagnosis }; return <section className="rounded-2xl border border-[#dfece2] bg-white p-5 shadow-[0_5px_24px_rgba(28,86,51,0.04)]"><h2 className="font-bold text-[#183126]">Record summary</h2><p className="mt-1 text-xs text-[#84938b]">Activity across all recorded history</p><div className="mt-5 grid grid-cols-2 gap-3">{[["Visits", counts.appointment], ["Diagnoses", counts.diagnosis], ["Reports", counts.report], ["Prescriptions", counts.prescription]].map(([label, value]) => <div key={label} className="rounded-xl bg-[#f5faf6] p-3"><p className="text-[11px] text-[#819087]">{label}</p><p className="mt-1 text-xl font-bold text-[#237c4b]">{value || 0}</p></div>)}</div></section>; }
function HealthTrendCard({ title, unit, values, loading }) { return <section className="rounded-2xl border border-[#dfece2] bg-white p-5 shadow-[0_5px_24px_rgba(28,86,51,0.04)]"><div className="flex items-start justify-between"><div><h3 className="font-bold text-[#315343]">{title}</h3><p className="mt-1 text-xs text-[#8a9991]">{unit}</p></div><HeartPulse size={17} className="text-[#78b98c]" /></div>{loading ? <div className="mt-5 h-28 animate-pulse rounded-xl bg-[#eef7f0]" /> : values.length ? <div className="mt-4 h-28"><ResponsiveContainer width="100%" height="100%"><AreaChart data={values}><CartesianGrid vertical={false} stroke="#edf3ee" /><XAxis dataKey="label" hide /><YAxis hide domain={["auto", "auto"]} /><Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dcebe0", fontSize: 11 }} /><Area type="monotone" dataKey="value" stroke="#31925a" strokeWidth={2} fill="#dff1e3" /></AreaChart></ResponsiveContainer></div> : <div className="mt-4 flex h-28 items-center justify-center rounded-xl bg-[#f7fbf8] text-center text-xs text-[#8a9991]">No trend data available</div>}</section>; }
function TimelineSkeleton() { return <div className="space-y-5">{[1, 2, 3].map((item) => <div key={item} className="flex animate-pulse gap-4 pl-10"><div className="h-32 flex-1 rounded-2xl bg-[#eef6ef]" /></div>)}</div>; }
function EmptyState() { return <div className="flex min-h-[310px] flex-col items-center justify-center text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f6ec] text-[#31925a]"><FileText size={24} /></div><h3 className="mt-4 font-bold text-[#315343]">No medical events found</h3><p className="mt-2 text-xs text-[#819087]">Try changing the selected date range or event filters.</p></div>; }
function ErrorState({ message, retry }) { return <div className="rounded-2xl border border-[#dfece2] bg-white p-12 text-center shadow-sm"><AlertTriangle className="mx-auto text-[#6da778]" size={30} /><h2 className="mt-4 text-lg font-bold text-[#315343]">Unable to load patient timeline</h2><p className="mt-2 text-sm text-[#819087]">{message || "Please try again."}</p><button type="button" onClick={retry} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#237c4b] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#17633a]"><RefreshCw size={14} /> Retry</button></div>; }
function formatDateTime(value) { if (!value) return "Date unavailable"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
function csvValue(value) { return `"${String(value || "").replaceAll('"', '""')}"`; }
