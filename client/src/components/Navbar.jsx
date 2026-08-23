import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity, Bell, Bot, CalendarDays, ClipboardList, FileText, Grid2X2, LogOut, Pill, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  ["Dashboard", "/patient/dashboard", Grid2X2],
  ["Timeline", "/patient/timeline", Activity],
  ["Medication", "/patient/medications", Pill],
  ["Prescription", "/patient/prescriptions", ClipboardList],
  ["Reports", "/patient/reports", FileText],
  ["Appointments", "/patient/appointments", CalendarDays],
  ["Reminders", "/patient/reminders", Bell],
  ["AI Assistant", "/patient/assistant", Bot],
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };
  return <header className="sticky top-0 z-50 border-b border-[#dcece1] bg-white/95 shadow-[0_4px_20px_rgba(26,91,52,0.06)] backdrop-blur-md">
    <div className="mx-auto flex h-[68px] max-w-[1500px] items-center gap-4 px-4 sm:px-6">
      <button type="button" onClick={() => navigate("/patient/dashboard")} className="flex shrink-0 items-center gap-2.5 text-left">
        <span className="relative block h-8 w-8"><span className="absolute left-[11px] top-0 h-8 w-2.5 rounded-full bg-[#16884a]" /><span className="absolute left-0 top-[11px] h-2.5 w-8 rounded-full bg-[#16884a]" /><span className="absolute left-[5px] top-[5px] h-3 w-3 rounded-full bg-white" /></span>
        <span className="hidden sm:block"><strong className="block text-[18px] tracking-[0.16em] text-[#14753e]">MERIDIAN</strong><small className="-mt-1 block text-[8px] tracking-wide text-[#93a49a]">Your Health. Our Intelligence.</small></span>
      </button>
      <nav className="flex min-w-0 flex-1 items-stretch justify-center gap-0.5 overflow-x-auto">
        {links.map(([label, path, Icon]) => { const active = location.pathname === path || location.pathname.startsWith(`${path}/`); return <button key={path} type="button" onClick={() => navigate(path)} title={label} className={`relative flex h-[68px] shrink-0 items-center gap-1.5 px-2.5 text-[11px] font-semibold transition sm:px-3 ${active ? "text-[#16884a]" : "text-[#64756b] hover:text-[#16884a]"}`}><Icon size={15} strokeWidth={active ? 2.2 : 1.8} /><span className="hidden md:inline">{label}</span>{active && <span className="absolute bottom-0 left-2 right-2 h-[3px] rounded-t-full bg-[#16884a]" />}</button>; })}
      </nav>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={() => navigate("/patient/profile")} title="Patient profile" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#cfe3d5] text-[#597066] transition hover:border-[#16884a] hover:bg-[#f0f9f2] hover:text-[#16884a]"><UserRound size={17} /></button>
        <button type="button" onClick={handleLogout} disabled={loggingOut} title="Sign out" className="group inline-flex h-9 items-center gap-2 rounded-xl border border-[#b9dfc4] bg-gradient-to-r from-[#effaf1] to-[#e1f5e6] px-3 text-xs font-bold text-[#237c4b] shadow-[0_4px_12px_rgba(35,124,75,0.08)] transition hover:-translate-y-0.5 hover:border-[#77bd8b] hover:from-[#e3f7e8] hover:to-[#d4f0dc] hover:shadow-[0_7px_18px_rgba(35,124,75,0.15)] disabled:cursor-wait disabled:opacity-60">
          <LogOut size={15} className="transition-transform group-hover:translate-x-0.5" />
          <span className="hidden sm:inline">{loggingOut ? "Signing out" : "Sign out"}</span>
        </button>
      </div>
    </div>
  </header>;
}
