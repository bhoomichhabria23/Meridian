import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Camera,
  Edit3,
  LockKeyhole,
  LogOut,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import {
  changePassword,
  fetchProfile,
  updateProfile,
} from "../../services/profileService";

const empty = {
  name: "",
  email: "",
  phone: "",
  age: "",
  height: "",
  weight: "",
  bmi: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  address: "",
  allergies: "",
  conditions: "",
  emergencyName: "",
  emergencyRelationship: "",
  emergencyPhone: "",
  profileImage: "",
};
const dateValue = (value) => (value ? String(value).slice(0, 10) : "");
const numberValue = (value) => (value === "" ? undefined : Number(value));
const heightParts = (centimeters) => {
  const totalInches = Number(centimeters) / 2.54;
  if (!Number.isFinite(totalInches) || totalInches <= 0) {
    return { feet: "", inches: "" };
  }
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return inches === 12
    ? { feet: feet + 1, inches: 0 }
    : { feet, inches };
};
const parseHeight = (value) => {
  const match = String(value).match(/(\d+(?:\.\d+)?)\s*(?:'|ft|feet)?\s*(?:\s*(\d+(?:\.\d+)?)\s*(?:"|in|inches)?)?/i);
  if (!match) return { feet: 0, inches: 0 };
  const feet = Number(match[1]);
  const inches = Number(match[2] || 0);
  return { feet, inches };
};
const formatHeight = (centimeters) => {
  const { feet, inches } = heightParts(centimeters);
  return feet === "" ? "" : `${feet}' ${inches}"`;
};
const profileFromResponse = (data) => {
  const patient = data.patient || {};
  return {
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || patient.phone || "",
    age: patient.age ?? "",
    height: formatHeight(patient.height),
    weight: patient.weight ?? "",
    bmi: patient.bmi ?? "",
    dateOfBirth: dateValue(patient.dateOfBirth),
    gender: patient.gender || "",
    bloodGroup: patient.bloodGroup || "",
    address: patient.address || "",
    allergies: (patient.allergies || []).join(", "),
    conditions: (patient.conditions || [])
      .map((item) => item.name || item)
      .join(", "),
    emergencyName: patient.emergencyContact?.name || "",
    emergencyRelationship: patient.emergencyContact?.relationship || "",
    emergencyPhone: patient.emergencyContact?.phone || "",
    profileImage: localStorage.getItem("profileImage") || "",
  };
};
function Field({ label, value, onChange, disabled = false, type = "text", placeholder = "", emptyDisplay = "Not provided" }) {
  return (
    <label className="text-xs font-bold text-[#567064]">
      {label}
      <input
        type={disabled && !value ? "text" : type}
        value={value || (disabled ? emptyDisplay : "")}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-[#dbe9df] bg-white px-3 text-sm font-normal text-[#315343] outline-none focus:border-[#25854d] disabled:bg-[#f5faf6] disabled:text-[#819087]"
      />
    </label>
  );
}
function SelectField({ label, value, onChange, disabled = false, options }) {
  return (
    <label className="text-xs font-bold text-[#567064]">
      {label}
      <select value={value || ""} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#dbe9df] bg-white px-3 text-sm font-normal text-[#315343] outline-none focus:border-[#25854d] disabled:bg-[#f5faf6] disabled:text-[#819087]">
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
function Card({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-[#deece1] bg-white p-5 shadow-[0_8px_28px_rgba(31,105,59,0.04)] sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <Icon size={18} className="text-[#25854d]" />
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
function ErrorState({ error, retry }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center text-center">
      <AlertTriangle className="text-[#6ca67b]" size={29} />
      <h2 className="mt-3 font-bold">Unable to load profile</h2>
      <p className="mt-1 text-sm text-[#83938a]">{error}</p>
      <button
        type="button"
        onClick={retry}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25854d] px-4 py-2 text-xs font-bold text-white"
      >
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}

export default function Profile() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const imageInputRef = useRef(null);
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchProfile();
      setProfile(profileFromResponse(data));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const set = (key, value) =>
    setProfile((current) => ({ ...current, [key]: value }));
  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    await logout();
  };
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 512;
        const scale = Math.min(1, size / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        const profileImage = canvas.toDataURL("image/jpeg", 0.82);
        localStorage.setItem("profileImage", profileImage);
        set("profileImage", profileImage);
        setError("");
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  const calculatedBmi =
    parseHeight(profile.height).feet >= 0 && parseHeight(profile.height).inches >= 0 && Number(profile.weight) > 0 && (parseHeight(profile.height).feet * 12 + parseHeight(profile.height).inches) > 0
      ? (Number(profile.weight) / (((parseHeight(profile.height).feet * 12 + parseHeight(profile.height).inches) * 0.0254) ** 2)).toFixed(1)
      : "";
  const parsedHeight = parseHeight(profile.height);
  const heightInCentimeters =
    (parsedHeight.feet * 12 + parsedHeight.inches) > 0
      ? (parsedHeight.feet * 12 + parsedHeight.inches) * 2.54
      : undefined;
  const save = async () => {
    try {
      const data = await updateProfile({
        ...profile,
        age: numberValue(profile.age),
        height: heightInCentimeters,
        weight: numberValue(profile.weight),
        bmi: calculatedBmi ? Number(calculatedBmi) : undefined,
        allergies: profile.allergies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        conditions: profile.conditions
          .split(",")
          .map((name) => ({ name }))
          .filter((item) => item.name),
        emergencyContact: {
          name: profile.emergencyName,
          relationship: profile.emergencyRelationship,
          phone: profile.emergencyPhone,
        },
      });
      setProfile(profileFromResponse(data));
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2600);
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  if (loading)
    return (
      <div className="min-h-screen bg-[#f7fbf8]">
        <Navbar />
        <main className="mx-auto max-w-7xl p-6">
          <div className="h-96 animate-pulse rounded-3xl bg-[#eaf5ed]" />
        </main>
      </div>
    );
  if (error && !profile.name)
    return (
      <div className="min-h-screen bg-[#f7fbf8]">
        <Navbar />
        <main className="mx-auto max-w-7xl p-6">
          <ErrorState error={error} retry={load} />
        </main>
      </div>
    );
  const initials =
    profile.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P";
  return (
    <div className="min-h-screen bg-[#f7fbf8] text-[#173a28]">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-12 pt-7 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-[#d8eee0] bg-[#eaf7ed] p-6 shadow-[0_12px_40px_rgba(31,105,59,0.07)] sm:p-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1.5">
              <button type="button" onClick={() => imageInputRef.current?.click()} title="Upload profile photo" aria-label="Upload profile photo" className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white text-2xl font-bold text-[#25854d] shadow-sm">
                {profile.profileImage ? <img src={profile.profileImage} alt="Profile" className="h-full w-full object-cover" /> : initials}
                <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#25854d] text-white shadow-sm"><Camera size={14} /></span>
              </button>
              <span className="text-[10px] font-bold text-[#25854d]">Upload photo</span>
              </div>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#25854d]">
                  Personal health profile
                </p>
                <h1 className="mt-2 text-3xl font-bold">
                  {profile.name || "Your profile"}
                </h1>
                <p className="mt-1 text-sm text-[#6f8377]">
                  Keep your clinical information current and connected.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(!editing)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#b9dac2] bg-white px-4 py-2.5 text-xs font-bold text-[#25854d]"
              >
                <Edit3 size={14} /> Edit Profile
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={save}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#25854d] px-4 py-2.5 text-xs font-bold text-white"
                >
                  <Save size={14} /> Save Changes
                </button>
              )}
            </div>
          </div>
        </section>
        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-[#cfe8d6] bg-[#eff9f1] p-3 text-sm text-[#4d765c]">
            <Check size={16} /> Profile changes saved.
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-[#f5fbf6] p-3 text-sm text-[#66806f]">
            {error}
          </div>
        )}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Card title="Identity & contact" icon={UserRound}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Full name"
                  value={profile.name}
                  onChange={(value) => set("name", value)}
                  disabled={!editing}
                />
                <Field
                  label="Email"
                  value={profile.email}
                  onChange={(value) => set("email", value)}
                  disabled={!editing}
                  type="email"
                />
                <Field
                  label="Phone"
                  value={profile.phone}
                  onChange={(value) => set("phone", value)}
                  disabled={!editing}
                />
                <Field
                  label="Age"
                  value={profile.age}
                  onChange={(value) => set("age", value)}
                  disabled={!editing}
                  type="number"
                  emptyDisplay="Not provided"
                />
                <Field
                  label="Height (ft/in)"
                  value={profile.height}
                  onChange={(value) => set("height", value)}
                  disabled={!editing}
                  placeholder={'e.g. 5\' 10"'}
                  emptyDisplay="Not provided"
                />
                <Field
                  label="Weight (kg)"
                  value={profile.weight}
                  onChange={(value) => set("weight", value)}
                  disabled={!editing}
                  type="number"
                  emptyDisplay="Not provided"
                />
                <Field
                  label="BMI"
                  value={calculatedBmi || profile.bmi}
                  onChange={() => {}}
                  disabled
                  emptyDisplay="Not calculated"
                />
                <Field
                  label="Address"
                  value={profile.address}
                  onChange={(value) => set("address", value)}
                  disabled={!editing}
                />
              </div>
            </Card>
            <Card title="Clinical information" icon={ShieldCheck}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Date of birth"
                  value={profile.dateOfBirth}
                  onChange={(value) => set("dateOfBirth", value)}
                  disabled={!editing}
                  type="date"
                />
                <SelectField
                  label="Gender"
                  value={profile.gender}
                  onChange={(value) => set("gender", value)}
                  disabled={!editing}
                  options={["male", "female", "other", "prefer_not"]}
                />
                <SelectField
                  label="Blood group"
                  value={profile.bloodGroup}
                  onChange={(value) => set("bloodGroup", value)}
                  disabled={!editing}
                  options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "unknown"]}
                />
                <Field
                  label="Allergies"
                  value={profile.allergies}
                  onChange={(value) => set("allergies", value)}
                  disabled={!editing}
                />
                <Field
                  label="Medical conditions"
                  value={profile.conditions}
                  onChange={(value) => set("conditions", value)}
                  disabled={!editing}
                />
              </div>
            </Card>
            <Card title="Emergency contact" icon={Phone}>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label="Name"
                  value={profile.emergencyName}
                  onChange={(value) => set("emergencyName", value)}
                  disabled={!editing}
                />
                <Field
                  label="Relationship"
                  value={profile.emergencyRelationship}
                  onChange={(value) => set("emergencyRelationship", value)}
                  disabled={!editing}
                />
                <Field
                  label="Phone"
                  value={profile.emergencyPhone}
                  onChange={(value) => set("emergencyPhone", value)}
                  disabled={!editing}
                />
              </div>
            </Card>
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-[#cfe8d6] bg-[#eff9f1] p-5">
              <div className="flex items-center gap-2 text-[#25854d]">
                <MapPin size={18} />
                <h2 className="font-bold">Profile integrity</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#66806f]">
                Accurate profile details help MERIDIAN connect reports,
                medications, reminders, and clinical history.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPasswordOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#deece1] bg-white p-4 text-sm font-bold text-[#315343] shadow-sm hover:border-[#a9d2b2]"
            >
              <LockKeyhole size={17} className="text-[#25854d]" /> Change
              Password
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white p-4 text-sm font-bold text-red-600 shadow-sm hover:bg-red-50"
            >
              <LogOut size={17} /> Log out
            </button>
          </aside>
        </section>
      </main>
      {passwordOpen && <PasswordModal onClose={() => setPasswordOpen(false)} />}
    </div>
  );
}
function PasswordModal({ onClose }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setMessage("");
      await changePassword(current, next);
      setMessage("Password changed successfully.");
      setTimeout(onClose, 1000);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#123a28]/25 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#25854d]">
              Account security
            </p>
            <h2 className="mt-2 text-2xl font-bold">Change password</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0f8f2] text-[#25854d]"
          >
            <X size={17} />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <input
            required
            type="password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            placeholder="Current password"
            className="h-11 w-full rounded-xl border border-[#dbe9df] px-3 text-sm"
          />
          <input
            required
            minLength={8}
            type="password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            placeholder="New password (8+ characters)"
            className="h-11 w-full rounded-xl border border-[#dbe9df] px-3 text-sm"
          />
        </div>
        {message && (
          <p className="mt-4 rounded-xl bg-[#f5fbf6] p-3 text-sm text-[#66806f]">
            {message}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#cfe5d5] px-4 py-2.5 text-xs font-bold text-[#25854d]"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            type="submit"
            className="rounded-xl bg-[#25854d] px-4 py-2.5 text-xs font-bold text-white"
          >
            {saving ? "Saving..." : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}
