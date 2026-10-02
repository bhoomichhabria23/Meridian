import { useEffect, useState } from "react";
import { Bell, CalendarDays, ChevronDown, ClipboardList, FileUp, Grid2X2, LogOut, Menu, Stethoscope, UserRound, UsersRound, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../api/config";

const navItems = [
  ["Dashboard", "/reception/dashboard", Grid2X2],
  ["Appointments", "/reception/appointments", CalendarDays],
  ["Patients", "/reception/patients", UsersRound],
  ["Doctors", "/reception/doctors", Stethoscope],
  ["Schedule", "/reception/schedule", ClipboardList],
  ["Upload Reports", "/reception/upload", FileUp],
];

export default function ReceptionNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const name = user?.name || user?.displayName || "Receptionist";

  useEffect(() => {
    fetch(`${API_BASE_URL || "http://localhost:5000"}/api/notifications`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : [])
      .then((items) => setUnread(items.filter((item) => !item.read).length))
      .catch(() => setUnread(0));
  }, []);

  const signOut = async () => {
    setProfileOpen(false);
    setMobileOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  return <header className="sticky top-0 z-50 border-b border-[#d5ebdc] bg-white/95 shadow-[0_4px_20px_rgba(31,105,59,0.08)] backdrop-blur-md">
    <div className="mx-auto flex min-h-[72px] max-w-[1600px] items-center gap-5 px-4 sm:px-6 lg:px-8">
      <button type="button" onClick={() => navigate("/reception/dashboard")} className="flex shrink-0 items-center gap-3 text-left">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#159447] text-2xl font-bold text-white shadow-[0_8px_20px_rgba(21,148,71,0.2)]">+</span>
        <span className="hidden sm:block"><strong className="block text-[19px] tracking-[0.14em] text-[#183a28]">MERIDIAN</strong><small className="block text-[9px] uppercase tracking-wide text-[#81978a]">Clinic operations</small></span>
      </button>
      <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
        {navItems.map(([label, path, Icon]) => <NavLink key={path} to={path} className={({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition ${isActive ? "bg-[#eaf7ed] text-[#159447]" : "text-[#667b6e] hover:bg-[#f3faf4] hover:text-[#159447]"}`}><Icon size={16} />{label}</NavLink>)}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button type="button" onClick={() => navigate("/reception/appointments")} title="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#527261] transition hover:bg-[#eaf7ed] hover:text-[#159447]"><Bell size={18} />{unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#159447] px-1 text-[9px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}</button>
        <div className="relative hidden sm:block"><button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-2 rounded-xl border border-[#dcece1] bg-[#f8fcf9] px-3 py-2 text-left hover:border-[#a9d2b2]"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dff3e5] text-sm font-bold text-[#25854d]">{name.slice(0, 1).toUpperCase()}</span><span className="hidden xl:block"><strong className="block max-w-28 truncate text-xs text-[#315343]">{name}</strong><small className="block text-[10px] capitalize text-[#819087]">{user?.role || "receptionist"}</small></span><ChevronDown size={14} className="text-[#819087]" /></button>{profileOpen && <div className="absolute right-0 top-12 w-48 rounded-xl border border-[#dcece1] bg-white p-2 shadow-xl"><button type="button" onClick={() => { setProfileOpen(false); navigate("/reception/profile"); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#315343] hover:bg-[#f1f8f3]"><UserRound size={15} /> My Profile</button><button type="button" onClick={() => { setProfileOpen(false); navigate("/reception/profile"); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#315343] hover:bg-[#f1f8f3]"><ClipboardList size={15} /> Account Settings</button><button type="button" onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#b24d45] hover:bg-[#fff0ee]"><LogOut size={15} /> Logout</button></div>}</div>
        <button type="button" onClick={() => setMobileOpen((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dcece1] text-[#25854d] lg:hidden">{mobileOpen ? <X size={19} /> : <Menu size={19} />}</button>
      </div>
    </div>
    {mobileOpen && <nav className="border-t border-[#edf3ee] bg-white px-4 py-3 lg:hidden">{navItems.map(([label, path, Icon]) => <NavLink key={path} to={path} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${isActive ? "bg-[#eaf7ed] text-[#159447]" : "text-[#667b6e]"}`}><Icon size={17} />{label}</NavLink>)}<button type="button" onClick={signOut} className="mt-2 flex w-full items-center gap-3 rounded-xl border-t border-[#edf3ee] px-3 py-3 text-left text-sm font-bold text-[#b24d45]"><LogOut size={17} /> Logout</button></nav>}
  </header>;
}
