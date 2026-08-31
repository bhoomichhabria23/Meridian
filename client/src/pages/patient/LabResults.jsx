import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CalendarDays, FlaskConical, Search, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../../components/Navbar";
import { auth, db } from "../../firebase";

const formatDate = (value) => {
  if (!value) return "Not dated";
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const normalizeLab = (item) => {
  const data = item.data();
  return {
    id: item.id,
    name: data.testName || data.type || data.name || "Lab result",
    value: data.value ?? data.result ?? data.numericValue ?? "—",
    unit: data.unit || "",
    status: String(data.status || "Recorded").toLowerCase(),
    date: data.date || data.createdAt || data.month,
    labName: data.labName || data.facility || "Meridian Health",
    notes: data.notes || data.description || "No additional notes",
  };
};

function StatusBadge({ status }) {
  const tone = status === "critical" ? "bg-[#fff0ef] text-[#c7524e]" : status === "abnormal" ? "bg-[#fff7e8] text-[#b47821]" : "bg-[#edf8f0] text-[#25854d]";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${tone}`}>{status}</span>;
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
    let unsubscribe;
    const load = async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setError("");
        const snapshot = await getDocs(query(collection(db, "labResults"), where("userId", "==", user.uid)));
        setResults(snapshot.docs.map(normalizeLab).sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch (requestError) {
        setError(requestError.message || "Unable to load lab results.");
      } finally {
        setLoading(false);
      }
    };
    unsubscribe = onAuthStateChanged(auth, load);
    return () => unsubscribe?.();
  }, []);

  const testTypes = useMemo(() => ["all", ...new Set(results.map((result) => result.name))], [results]);
  const filtered = useMemo(() => results.filter((result) => selectedTest === "all" || result.name === selectedTest).filter((result) => !search.trim() || [result.name, result.labName, result.status, result.notes].some((value) => String(value).toLowerCase().includes(search.toLowerCase().trim()))), [results, search, selectedTest]);
  const normalCount = results.filter((result) => result.status === "normal").length;
  const attentionCount = results.filter((result) => ["abnormal", "critical"].includes(result.status)).length;
  const latest = filtered[0];

  return <div className="min-h-screen bg-[#f5faf7] text-[#183a28]"><Navbar /><main className="mx-auto max-w-[1500px] space-y-6 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
    <section className="relative overflow-hidden rounded-[26px] border border-[#cfe7d6] bg-gradient-to-br from-white via-white to-[#e8f7ec] p-6 shadow-[0_14px_44px_rgba(31,105,59,0.08)] sm:p-8"><div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#25854d]">Clinical records</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#183a28]">Lab Results</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#6d8375]">Review your test history, monitor changes, and keep your care team informed.</p></div><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#25854d] shadow-sm"><FlaskConical size={28} /></div></div></section>

    <section className="grid gap-4 sm:grid-cols-3"><Metric icon={FlaskConical} label="Total results" value={results.length} caption="All recorded tests" /><Metric icon={ShieldCheck} label="Normal results" value={normalCount} caption="Within expected range" /><Metric icon={AlertTriangle} label="Needs attention" value={attentionCount} caption="Abnormal or critical" /></section>

    <section className="rounded-2xl border border-[#dcece1] bg-white p-5 shadow-[0_8px_28px_rgba(31,105,59,0.05)] sm:p-6"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><h2 className="text-lg font-bold text-[#244b35]">Your test history</h2><p className="mt-1 text-xs text-[#83938a]">Every result shown here belongs to your health record.</p></div><label className="relative block w-full lg:w-72"><Search size={16} className="absolute left-3 top-3 text-[#8ba293]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search results" className="h-10 w-full rounded-xl border border-[#dbe9df] bg-[#fbfefc] pl-9 pr-3 text-xs text-[#315343] outline-none focus:border-[#25854d]" /></label></div><div className="mt-5 flex gap-2 overflow-x-auto pb-1">{testTypes.map((test) => <button key={test} type="button" onClick={() => setSelectedTest(test)} className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-bold transition ${selectedTest === test ? "bg-[#25854d] text-white" : "border border-[#d5e9da] bg-[#f7fcf8] text-[#587966] hover:bg-[#edf8f0]"}`}>{test === "all" ? "All tests" : test}</button>)}</div>
      {loading ? <div className="flex min-h-64 items-center justify-center text-sm text-[#83938a]">Loading lab results...</div> : error ? <div className="flex min-h-64 flex-col items-center justify-center text-center"><AlertTriangle className="text-[#c7524e]" size={28} /><p className="mt-3 text-sm font-bold">Unable to load lab results</p><p className="mt-1 text-xs text-[#83938a]">{error}</p></div> : filtered.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center text-center"><FlaskConical className="text-[#8fc39d]" size={32} /><p className="mt-3 font-bold text-[#315343]">No lab results found</p><p className="mt-1 text-sm text-[#83938a]">Results will appear here after they are added to your record.</p></div> : <div className="mt-4 overflow-x-auto"><div className="min-w-[650px]"><div className="grid grid-cols-[1.6fr_0.8fr_1fr_0.8fr] gap-4 border-b border-[#edf3ee] px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8aa091]"><span>Test</span><span>Result</span><span>Facility / date</span><span>Status</span></div>{filtered.map((result) => <article key={result.id} className="grid grid-cols-[1.6fr_0.8fr_1fr_0.8fr] items-center gap-4 border-b border-[#edf3ee] px-3 py-4 last:border-0"><div><p className="text-sm font-bold text-[#315343]">{result.name}</p><p className="mt-1 text-[11px] text-[#8a9b90]">{result.notes}</p></div><p className="text-sm font-bold text-[#183a28]">{result.value} <span className="text-[10px] font-normal text-[#83938a]">{result.unit}</span></p><div className="text-xs text-[#587966]"><p>{result.labName}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-[#8a9b90]"><CalendarDays size={12} />{formatDate(result.date)}</p></div><StatusBadge status={result.status} /></article>)}</div></div>}
    </section>

    {latest && <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]"><div className="rounded-2xl border border-[#cfe7d6] bg-[#eff9f1] p-5"><div className="flex items-center gap-2 text-[#25854d]"><Activity size={18} /><h2 className="font-bold">Latest result</h2></div><div className="mt-4 flex items-end justify-between gap-4"><div><p className="text-sm text-[#587966]">{latest.name}</p><strong className="mt-1 block text-3xl text-[#183a28]">{latest.value} <span className="text-sm font-normal text-[#587966]">{latest.unit}</span></strong></div><StatusBadge status={latest.status} /></div></div><div className="rounded-2xl border border-[#dcece1] bg-white p-5"><div className="flex items-center gap-2 text-[#25854d]"><TrendingUp size={18} /><h2 className="font-bold">Stay informed</h2></div><p className="mt-3 text-sm leading-6 text-[#66806f]">Bring your latest results to your next appointment so your care team can review changes with you.</p></div></section>}
  </main></div>;
}
