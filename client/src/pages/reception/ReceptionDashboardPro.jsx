import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, CheckCircle2, ChevronRight, Clock3, FileUp, Search, Stethoscope, UsersRound, X } from "lucide-react";
import Layout from "../../components/common/Layout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const LINKS = [
  { to: "/reception/dashboard", label: "Dashboard", icon: "▦" },
  { to: "/reception/appointments", label: "Appointments", icon: "▣" },
  { to: "/reception/patients", label: "Patients", icon: "◉" },
  { to: "/reception/doctors", label: "Doctors", icon: "✚" },
  { to: "/reception/schedule", label: "Schedule", icon: "◷" },
  { to: "/reception/upload", label: "Upload Reports", icon: "↥" },
  { to: "/reception/profile", label: "Profile", icon: "◌" },
];

const EMPTY = { totalPatients: 0, todaysAppointmentsCount: 0, pendingAppointmentsCount: 0, availableDoctorsCount: 0, todaysAppointments: [], pendingAppointments: [] };
const displayName = (value) => value?.userId?.name || value?.name || value?.fullName || "Registered patient";
const doctorName = (value) => value?.userId?.name || value?.name || "Registered doctor";
const appointmentDate = (value) => value?.date || value?.appointmentDate;
const statusTone = { confirmed: "bg-[#e8f7ed] text-[#237c4b]", pending: "bg-[#fff7df] text-[#9a6a00]", completed: "bg-[#edf1f4] text-[#5e6c75]", cancelled: "bg-[#fff0ee] text-[#b24d45]", rescheduled: "bg-[#eaf2ff] text-[#3568a8]" };

function Card({ children, className = "" }) { return <section className={`rounded-2xl border border-[#dcece1] bg-white shadow-[0_8px_28px_rgba(31,105,59,0.05)] ${className}`}>{children}</section>; }
function EmptyState({ title, text }) { return <div className="rounded-xl bg-[#f7fbf8] px-4 py-8 text-center"><p className="font-semibold text-[#315343]">{title}</p><p className="mt-1 text-xs text-[#819087]">{text}</p></div>; }
function Stat({ icon: Icon, label, value, detail, tone }) { return <Card className="p-5"><div className="flex items-start justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon size={21} /></span><span className="text-xs font-semibold text-[#7b9083]">Today</span></div><p className="mt-5 text-xs font-semibold uppercase tracking-wide text-[#81978a]">{label}</p><p className="mt-1 text-3xl font-bold tracking-tight text-[#183a28]">{value}</p><p className="mt-1 text-xs text-[#6c8174]">{detail}</p></Card>; }
function Status({ value }) { const key = String(value || "pending").toLowerCase(); return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusTone[key] || statusTone.pending}`}>{key}</span>; }

export default function ReceptionDashboardPro() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(EMPTY);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/api/receptionist/dashboard"),
      api.get("/api/receptionist/patients?limit=100"),
      api.get("/api/doctors"),
    ]).then(([dashboardResponse, patientsResponse, doctorsResponse]) => {
      if (!active) return;
      setDashboard(dashboardResponse.data || EMPTY);
      setPatients(patientsResponse.data?.patients || []);
      setDoctors(Array.isArray(doctorsResponse.data) ? doctorsResponse.data : []);
    }).catch((requestError) => {
      if (active) setError(requestError.response?.data?.message || requestError.message || "Unable to load clinic data.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const appointments = useMemo(() => {
    const value = query.trim().toLowerCase();
    return (dashboard.todaysAppointments || []).filter((item) => !value || [displayName(item.patientId), doctorName(item.doctorId), item.chiefComplaint, item.timeSlot, item.status].some((field) => String(field || "").toLowerCase().includes(value)));
  }, [dashboard.todaysAppointments, query]);
  const chartData = useMemo(() => {
    const counts = ["confirmed", "pending", "completed", "cancelled"].map((status) => ({ status, count: (dashboard.todaysAppointments || []).filter((item) => String(item.status).toLowerCase() === status).length }));
    return counts.length ? counts : [];
  }, [dashboard.todaysAppointments]);
  const name = user?.name || user?.displayName || "Receptionist";

  if (loading) return <Layout links={LINKS}><main className="min-h-screen bg-[#f5faf7] p-6"><div className="mx-auto max-w-7xl animate-pulse space-y-5"><div className="h-28 rounded-2xl bg-[#e5f3e9]" /><div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-36 rounded-2xl bg-[#eaf5ed]" />)}</div><div className="h-96 rounded-2xl bg-[#eaf5ed]" /></div></main></Layout>;

  return <Layout links={LINKS}><main className="min-h-screen bg-[#f5faf7] p-4 text-[#183a28] md:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-col justify-between gap-5 rounded-2xl border border-[#d5ebdc] bg-gradient-to-br from-white via-white to-[#edf9f0] p-6 shadow-[0_12px_40px_rgba(31,105,59,0.07)] sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#25854d]">Clinic operations</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#183a28]">Good morning, {name}</h1><p className="mt-2 text-sm text-[#6c8174]">Here&apos;s what&apos;s happening at your clinic today.</p></div><div className="flex items-center gap-3"><div className="rounded-xl border border-[#dcece1] bg-white px-4 py-2 text-right"><p className="text-[10px] font-bold uppercase tracking-wide text-[#81978a]">Today</p><p className="text-sm font-bold text-[#315343]">{format(new Date(), "EEE, dd MMM yyyy")}</p></div><button type="button" onClick={() => navigateTo("/reception/appointments")} className="rounded-xl bg-[#25854d] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#176b3d]">Book appointment</button></div></header>
    {error && <div className="rounded-xl border border-[#f0c6c1] bg-[#fff4f2] px-4 py-3 text-sm text-[#a64d46]">{error}</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={CalendarDays} label="Today&apos;s appointments" value={dashboard.todaysAppointmentsCount} detail={`${dashboard.pendingAppointmentsCount} pending request${dashboard.pendingAppointmentsCount === 1 ? "" : "s"}`} tone="bg-[#eaf7ed] text-[#25854d]" /><Stat icon={UsersRound} label="Waiting patients" value={new Set((dashboard.todaysAppointments || []).filter((item) => item.status === "pending").map((item) => item.patientId?._id || item.patientId)).size} detail="Based on today&apos;s queue" tone="bg-[#eaf7ed] text-[#25854d]" /><Stat icon={Stethoscope} label="Registered doctors" value={dashboard.availableDoctorsCount || doctors.length} detail="Active in the directory" tone="bg-[#eaf7ed] text-[#25854d]" /><Stat icon={Clock3} label="Pending requests" value={dashboard.pendingAppointmentsCount} detail="Requires attention" tone="bg-[#fff6df] text-[#a47716]" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={CalendarDays} label="Today&apos;s appointments" value={dashboard.todaysAppointmentsCount} detail={`${dashboard.pendingAppointmentsCount} pending request${dashboard.pendingAppointmentsCount === 1 ? "" : "s"}`} tone="bg-[#eaf7ed] text-[#25854d]" /><Stat icon={UsersRound} label="Registered patients" value={dashboard.totalPatients} detail={`${patients.length} loaded for this view`} tone="bg-[#eaf7ed] text-[#25854d]" /><Stat icon={Stethoscope} label="Registered doctors" value={dashboard.availableDoctorsCount || doctors.length} detail="Active in the directory" tone="bg-[#eaf7ed] text-[#25854d]" /><Stat icon={Clock3} label="Pending requests" value={dashboard.pendingAppointmentsCount} detail="Requires attention" tone="bg-[#fff6df] text-[#a47716]" /></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.8fr)]"><Card className="overflow-hidden"><div className="flex flex-col justify-between gap-3 border-b border-[#edf3ee] p-5 sm:flex-row sm:items-center"><div><p className="text-xs font-bold uppercase tracking-wide text-[#25854d]">Live queue</p><h2 className="mt-1 text-xl font-bold">Today&apos;s appointments</h2></div><div className="flex gap-2"><label className="flex items-center gap-2 rounded-xl border border-[#dcece1] px-3 py-2 text-xs text-[#819087]"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search appointments" className="w-36 bg-transparent outline-none placeholder:text-[#9aaa9f]" /></label><button type="button" onClick={() => navigateTo("/reception/appointments")} className="inline-flex items-center gap-1 rounded-xl border border-[#b9dac2] px-3 py-2 text-xs font-bold text-[#25854d]">View all <ChevronRight size={14} /></button></div></div>{appointments.length ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-[#f8fcf9] text-[10px] uppercase tracking-wide text-[#819087]"><tr><th className="px-5 py-3">Time</th><th className="px-5 py-3">Patient</th><th className="px-5 py-3">Doctor</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-[#edf3ee]">{appointments.map((item) => <tr key={item._id} className="text-sm hover:bg-[#fbfefb]"><td className="px-5 py-4 font-semibold text-[#315343]">{item.timeSlot || format(new Date(appointmentDate(item)), "p")}</td><td className="px-5 py-4"><p className="font-bold">{displayName(item.patientId)}</p><p className="text-xs text-[#819087]">{item.chiefComplaint || "Consultation"}</p></td><td className="px-5 py-4 text-[#5e7568]">{doctorName(item.doctorId)}</td><td className="px-5 py-4"><Status value={item.status} /></td><td className="px-5 py-4"><button type="button" onClick={() => setSelected(item)} className="text-xs font-bold text-[#25854d] hover:underline">View</button></td></tr>)}</tbody></table></div> : <div className="p-6"><EmptyState title="No appointments scheduled" text="There are no registered appointments for today." /></div>}</Card>
    <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-[#25854d]">Registered directory</p><h2 className="mt-1 text-xl font-bold">Doctors</h2></div><button type="button" onClick={() => navigateTo("/reception/doctors")} className="text-xs font-bold text-[#25854d]">View all</button></div><div className="mt-5 space-y-3">{doctors.length ? doctors.slice(0, 5).map((doctor) => <div key={doctor._id} className="flex items-center gap-3 rounded-xl border border-[#edf3ee] p-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf7ed] font-bold text-[#25854d]">{doctorName(doctor).slice(0, 1).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{doctorName(doctor)}</p><p className="truncate text-xs text-[#819087]">{doctor.specialty || doctor.userId?.specialization || "Specialization not recorded"}</p></div><CheckCircle2 size={17} className="text-[#25854d]" /></div>) : <EmptyState title="No registered doctors" text="Doctors will appear here after registration." />}</div></Card></div>
    <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-[#25854d]">Clinic activity</p><h2 className="mt-1 text-xl font-bold">Appointment overview</h2></div><CalendarDays size={19} className="text-[#6ca67b]" /></div>{chartData.some((item) => item.count) ? <div className="mt-5 h-56"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="receptionGreen" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#25854d" stopOpacity=".25" /><stop offset="100%" stopColor="#25854d" stopOpacity=".02" /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf3ee" /><XAxis dataKey="status" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} /><Tooltip /><Area type="monotone" dataKey="count" stroke="#25854d" fill="url(#receptionGreen)" strokeWidth={2.5} /></AreaChart></ResponsiveContainer></div> : <div className="mt-5"><EmptyState title="No appointment activity yet" text="The chart will reflect registered appointments as they are added." /></div>}</Card><Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-[#25854d]">Quick actions</p><h2 className="mt-1 text-xl font-bold">Common workflows</h2></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1"><QuickAction icon={CalendarDays} label="Manage appointments" onClick={() => navigateTo("/reception/appointments")} /><QuickAction icon={UsersRound} label="Find registered patient" onClick={() => navigateTo("/reception/patients")} /><QuickAction icon={FileUp} label="Upload patient report" onClick={() => navigateTo("/reception/upload-report")} /><QuickAction icon={Stethoscope} label="Check doctor schedules" onClick={() => navigateTo("/reception/schedule")} /></div></Card></div>
    {selected && <AppointmentModal appointment={selected} onClose={() => setSelected(null)} onOpen={() => navigateTo("/reception/appointments")} />}
  </div></main></Layout>;
}

function navigateTo(path) { window.history.pushState({}, "", path); window.dispatchEvent(new PopStateEvent("popstate")); }
function QuickAction({ icon: Icon, label, onClick }) { return <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-xl border border-[#dcece1] bg-[#f8fcf9] p-4 text-left text-sm font-bold text-[#315343] transition hover:-translate-y-0.5 hover:border-[#9fcfb0] hover:bg-[#f0f9f2]"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eaf7ed] text-[#25854d]"><Icon size={17} /></span>{label}<ChevronRight size={16} className="ml-auto text-[#86a691]" /></button>; }
function AppointmentModal({ appointment, onClose, onOpen }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173a28]/35 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-[#edf3ee] p-6"><div><p className="text-xs font-bold uppercase tracking-wide text-[#25854d]">Appointment details</p><h2 className="mt-1 text-xl font-bold">{displayName(appointment.patientId)}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-[#819087] hover:bg-[#f1f8f3]"><X size={18} /></button></div><div className="grid gap-4 p-6 sm:grid-cols-2"><Detail label="Doctor" value={doctorName(appointment.doctorId)} /><Detail label="Date" value={appointmentDate(appointment) ? format(new Date(appointmentDate(appointment)), "dd MMM yyyy") : "Not recorded"} /><Detail label="Time" value={appointment.timeSlot || "Not recorded"} /><Detail label="Type" value={appointment.chiefComplaint || "Consultation"} /><div><p className="text-xs font-bold text-[#819087]">Status</p><div className="mt-1"><Status value={appointment.status} /></div></div></div><div className="flex justify-end gap-3 border-t border-[#edf3ee] p-5"><button type="button" onClick={onClose} className="rounded-xl border border-[#dcece1] px-4 py-2.5 text-xs font-bold text-[#527261]">Close</button><button type="button" onClick={onOpen} className="rounded-xl bg-[#25854d] px-4 py-2.5 text-xs font-bold text-white">Open appointments</button></div></div></div>; }
function Detail({ label, value }) { return <div><p className="text-xs font-bold text-[#819087]">{label}</p><p className="mt-1 text-sm font-bold text-[#315343]">{value || "Not recorded"}</p></div>; }
