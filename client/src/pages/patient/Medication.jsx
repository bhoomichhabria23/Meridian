import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Check,
  ChevronRight,
  Clock3,
  Pill,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import Navbar from "../../components/Navbar";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const tabs = [
  ["all", "All"],
  ["active", "Active"],
  ["completed", "Completed"],
  ["upcoming", "Upcoming"],
];
const auth = () => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const formatDate = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not recorded";
};
function Stat({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-[0_8px_28px_rgba(31,105,59,0.05)]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f6eb] text-[#25854d]">
          <Icon size={19} />
        </span>
        <div>
          <p className="text-xs text-[#84948b]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[#173a28]">{value}</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-[#829188]">{note}</p>
    </div>
  );
}
function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[#9aaa9f]">
        {label}
      </p>
      <p className="mt-1 text-xs font-bold text-[#3b5b49]">
        {value || "Not recorded"}
      </p>
    </div>
  );
}
function Card({ item, onTake, onSelect }) {
  const active = String(item.status || "active").toLowerCase() === "active";
  return (
    <article className="rounded-2xl border border-[#deece1] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#9fcfb0] hover:shadow-[0_12px_32px_rgba(31,105,59,0.09)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf7ed] text-[#25854d]">
            <Pill size={23} />
          </span>
          <div>
            <h3 className="font-bold text-[#1b3c2a]">
              {item.name || "Medication"}
            </h3>
            <p className="mt-1 text-xs text-[#7d8e84]">
              {item.type || "Prescription medication"}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${active ? "bg-[#eaf7ed] text-[#25854d]" : "bg-[#f0f3f1] text-[#738178]"}`}
        >
          {item.status || "Active"}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 border-y border-[#edf3ee] py-4 sm:grid-cols-4">
        <Field label="Dosage" value={item.dosage || "As directed"} />
        <Field label="Frequency" value={item.frequency || "As needed"} />
        <Field label="Route" value={item.route || item.timing || "Oral"} />
        <Field label="Next dose" value={item.nextDose || "Not scheduled"} />
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#72847a]">
        <span>Started {formatDate(item.startDate)}</span>
        <span>Ends {formatDate(item.endDate)}</span>
        <span>
          Prescribed by {item.prescribedBy || item.doctor || "Care team"}
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onSelect(item)}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#25854d]"
        >
          View details <ChevronRight size={14} />
        </button>
        {active && (
          <button
            type="button"
            onClick={() => onTake(item._id)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#25854d] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#176b3d]"
          >
            <Check size={14} /> Mark taken
          </button>
        )}
      </div>
    </article>
  );
}
function State({ icon: Icon = AlertTriangle, title, text, action }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center text-center">
      <Icon size={27} className="text-[#6ca67b]" />
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mt-1 text-sm text-[#83938a]">{text}</p>
      {action && (
        <button
          type="button"
          onClick={action}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25854d] px-4 py-2 text-xs font-bold text-white"
        >
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}
export default function Medications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    dosage: "",
    frequency: "",
    startDate: "",
    endDate: "",
  });
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/medications`, {
        headers: auth(),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || `Medication service returned ${response.status}`);
      }
      const result = await response.json();
      setItems(Array.isArray(result) ? result : result.medications || []);
    } catch {
      setError("Unable to load medications. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const filtered = useMemo(
    () =>
      items
        .filter(
          (item) =>
            tab === "all" ||
            String(item.status || "active").toLowerCase() === tab,
        )
        .filter((item) =>
          [item.name, item.description, item.type, item.dosage].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(search.toLowerCase().trim()),
          ),
        ),
    [items, search, tab],
  );
  const take = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/medications/${id}/take`, { method: "POST", headers: auth() });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Unable to mark medication as taken.");
      }
      setError("");
      await load();
    } catch (requestError) {
      setError(requestError.message || "Unable to mark medication as taken.");
    }
  };
  const addMedication = async (event) => {
    event.preventDefault();
    if (!addForm.name.trim() || !addForm.dosage.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/medications`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setError(result.message || "Unable to save medication.");
        return;
      }
      setError("");
      setAddForm({ name: "", dosage: "", frequency: "", startDate: "", endDate: "" });
      setAddOpen(false);
      await load();
    } catch {
      setError("Unable to reach the medication service. Check that the API is running.");
    } finally {
      setSaving(false);
    }
  };
  const active = items.filter(
    (item) => String(item.status || "active").toLowerCase() === "active",
  ).length;
  return (
    <div className="min-h-screen bg-[#f7fbf8] text-[#173a28]">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-12 pt-7 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-[#d8eee0] bg-[#eaf7ed] px-6 py-8 shadow-[0_12px_40px_rgba(31,105,59,0.07)] sm:px-10 lg:py-10">
          <img
            src="/images/medical-login.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#eaf7ed] via-[#eaf7ed]/95 to-transparent" />
          <div className="relative max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#25854d]">
              <ShieldCheck size={15} /> Medication management
            </div>
            <h1 className="mt-3 text-3xl font-bold text-[#173a28] sm:text-4xl">
              My medications
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#62786b]">
              A connected view of your current treatment plan and medication
              history.
            </p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25854d] px-4 py-3 text-sm font-bold text-white hover:bg-[#176b3d]"
            >
              <Plus size={17} /> Add medication
            </button>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            icon={Pill}
            label="Active medications"
            value={active}
            note="Currently in your plan"
          />
          <Stat
            icon={Check}
            label="Doses taken"
            value={items.reduce(
              (sum, item) => sum + Number(item.dosesTakenThisMonth || 0),
              0,
            )}
            note="Recorded this month"
          />
          <Stat
            icon={Clock3}
            label="Upcoming doses"
            value={items.filter((item) => item.reminder).length}
            note="Scheduled reminders"
          />
          <Stat
            icon={Activity}
            label="Medication records"
            value={items.length}
            note="Across your history"
          />
        </section>
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-[0_8px_28px_rgba(31,105,59,0.05)] sm:p-6">
            <div className="flex flex-col gap-4 border-b border-[#edf3ee] pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#25854d]">
                  Treatment plan
                </p>
                <h2 className="mt-1 text-xl font-bold">Your medications</h2>
              </div>
              <label className="flex h-10 items-center gap-2 rounded-xl border border-[#dbe9df] px-3 text-sm text-[#829188]">
                <Search size={16} className="text-[#25854d]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search medication"
                  className="w-48 bg-transparent outline-none"
                />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {tabs.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  className={`rounded-full px-3.5 py-2 text-xs font-bold ${tab === value ? "bg-[#25854d] text-white" : "bg-[#f0f8f2] text-[#648071]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-5 space-y-4">
              {loading ? (
                [1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-48 animate-pulse rounded-2xl bg-[#eef7f0]"
                  />
                ))
              ) : error ? (
                <State
                  title="Unable to load medications"
                  text={error}
                  action={load}
                />
              ) : filtered.length ? (
                filtered.map((item) => (
                  <Card
                    key={item._id}
                    item={item}
                    onTake={take}
                    onSelect={setSelected}
                  />
                ))
              ) : (
                <State
                  icon={Pill}
                  title="No medications found"
                  text="Try another search or selected status."
                />
              )}
            </div>
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-[#cfe8d6] bg-[#eff9f1] p-5">
              <div className="flex items-center gap-2 text-[#25854d]">
                <Bell size={18} />
                <h2 className="font-bold">Medication rhythm</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#648071]">
                Record each dose to help your care team see the full picture.
              </p>
            </div>
            <div className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-sm">
              <h2 className="font-bold">Today&apos;s focus</h2>
              <p className="mt-2 text-sm leading-6 text-[#788a80]">
                {items.length
                  ? "Review your next scheduled dose and stay consistent."
                  : "Your schedule will appear when medications are prescribed."}
              </p>
            </div>
          </aside>
        </section>
      </main>
      {addOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b2b1c]/45 p-4 backdrop-blur-md">
          <form onSubmit={addMedication} className="w-full max-w-xl overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_30px_100px_rgba(8,50,30,0.28)]">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#123f2a] via-[#17633d] to-[#25935b] px-7 py-7 text-white sm:px-8">
              <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full border border-white/15" />
              <div className="absolute -bottom-24 right-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"><Pill size={23} /></span>
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">Treatment plan</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Add medication</h2><p className="mt-1 max-w-sm text-sm leading-5 text-emerald-50/75">Keep your personal treatment record complete and up to date.</p></div>
                </div>
                <button type="button" onClick={() => setAddOpen(false)} className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white">Close</button>
              </div>
            </div>
            <div className="space-y-6 px-7 py-7 sm:px-8">
              <section>
                <div className="mb-3 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#527261]">Medication details</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-[#315343]">Medication name <em className="not-italic text-emerald-600">*</em></span><input required className="input w-full rounded-xl border-[#d7e9dc] bg-[#fbfefc] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="e.g. Amoxicillin" value={addForm.name} onChange={(event) => setAddForm({ ...addForm, name: event.target.value })} /></label>
                  <label><span className="mb-1.5 block text-xs font-bold text-[#315343]">Dosage <em className="not-italic text-emerald-600">*</em></span><input required className="input w-full rounded-xl border-[#d7e9dc] bg-[#fbfefc] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="e.g. 500 mg" value={addForm.dosage} onChange={(event) => setAddForm({ ...addForm, dosage: event.target.value })} /></label>
                  <label><span className="mb-1.5 block text-xs font-bold text-[#315343]">Frequency</span><input className="input w-full rounded-xl border-[#d7e9dc] bg-[#fbfefc] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="e.g. Twice daily" value={addForm.frequency} onChange={(event) => setAddForm({ ...addForm, frequency: event.target.value })} /></label>
                </div>
              </section>
              <section className="rounded-2xl border border-[#e1efe4] bg-[#f6fbf7] p-4">
                <div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#527261]">Treatment period</p><p className="mt-1 text-xs text-[#84978b]">Optional schedule dates</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#6b8775]">Optional</span></div>
                <div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-bold text-[#315343]">Start date</span><input type="date" className="input w-full rounded-xl border-[#d7e9dc] bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" value={addForm.startDate} onChange={(event) => setAddForm({ ...addForm, startDate: event.target.value })} /></label><label><span className="mb-1.5 block text-xs font-bold text-[#315343]">End date</span><input type="date" className="input w-full rounded-xl border-[#d7e9dc] bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" value={addForm.endDate} onChange={(event) => setAddForm({ ...addForm, endDate: event.target.value })} /></label></div>
              </section>
              {error && <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
              <div className="flex flex-col-reverse gap-3 border-t border-[#edf3ee] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => setAddOpen(false)} className="rounded-xl border border-[#d7e9dc] px-5 py-3 text-sm font-bold text-[#527261] transition hover:bg-[#f4faf5]">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#197447] to-[#25935b] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(25,116,71,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(25,116,71,0.28)] disabled:cursor-wait disabled:opacity-60">{saving ? "Saving medication..." : "Save medication"}</button></div>
            </div>
          </form>
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#123a28]/20 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#25854d]">
                  Medication details
                </p>
                <h2 className="mt-2 text-2xl font-bold">{selected.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="font-bold text-[#25854d]"
              >
                Close
              </button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Field label="Dosage" value={selected.dosage} />
              <Field label="Frequency" value={selected.frequency} />
              <Field label="Route" value={selected.route || "Oral"} />
              <Field label="Status" value={selected.status || "Active"} />
              <Field
                label="Start date"
                value={formatDate(selected.startDate)}
              />
              <Field label="End date" value={formatDate(selected.endDate)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
