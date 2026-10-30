import { useState } from "react";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Layout from "../../components/common/Layout";
import api from "../../api/axios";

const LINKS = [{ to: "/doctor/dashboard", label: "Dashboard", icon: "🏠" }];

export default function NewPatient() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", dateOfBirth: "", gender: "prefer_not", bloodGroup: "unknown", conditions: "" });
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const response = await api.post("/api/doctors/patients", form);
      toast.success(`Patient created. Temporary password: ${response.data.temporaryPassword}`);
      navigate(`/doctor/patients/${response.data.patient._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create patient");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout links={LINKS}>
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={() => navigate("/doctor/patients")} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#597266]"><ArrowLeft size={16} /> Back to patients</button>
        <section className="rounded-[28px] border border-[#d7efe0] bg-gradient-to-br from-[#f4fbf6] via-white to-[#e5f5ea] p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3 text-[#159447]"><UserPlus size={22} /><p className="text-xs font-bold uppercase tracking-[0.18em]">Patient intake</p></div>
          <h1 className="mt-3 text-3xl font-black text-[#183a28]">Add patient</h1>
          <p className="mt-2 text-sm text-[#647b6d]">Create a patient record and link it to your care list.</p>
        </section>
        <form onSubmit={submit} className="mt-6 space-y-5 rounded-[28px] border border-[#dfeee3] bg-white p-5 shadow-sm md:p-7">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-bold text-[#183a28]">Full name<input required value={form.name} onChange={(event) => update("name", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfeee3] px-3 font-normal outline-none focus:border-[#1aa65c]" /></label>
            <label className="text-sm font-bold text-[#183a28]">Email<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfeee3] px-3 font-normal outline-none focus:border-[#1aa65c]" /></label>
            <label className="text-sm font-bold text-[#183a28]">Phone<input required value={form.phone} onChange={(event) => update("phone", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfeee3] px-3 font-normal outline-none focus:border-[#1aa65c]" /></label>
            <label className="text-sm font-bold text-[#183a28]">Date of birth<input type="date" value={form.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfeee3] px-3 font-normal outline-none focus:border-[#1aa65c]" /></label>
            <label className="text-sm font-bold text-[#183a28]">Gender<select value={form.gender} onChange={(event) => update("gender", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfeee3] px-3 font-normal outline-none focus:border-[#1aa65c]"><option value="prefer_not">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label>
            <label className="text-sm font-bold text-[#183a28]">Blood group<select value={form.bloodGroup} onChange={(event) => update("bloodGroup", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfeee3] px-3 font-normal outline-none focus:border-[#1aa65c]"><option value="unknown">Unknown</option>{["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((group) => <option key={group} value={group}>{group}</option>)}</select></label>
          </div>
          <label className="block text-sm font-bold text-[#183a28]">Existing condition or medical history<textarea value={form.conditions} onChange={(event) => update("conditions", event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-[#dfeee3] px-3 py-3 font-normal outline-none focus:border-[#1aa65c]" placeholder="Optional clinical history" /></label>
          <button type="submit" disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#159447] px-5 text-sm font-bold text-white disabled:opacity-60">{saving ? "Creating patient..." : "Create patient"}</button>
        </form>
      </div>
    </Layout>
  );
}
