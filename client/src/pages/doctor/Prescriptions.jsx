import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, FilePlus2, Plus, RefreshCw, Search, SlidersHorizontal, Stethoscope, UserRound } from "lucide-react";
import Layout from "../../components/common/Layout";
import api from "../../api/axios";

const LINKS = [{ to: "/doctor/dashboard", label: "Dashboard", icon: "🏠" }];

const formatDate = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "Not specified";
};

export default function DoctorPrescriptions() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [attachmentFilter, setAttachmentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/api/doctors/dashboard");
      setPrescriptions(response.data?.recentPrescriptions || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load prescriptions.");
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await api.get("/api/doctors/patients");
      const records = Array.isArray(response.data) ? response.data : response.data?.patients || response.data?.data || [];
      setPatients(records);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load patients.");
    }
  };

  useEffect(() => {
    load();
    loadPatients();
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) return true;
    return [
      patient.userId?.name,
      patient.userId?.email,
      patient.userId?.phone,
      patient.patientCode,
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });

  const filtered = prescriptions.filter((prescription) => {
    const query = search.trim().toLowerCase();
    const searchableValues = [
      prescription.prescriptionId,
      prescription.diagnosis,
      prescription.patientId?.name,
      ...(prescription.medications || []).map((medication) => medication.name),
    ];
    const matchesSearch = !query || searchableValues.some((value) => String(value || "").toLowerCase().includes(query));
    const matchesStatus = statusFilter === "all" || String(prescription.status || "active").toLowerCase() === statusFilter;
    const hasAttachments = prescription.attachments?.length > 0;
    const matchesAttachments = attachmentFilter === "all" || (attachmentFilter === "with" ? hasAttachments : !hasAttachments);
    const issuedDate = new Date(prescription.date || prescription.createdAt);
    const daysAgo = (Date.now() - issuedDate.getTime()) / 86400000;
    const matchesDate = dateFilter === "all" || (dateFilter === "30" ? daysAgo <= 30 : daysAgo <= 90);

    return matchesSearch && matchesStatus && matchesAttachments && matchesDate;
  });

  return (
    <Layout links={LINKS}>
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-[#d7efe0] bg-gradient-to-br from-[#f4fbf6] via-white to-[#e5f5ea] p-6 shadow-[0_18px_50px_rgba(27,98,52,0.08)] md:p-8">
          <div className="flex items-center gap-3 text-[#25854d]">
            <ClipboardList size={22} />
            <p className="text-xs font-bold uppercase tracking-[0.18em]">Clinical records</p>
          </div>
          <h1 className="mt-3 text-3xl font-black text-[#183a28] md:text-4xl">Prescriptions</h1>
          <p className="mt-2 text-sm text-[#647b6d]">Review prescriptions created for your patients.</p>
        </section>

        <section className="rounded-[28px] border border-[#dfeee3] bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2"><FilePlus2 size={19} className="text-[#159447]" /><h2 className="text-xl font-black text-[#183a28]">Approved patients</h2></div>
              <p className="mt-1 text-sm text-[#71857a]">Choose a patient approved by reception to create their prescription.</p>
            </div>
            <span className="rounded-full bg-[#eaf7ed] px-3 py-1.5 text-xs font-bold text-[#25854d]">{patients.length} approved</span>
          </div>

          <div className="relative mt-5 max-w-lg">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7d9185]" />
            <input value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} placeholder="Search approved patients" className="h-11 w-full rounded-2xl border border-[#dfeee3] bg-[#f8fcf9] pl-10 pr-4 text-sm text-[#183a28] outline-none focus:border-[#8ac79d]" />
          </div>

          {!patients.length ? (
            <p className="mt-5 rounded-2xl bg-[#f8fcf9] p-5 text-center text-sm text-[#71857a]">No receptionist-approved patients are available.</p>
          ) : !filteredPatients.length ? (
            <p className="mt-5 rounded-2xl bg-[#f8fcf9] p-5 text-center text-sm text-[#71857a]">No approved patient matches your search.</p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredPatients.map((patient) => (
                <div key={patient._id} className="rounded-2xl border border-[#e2eee5] bg-[#fbfefc] p-4 transition hover:border-[#a9d4b5] hover:shadow-[0_10px_25px_rgba(31,105,59,0.07)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf7ed] text-[#159447]"><UserRound size={19} /></div>
                    <div className="min-w-0"><h3 className="truncate font-bold text-[#183a28]">{patient.userId?.name || patient.name || "Registered patient"}</h3><p className="mt-1 text-xs text-[#71857a]">{patient.patientCode || "Patient record"}</p></div>
                  </div>
                  <p className="mt-4 truncate text-xs text-[#647b6d]">{patient.userId?.email || patient.email || "Email not available"}</p>
                  <button type="button" onClick={() => navigate(`/doctor/prescription/new?patientId=${patient._id}`)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#159447] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#12853f]"><Plus size={14} /> Add prescription</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="px-1 py-2">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="relative max-w-lg flex-1">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7d9185]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient, diagnosis, or medication"
              className="h-12 w-full rounded-2xl border border-[#dfeee3] bg-[#f8fcf9] pl-11 pr-4 text-sm text-[#183a28] outline-none focus:border-[#8ac79d]"
            />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal size={16} className="text-[#789083]" />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-xl border border-[#dfeee3] bg-[#f8fcf9] px-3 text-xs font-bold text-[#315542] outline-none">
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <select value={attachmentFilter} onChange={(event) => setAttachmentFilter(event.target.value)} className="h-10 rounded-xl border border-[#dfeee3] bg-[#f8fcf9] px-3 text-xs font-bold text-[#315542] outline-none">
                <option value="all">All files</option>
                <option value="with">With attachments</option>
                <option value="without">Without attachments</option>
              </select>
              <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="h-10 rounded-xl border border-[#dfeee3] bg-[#f8fcf9] px-3 text-xs font-bold text-[#315542] outline-none">
                <option value="all">Any date</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={load} className="inline-flex items-center gap-2 font-bold"><RefreshCw size={14} /> Retry</button>
          </div>
        )}

        {loading ? (
          <div className="rounded-[28px] border border-[#dfeee3] bg-white p-10 text-center text-sm text-[#647b6d]">Loading prescriptions...</div>
        ) : !error && filtered.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <Stethoscope size={30} className="mx-auto text-[#6ca67b]" />
            <h2 className="mt-3 text-xl font-black text-[#183a28]">No prescriptions found</h2>
            <p className="mt-2 text-sm text-[#71857a]">Prescriptions created for your patients will appear here.</p>
          </div>
        ) : !error ? (
          <section className="overflow-hidden rounded-[28px] border border-[#dfeee3] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="border-b border-[#edf3ee] bg-[#f8fcf9] text-[10px] uppercase tracking-[0.14em] text-[#789083]">
                  <tr>
                    <th className="px-5 py-4">Prescription</th>
                    <th className="px-5 py-4">Patient</th>
                    <th className="px-5 py-4">Diagnosis</th>
                    <th className="px-5 py-4">Medications</th>
                    <th className="px-5 py-4">Issued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ee]">
                  {filtered.map((prescription) => (
                    <tr key={prescription._id} onClick={() => navigate(`/doctor/prescription/${prescription._id}`)} className="cursor-pointer text-sm text-[#3f594a] transition hover:bg-[#f5fbf6]">
                      <td className="px-5 py-5 font-bold text-[#183a28]">{prescription.prescriptionId || "Prescription"}</td>
                      <td className="px-5 py-5">{prescription.patientId?.name || "Patient record"}</td>
                      <td className="max-w-xs px-5 py-5">{prescription.diagnosis || "Not recorded"}</td>
                      <td className="px-5 py-5">{prescription.medications?.length || 0}{prescription.attachments?.length ? <span className="ml-2 text-xs font-bold text-[#25854d]">· {prescription.attachments.length} file{prescription.attachments.length === 1 ? "" : "s"}</span> : null}</td>
                      <td className="px-5 py-5">{formatDate(prescription.date || prescription.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </Layout>
  );
}