import { useEffect, useState } from "react";
import { Bell, Check, RefreshCw } from "lucide-react";
import Navbar from "../../components/Navbar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function auth() {
  const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Just now" : date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/notifications`, { headers: auth() });
      if (!response.ok) throw new Error("Unable to load notifications.");
      setItems(await response.json());
    } catch (requestError) {
      setError(requestError.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (item) => {
    if (item.read) return;
    const response = await fetch(`${API_URL}/api/notifications/${item._id}/read`, { method: "PUT", headers: auth() });
    if (response.ok) setItems((current) => current.map((notification) => notification._id === item._id ? { ...notification, read: true } : notification));
  };

  return (
    <div className="min-h-screen bg-[#f7fbf8] text-[#173a28]">
      <Navbar />
      <main className="mx-auto max-w-4xl space-y-6 px-4 pb-12 pt-7 sm:px-6">
        <section className="flex items-center justify-between rounded-2xl border border-[#e2eee5] bg-white px-5 py-5 shadow-sm">
          <div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf7ed] text-[#25854d]"><Bell size={24} /></span><div><h1 className="text-2xl font-bold">Notifications</h1><p className="mt-1 text-sm text-[#78877f]">Medication reminders and updates from your care record.</p></div></div>
          <button type="button" onClick={load} title="Refresh notifications" className="rounded-xl p-2 text-[#25854d] hover:bg-[#edf8f0]"><RefreshCw size={18} /></button>
        </section>
        <section className="overflow-hidden rounded-2xl border border-[#deece1] bg-white shadow-sm">
          {loading ? <p className="p-8 text-center text-sm text-[#829188]">Loading notifications...</p> : error ? <div className="p-8 text-center"><p className="text-sm text-red-600">{error}</p><button type="button" onClick={load} className="mt-4 rounded-xl bg-[#25854d] px-4 py-2 text-xs font-bold text-white">Retry</button></div> : items.length ? items.map((item) => <button key={item._id} type="button" onClick={() => markRead(item)} className={`flex w-full items-start gap-4 border-b border-[#edf3ee] p-5 text-left last:border-0 hover:bg-[#fbfefc] ${item.read ? "" : "bg-[#f5fbf6]"}`}><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf7ed] text-[#25854d]"><Bell size={16} /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-[#284634]">{item.title || "Notification"}</strong><span className="mt-1 block text-sm text-[#71857a]">{item.body || "You have a new update."}</span><span className="mt-2 block text-xs text-[#9aaa9f]">{formatDate(item.createdAt)}</span></span>{item.read && <Check size={16} className="text-[#7fa58a]" />}</button>) : <p className="p-10 text-center text-sm text-[#829188]">No notifications yet.</p>}
        </section>
      </main>
    </div>
  );
}
