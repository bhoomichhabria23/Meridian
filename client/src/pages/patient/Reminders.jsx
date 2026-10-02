import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import {
  createReminder,
  deleteReminder,
  fetchReminders,
  updateReminder,
} from "../../services/reminderService";
const TYPES = [
  ["medication", "Medication"],
  ["appointment", "Appointment"],
  ["lab_test", "Lab test"],
  ["follow_up", "Follow-up"],
  ["health_checkup", "Health checkup"],
];
const initial = {
  title: "",
  type: "medication",
  date: "",
  time: "",
  description: "",
  priority: "medium",
};
const dateTime = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime())
    ? date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Time pending";
};
function ReminderCard({ item, onEdit, onDelete, onUpdate }) {
  const urgent = item.priority === "high";
  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-[0_8px_28px_rgba(31,105,59,0.04)] ${urgent ? "border-[#cddcae]" : "border-[#deece1]"}`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${urgent ? "bg-[#f1f6df] text-[#7b8c3e]" : "bg-[#eaf7ed] text-[#25854d]"}`}
        >
          <Bell size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-[#1b3c2a]">{item.title}</h3>
          </div>
          <p className="mt-1 text-xs capitalize text-[#7d8e84]">
            {item.type?.replace("_", " ")} Â· {dateTime(item.date)}
          </p>
          <p className="mt-3 text-sm leading-6 text-[#71857a]">
            {item.description || "No description provided."}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-[#edf3ee] pt-4">
        <button
          type="button"
          onClick={() => onUpdate(item, { status: "completed" })}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#25854d] px-3 py-2 text-xs font-bold text-white"
        >
          <Check size={14} /> Complete
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              onUpdate(item, {
                status: "snoozed",
                snoozedUntil: new Date(Date.now() + 86400000).toISOString(),
              })
            }
            className="rounded-xl border border-[#cfe5d5] px-3 py-2 text-xs font-bold text-[#648071]"
          >
            Snooze
          </button>
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#cfe5d5] text-[#25854d]"
            title="Edit"
          >
            <Edit3 size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item._id)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#dfe9e1] text-[#819087]"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
export default function Reminders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initial);
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setItems(await fetchReminders());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const visible = useMemo(
    () =>
      items
        .filter((item) => item.status !== "completed")
        .filter((item) => filter === "all" || item.type === filter)
        .filter(
          (item) =>
            !search.trim() ||
            [item.title, item.description, item.type].some((value) =>
              String(value || "")
                .toLowerCase()
                .includes(search.toLowerCase().trim()),
            ),
        ),
    [filter, items, search],
  );
  const save = async (event) => {
    event.preventDefault();
    if (!form.title || !form.date || !form.time)
      return setError("Title, date, and time are required.");
    const payload = { ...form, date: `${form.date}T${form.time}` };
    try {
      if (editing) await updateReminder(editing._id, payload);
      else await createReminder(payload);
      setModal(false);
      setEditing(null);
      setForm(initial);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const update = async (item, changes) => {
    await updateReminder(item._id, changes);
    await load();
  };
  const edit = (item) => {
    setEditing(item);
    setForm({
      title: item.title,
      type: item.type,
      date: item.date?.slice(0, 10),
      time: item.date?.slice(11, 16),
      description: item.description || "",
      priority: item.priority,
    });
    setModal(true);
  };
  return (
    <div className="min-h-screen bg-[#f7fbf8] text-[#173a28]">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-12 pt-7 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-[#d8eee0] bg-[#eaf7ed] p-6 shadow-[0_12px_40px_rgba(31,105,59,0.07)] sm:p-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#25854d]">
                <ShieldCheck size={15} /> Personal care rhythm
              </div>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                Health Reminders
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#62786b]">
                Keep medications, appointments, follow-ups, and preventive care
                in view.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(initial);
                setModal(true);
              }}
              className="inline-flex items-center gap-2 self-start rounded-xl bg-[#25854d] px-4 py-3 text-sm font-bold text-white"
            >
              <Plus size={17} /> Add Reminder
            </button>
          </div>
        </section>
        <section className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#25854d]">
                Your queue
              </p>
              <h2 className="mt-1 text-xl font-bold">
                Active health reminders{" "}
                <span className="text-sm font-normal text-[#87958d]">
                  ({visible.length})
                </span>
              </h2>
            </div>
            <label className="flex h-10 items-center gap-2 rounded-xl border border-[#dbe9df] px-3 text-sm text-[#829188]">
              <Search size={16} className="text-[#25854d]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reminders"
                className="w-48 bg-transparent outline-none"
              />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full px-3.5 py-2 text-xs font-bold ${filter === "all" ? "bg-[#25854d] text-white" : "bg-[#f0f8f2] text-[#648071]"}`}
            >
              All
            </button>
            {TYPES.map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-full px-3.5 py-2 text-xs font-bold ${filter === value ? "bg-[#25854d] text-white" : "bg-[#f0f8f2] text-[#648071]"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {error && (
            <p className="mt-4 rounded-xl bg-[#f5fbf6] p-3 text-sm text-[#66806f]">
              {error}
            </p>
          )}
          {loading ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-44 animate-pulse rounded-2xl bg-[#eef7f0]"
                />
              ))}
            </div>
          ) : visible.length ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {visible.map((item) => (
                <ReminderCard
                  key={item._id}
                  item={item}
                  onEdit={edit}
                  onDelete={async (id) => {
                    await deleteReminder(id);
                    await load();
                  }}
                  onUpdate={update}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center text-center">
              <Check className="text-[#6ca67b]" size={29} />
              <h3 className="mt-3 font-bold">You&apos;re all caught up</h3>
              <p className="mt-1 text-sm text-[#83938a]">
                Add a reminder whenever you want MERIDIAN to keep something in
                view.
              </p>
            </div>
          )}
        </section>
      </main>
      {modal && (
        <ReminderModal
          form={form}
          setForm={setForm}
          editing={editing}
          onClose={() => setModal(false)}
          onSubmit={save}
        />
      )}
    </div>
  );
}
function ReminderModal({ form, setForm, editing, onClose, onSubmit }) {
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b2b1c]/45 p-4 backdrop-blur-md">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xl overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_30px_100px_rgba(8,50,30,0.28)]"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-[#123f2a] via-[#17633d] to-[#25935b] px-7 py-7 text-white sm:px-8">
          <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full border border-white/15" />
          <div className="relative flex items-start justify-between gap-5">
            <div className="flex items-start gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"><Bell size={22} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">Reminder settings</p><h2 className="mt-2 text-2xl font-bold">
              {editing ? "Edit reminder" : "Add reminder"}
            </h2><p className="mt-1 text-sm text-emerald-50/75">Keep an important part of your care plan in view.</p></div></div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
            >Close</button>
          </div>
        </div>
        <div className="space-y-6 px-7 py-7 sm:px-8">
          <label><span className="mb-1.5 block text-xs font-bold text-[#315343]">Reminder title <em className="not-italic text-emerald-600">*</em></span>
          <input
            required
            value={form.title}
            onChange={(event) => set("title", event.target.value)}
            placeholder="Reminder title"
            className="h-11 w-full rounded-xl border border-[#d7e9dc] bg-[#fbfefc] px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          /></label>
              <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="mb-1.5 block text-xs font-bold text-[#315343]">Reminder type</span><select
              value={form.type}
              onChange={(event) => set("type", event.target.value)}
              className="h-11 w-full rounded-xl border border-[#d7e9dc] bg-[#fbfefc] px-3 text-sm"
            >
              {TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select></label><label><span className="mb-1.5 block text-xs font-bold text-[#315343]">Priority</span><select
              value={form.priority}
              onChange={(event) => set("priority", event.target.value)}
              className="h-11 w-full rounded-xl border border-[#d7e9dc] bg-[#fbfefc] px-3 text-sm"
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-bold text-[#315343]">Date <em className="not-italic text-emerald-600">*</em></span><input
            required
            type="date"
            value={form.date}
            onChange={(event) => set("date", event.target.value)}
            className="h-11 w-full rounded-xl border border-[#d7e9dc] bg-[#fbfefc] px-3 text-sm"
          /></label><label><span className="mb-1.5 block text-xs font-bold text-[#315343]">Time <em className="not-italic text-emerald-600">*</em></span><input required type="time" value={form.time} onChange={(event) => set("time", event.target.value)} className="h-11 w-full rounded-xl border border-[#d7e9dc] bg-[#fbfefc] px-3 text-sm" /></label></div>
          <label><span className="mb-1.5 block text-xs font-bold text-[#315343]">Notes</span><textarea
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
            placeholder="Description"
            className="min-h-24 w-full rounded-xl border border-[#d7e9dc] bg-[#fbfefc] p-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          /></label>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#edf3ee] px-7 py-5 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#d7e9dc] px-5 py-3 text-sm font-bold text-[#527261] hover:bg-[#f4faf5]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-[#197447] to-[#25935b] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(25,116,71,0.2)] hover:-translate-y-0.5"
          >
            Save reminder
          </button>
        </div>
      </form>
    </div>
  );
}
