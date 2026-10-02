import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import {
  cancelAppointment,
  createAppointment,
  fetchAppointments,
  fetchDoctors,
} from "../../services/appointmentService";
import { useAuth } from "../../context/AuthContext";

const STATUSES = [
  ["all", "All"],
  ["scheduled", "Scheduled"],
  ["confirmed", "Confirmed"],
  ["pending", "Pending"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
];
const COMMON_SPECIALTIES = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Obstetrics and Gynecology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Urology",
];
const SPECIALTY_DEPARTMENTS = {
  "General Medicine": "Department of General Medicine",
  Cardiology: "Cardiology Department",
  Dermatology: "Dermatology Department",
  Endocrinology: "Endocrinology Department",
  Gastroenterology: "Gastroenterology Department",
  Neurology: "Neurology Department",
  "Obstetrics and Gynecology": "Women's Health Department",
  Ophthalmology: "Ophthalmology Department",
  Orthopedics: "Orthopedics Department",
  Pediatrics: "Pediatrics Department",
  Psychiatry: "Mental Health Department",
  Pulmonology: "Pulmonology Department",
  Urology: "Urology Department",
};

const formatDate = (value, options = { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-GB", options) : "Date pending";
};

const dateKey = (value) => {
  if (typeof value === "string") {
    const storedDate = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (storedDate) return storedDate[0];
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const statusStyle = {
  confirmed: "bg-[#eaf7ed] text-[#25854d]",
  pending: "bg-[#fff7db] text-[#b57d00]",
  cancelled: "bg-[#f1f3f2] text-[#718078]",
  completed: "bg-[#eaf3ff] text-[#2a72d8]",
  scheduled: "bg-[#edf3ff] text-[#3e6fcf]",
};

function AppointmentCard({ item, onOpen }) {
  const status = String(item.status || "pending").toLowerCase();

  return (
    <article className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-[0_8px_28px_rgba(31,105,59,0.04)] transition hover:-translate-y-0.5 hover:border-[#9fcfb0] hover:shadow-[0_14px_34px_rgba(31,105,59,0.08)]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#eaf7ed] text-[#25854d]">
          <CalendarDays size={18} />
          <span className="mt-1 text-[10px] font-bold uppercase">
            {item.date ? new Date(item.date).toLocaleDateString("en", { month: "short", day: "numeric" }) : "Pending"}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-[#1b3c2a]">
              {item.patientId?.name || item.patient?.name || "Patient appointment"}
            </h3>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusStyle[status] || "bg-[#eaf7ed] text-[#25854d]"}`}
            >
              {item.status || "Pending"}
            </span>
          </div>

          <p className="mt-1 text-xs text-[#7d8e84]">
            {item.doctorId?.userId?.name || item.doctorId?.name || item.doctor?.name || "Care team"} • {item.department || item.doctorId?.specialty || item.doctorId?.specialization || item.doctor?.specialization || "Clinical visit"}
          </p>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#65796d]">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={14} className="text-[#25854d]" />
              {item.timeSlot || "Time pending"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} className="text-[#25854d]" />
              {item.location || "Meridian care centre"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpen(item)}
          className="self-start rounded-xl border border-[#cfe5d5] px-3 py-2 text-xs font-bold text-[#25854d] hover:bg-[#f1f8f3]"
        >
          View details
        </button>
      </div>

      {item.chiefComplaint && (
        <p className="mt-5 border-t border-[#edf3ee] pt-4 text-sm leading-6 text-[#74877c]">
          Reason for visit: {item.chiefComplaint}
        </p>
      )}
    </article>
  );
}

function Calendar({ month, appointments, onChange, onSelect }) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = (first.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((start + days) / 7) * 7 }, (_, index) => {
    const number = index - start + 1;
    return number > 0 && number <= days ? new Date(month.getFullYear(), month.getMonth(), number) : null;
  });

  return (
    <div className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#25854d]">Schedule view</p>
          <h2 className="mt-1 text-lg font-bold">{month.toLocaleDateString("en", { month: "long", year: "numeric" })}</h2>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dbe9df] text-[#60766a]"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => onChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dbe9df] text-[#60766a]"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wide text-[#9aaa9f]">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <span key={day} className="py-2">{day}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          const matches = day ? appointments.filter((item) => dateKey(item.date) === dateKey(day) && item.status !== "cancelled") : [];
          return (
            <button
              key={index}
              type="button"
              disabled={!day}
              onClick={() => matches[0] && onSelect(matches[0])}
              className={`min-h-12 rounded-lg p-1 text-xs transition ${day ? "hover:bg-[#f0f8f2]" : "cursor-default"} ${matches.length ? "bg-[#dff3e5] font-bold text-[#1a7347] ring-1 ring-[#9fcfb0]" : day && dateKey(day) === dateKey(new Date()) ? "bg-[#edf7f1] text-[#1a7347]" : "text-[#4a5d52]"}`}
            >
              {day ? day.getDate() : ""}
              {matches.length > 0 && <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-[#159447] mx-auto" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function State({ title, text, retry }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center text-center">
      <AlertTriangle size={28} className="text-[#6ca67b]" />
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mt-1 text-sm text-[#83938a]">{text}</p>
      {retry && (
        <button type="button" onClick={retry} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25854d] px-4 py-2 text-xs font-bold text-white">
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}

export default function Appointments() {
  const { user } = useAuth();
  const patientId = user?.patientId || user?.id || user?.uid;
  const [items, setItems] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    doctorId: "",
    specialization: "",
    department: "",
    date: "",
    timeSlot: "",
    appointmentType: "Consultation",
    chiefComplaint: "",
    notes: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      if (!patientId) {
        setItems([]);
        setDoctors([]);
        return;
      }
      const appointmentsResult = await fetchAppointments(patientId);
      setItems(Array.isArray(appointmentsResult) ? appointmentsResult : appointmentsResult.appointments || []);
      setDoctors(await fetchDoctors().catch(() => []));
    } catch (requestError) {
      setError(requestError.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      load();
    }
  }, [patientId]);

  const filtered = useMemo(
    () =>
      items
        .filter((item) => status === "all" || String(item.status || "pending").toLowerCase() === status)
        .filter((item) => !dateFilter || dateKey(item.date) === dateFilter)
        .filter((item) => {
          const query = search.trim().toLowerCase();
          if (!query) return true;
          return [
            item.patientId?.name,
            item.doctorId?.userId?.name,
            item.doctorId?.name,
            item.department,
            item.appointmentType,
            item.chiefComplaint,
            item.timeSlot,
          ].some((value) => String(value || "").toLowerCase().includes(query));
        }),
    [dateFilter, items, search, status]
  );

  const submit = async (event) => {
    event.preventDefault();

    if (!form.doctorId || !form.date || !form.timeSlot || !form.chiefComplaint) {
      setFormError("Doctor, date, time slot, and reason for visit are required.");
      return;
    }

    try {
      setFormError("");
      await createAppointment({
        ...form,
        patientId,
        status: "pending",
      });

      setBooking(false);
      setForm({
        doctorId: "",
        specialization: "",
        department: "",
        date: "",
        timeSlot: "",
        appointmentType: "Consultation",
        chiefComplaint: "",
        notes: "",
      });
      await load();
    } catch (requestError) {
      setFormError(requestError.message);
    }
  };

  const cancel = async () => {
    if (!selected) return;
    try {
      await cancelAppointment(selected._id);
      setSelected(null);
      setDetailsOpen(false);
      await load();
    } catch (requestError) {
      setError(requestError.message || "Unable to cancel appointment.");
    }
  };

  const today = items.filter((item) => dateKey(item.date) === dateKey(new Date())).length;
  const upcoming = items.filter((item) => ["scheduled", "confirmed", "pending"].includes(String(item.status || "pending").toLowerCase())).length;

  return (
    <div className="min-h-screen bg-[#f7fbf8] text-[#173a28]">
      <Navbar />

      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-12 pt-7 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-[#d8eee0] bg-[#eaf7ed] px-6 py-8 shadow-[0_12px_40px_rgba(31,105,59,0.07)] sm:px-10 lg:py-10">
          <img src="/images/medical-login.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#eaf7ed] via-[#eaf7ed]/95 to-transparent" />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#25854d]">
                <ShieldCheck size={15} /> Connected care scheduling
              </div>
              <h1 className="mt-3 text-3xl font-bold text-[#173a28] sm:text-4xl">Appointments</h1>
              <p className="mt-3 text-sm leading-6 text-[#62786b]">
                Manage patient appointments and clinical visits.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setBooking(true)}
              className="inline-flex items-center gap-2 self-start rounded-xl bg-[#25854d] px-4 py-3 text-sm font-bold text-white hover:bg-[#176b3d]"
            >
              <Plus size={17} /> Book appointment
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Today&apos;s appointments" value={today} />
          <Stat label="Upcoming" value={upcoming} />
          <Stat label="Approved" value={items.filter((item) => item.status === "confirmed").length} />
          <Stat label="Pending review" value={items.filter((item) => item.status === "pending").length} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-[#dbe9df] px-3 text-sm text-[#829188] xl:max-w-md">
                  <Search size={15} className="text-[#7a8f86]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search appointments"
                    className="w-full bg-transparent text-sm text-[#183a28] outline-none placeholder:text-[#8a9d92]"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatus(value)}
                      className={`rounded-xl px-3 py-2 text-xs font-bold transition ${status === value ? "bg-[#159447] text-white" : "border border-[#dfeee3] bg-[#f9fcfa] text-[#183a28]"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#deece1] bg-white p-8 text-center shadow-sm">
                <State title="No appointments found" text="Your appointments will appear here after scheduling." />
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((item) => (
                  <AppointmentCard
                    item={item}
                    key={item._id}
                    onOpen={(appointment) => {
                      setSelected(appointment);
                      setDetailsOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#25854d]">Schedule</p>
                  <h3 className="mt-1 text-lg font-bold text-[#183a28]">Monthly view</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                    className="rounded-lg border border-[#dfeee3] p-2 text-[#60766a] hover:bg-[#f3faf5]"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                    className="rounded-lg border border-[#dfeee3] p-2 text-[#60766a] hover:bg-[#f3faf5]"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <Calendar
                  month={month}
                  appointments={items}
                  onChange={setMonth}
                  onSelect={(appointment) => {
                    setSelected(appointment);
                    setDetailsOpen(true);
                  }}
                />
              </div>
            </div>
          </aside>
        </section>

        {booking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#123a28]/25 p-4">
            <BookingModal
              form={form}
              setForm={setForm}
              doctors={doctors}
              error={formError}
              onClose={() => {
                setFormError("");
                setBooking(false);
              }}
              onSubmit={submit}
            />
          </div>
        )}

        {detailsOpen && selected && (
          <AppointmentDetails
            appointment={selected}
            onClose={() => setDetailsOpen(false)}
            onCancel={cancel}
          />
        )}
      </main>
    </div>
  );
}

function AppointmentDetails({ appointment, onClose, onCancel }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#123a28]/35 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-[#edf3ee] pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#25854d]">Appointment details</p>
            <h2 className="mt-2 text-2xl font-black text-[#183a28]">{appointment.doctorId?.userId?.name || appointment.doctorId?.name || appointment.doctor?.name || "Doctor appointment"}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0f8f2] text-[#25854d]" aria-label="Close details">
            <X size={17} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Detail label="Specialty" value={appointment.doctorId?.specialty || appointment.doctorId?.specialization || "Clinical visit"} />
          <Detail label="Status" value={appointment.status || "Pending"} />
          <Detail label="Date" value={formatDate(appointment.date)} />
          <Detail label="Time" value={appointment.timeSlot || "Not scheduled"} />
          <Detail label="Visit type" value={appointment.appointmentType || "Consultation"} />
          <Detail label="Department" value={appointment.department || "Not specified"} />
        </div>

        <div className="mt-5 rounded-xl bg-[#f7faf8] p-4">
          <Detail label="Reason for visit" value={appointment.chiefComplaint || "Not provided"} />
          {appointment.notes && <div className="mt-4"><Detail label="Notes" value={appointment.notes} /></div>}
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#cfe5d5] px-4 py-2.5 text-sm font-bold text-[#25854d]">Close</button>
          {!['cancelled', 'completed'].includes(appointment.status) && (
            <button type="button" onClick={onCancel} className="flex-1 rounded-xl bg-[#fff0ee] px-4 py-2.5 text-sm font-bold text-[#c14f45]">Cancel appointment</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a9d92]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#315343]">{value}</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-sm">
      <p className="text-xs text-[#84948b]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#25854d]">{value}</p>
    </div>
  );
}

function doctorSpecialty(doctor) {
  return doctor.specialty || doctor.specialization || doctor.userId?.specialization || doctor.department || "General Medicine";
}

function normalizeSpecialty(value) {
  const specialty = value.trim().toLowerCase();
  const aliases = {
    "general medicine": "general",
    "general physician": "general",
    cardiology: "cardiology",
    cardiologist: "cardiology",
    dermatology: "dermatology",
    dermatologist: "dermatology",
    neurology: "neurology",
    neurologist: "neurology",
    pediatrics: "pediatrics",
    pediatrician: "pediatrics",
    orthopedics: "orthopedics",
    orthopedic: "orthopedics",
    psychiatry: "psychiatry",
    psychiatrist: "psychiatry",
  };
  return aliases[specialty] || specialty;
}

function specialtyMatches(doctor, specialty) {
  if (!specialty) return true;
  return normalizeSpecialty(doctorSpecialty(doctor)) === normalizeSpecialty(specialty);
}

function doctorDepartment(doctor) {
  return doctor.department || doctor.userId?.department || "";
}

function doctorHasAccount(doctor) {
  return Boolean(doctor.userId && typeof doctor.userId === "object");
}

function departmentForSpecialty(doctors, specialty) {
  if (SPECIALTY_DEPARTMENTS[specialty]) return SPECIALTY_DEPARTMENTS[specialty];
  const configuredDepartments = [...new Set(
    doctors
      .filter((doctor) => doctorSpecialty(doctor) === specialty)
      .map(doctorDepartment)
      .filter(Boolean),
  )];
  return configuredDepartments.length === 1 ? configuredDepartments[0] : "";
}

function BookingModal({ form, setForm, doctors, error, onClose, onSubmit }) {
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const specialties = [...new Set([
    ...COMMON_SPECIALTIES,
    ...doctors.map(doctorSpecialty).filter(Boolean),
  ])].sort();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#123a28]/25 p-4">
      <form onSubmit={onSubmit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#25854d]">Care scheduling</p>
            <h2 className="mt-2 text-2xl font-bold">Book appointment</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0f8f2] text-[#25854d]">
            <X size={17} />
          </button>
        </div>

        {error && <p className="mt-4 rounded-xl bg-[#f5fbf6] p-3 text-sm text-[#66806f]">{error}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-[#567064]">
            Doctor specialty
            <select
              value={form.specialization || ""}
              onChange={(event) => {
                const value = event.target.value;
                update("specialization", value);
                update("department", departmentForSpecialty(doctors, value));
                update("doctorId", "");
              }}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#dbe9df] px-3 font-normal outline-none"
            >
              <option value="">Select specialty</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </label>

          <label className="text-xs font-bold text-[#567064]">
            Doctor
            <select
              value={form.doctorId}
              onChange={(event) => update("doctorId", event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#dbe9df] px-3 font-normal outline-none"
            >
              <option value="">Select doctor</option>
              {doctors
                .filter((doctor) => doctorHasAccount(doctor))
                .filter((doctor) => specialtyMatches(doctor, form.specialization))
                .map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name || doctor.userId?.name || "Doctor"}
                  </option>
                ))}
            </select>
          </label>

          <label className="text-xs font-bold text-[#567064]">
            Department
            <input
              value={form.department}
              readOnly
              placeholder="Select a specialty first"
              className="mt-1.5 h-11 w-full rounded-xl border border-[#dbe9df] bg-[#f5faf6] px-3 font-normal text-[#315343] outline-none"
            />
          </label>

          <label className="text-xs font-bold text-[#567064]">
            Date
            <input
              type="date"
              value={form.date}
              onChange={(event) => update("date", event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#dbe9df] px-3 font-normal outline-none"
            />
          </label>

          <label className="text-xs font-bold text-[#567064]">
            Time slot
            <input
              value={form.timeSlot}
              onChange={(event) => update("timeSlot", event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#dbe9df] px-3 font-normal outline-none"
              placeholder="e.g. 09:30"
            />
          </label>

          <label className="text-xs font-bold text-[#567064]">
            Visit type
            <select
              value={form.appointmentType}
              onChange={(event) => update("appointmentType", event.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-[#dbe9df] px-3 font-normal outline-none"
            >
              <option>Consultation</option>
              <option>Follow-up</option>
              <option>Telemedicine</option>
              <option>Procedure</option>
            </select>
          </label>
        </div>

        <label className="mt-4 block text-xs font-bold text-[#567064]">
          Reason for visit
          <textarea
            value={form.chiefComplaint}
            onChange={(event) => update("chiefComplaint", event.target.value)}
            rows={4}
            className="mt-1.5 w-full rounded-xl border border-[#dbe9df] px-3 py-2.5 font-normal outline-none"
            placeholder="Briefly describe your concern"
          />
        </label>

        <label className="mt-4 block text-xs font-bold text-[#567064]">
          Notes (optional)
          <textarea
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-[#dbe9df] px-3 py-2.5 font-normal outline-none"
            placeholder="Any extra details for the clinic"
          />
        </label>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#cfe5d5] px-4 py-2.5 text-xs font-bold text-[#25854d]">
            Cancel
          </button>
          <button type="submit" className="flex-1 rounded-xl bg-[#25854d] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#176b3d]">
            Request appointment
          </button>
        </div>
      </form>
    </div>
  );
}
