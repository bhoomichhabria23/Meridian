import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileText, Image, Pill, Printer, RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/common/Layout";
import api from "../../api/axios";

const LINKS = [{ to: "/doctor/dashboard", label: "Dashboard", icon: "🏠" }];
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const formatDate = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "Not specified";
};

const fileUrl = (url) => (url?.startsWith("http") ? url : `${API_URL}${url || ""}`);

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8aa092]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#315542]">{value || "Not recorded"}</p>
    </div>
  );
}

export default function PrescriptionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/api/prescriptions/${id}`);
      setPrescription(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load prescription.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <Layout links={LINKS}><div className="rounded-[28px] bg-white p-12 text-center text-sm text-[#647b6d]">Loading prescription...</div></Layout>;

  if (error || !prescription) {
    return (
      <Layout links={LINKS}>
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
          <p>{error || "Prescription not found"}</p>
          <button type="button" onClick={load} className="mt-4 inline-flex items-center gap-2 font-bold"><RefreshCw size={14} /> Retry</button>
        </div>
      </Layout>
    );
  }

  const patient = prescription.patientId;

  return (
    <Layout links={LINKS}>
      <div className="mx-auto max-w-6xl space-y-6">
        <button type="button" onClick={() => navigate("/doctor/prescriptions")} className="inline-flex items-center gap-2 text-sm font-bold text-[#597266] hover:text-[#183a28]"><ArrowLeft size={16} /> Back to prescriptions</button>

        <section className="rounded-[30px] border border-[#d7efe0] bg-gradient-to-br from-[#0f5132] via-[#1a7a4a] to-[#19b36d] p-6 text-white shadow-[0_18px_45px_rgba(26,122,74,0.2)] md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Prescription details</p>
              <h1 className="mt-3 text-3xl font-black md:text-4xl">{prescription.prescriptionId || "Clinical treatment plan"}</h1>
              <p className="mt-2 text-sm text-emerald-50">Issued {formatDate(prescription.date || prescription.createdAt)}</p>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide">{prescription.status || "active"}</span>
          </div>
        </section>

        <section className="grid gap-4 rounded-[28px] border border-[#dfeee3] bg-white p-5 shadow-sm md:grid-cols-4 md:p-6">
          <Field label="Patient" value={patient?.name} />
          <Field label="Patient ID" value={patient?.patientId || patient?._id} />
          <Field label="Diagnosis" value={prescription.diagnosis} />
          <Field label="Follow-up" value={formatDate(prescription.followUpDate)} />
        </section>

        <section className="rounded-[28px] border border-[#dfeee3] bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center gap-3"><Pill className="text-[#159447]" size={20} /><h2 className="text-xl font-black text-[#183a28]">Medication plan</h2></div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(prescription.medications || []).map((medication, index) => (
              <div key={`${medication.name}-${index}`} className="rounded-2xl border border-[#ebf1ed] bg-[#f9fcfa] p-4">
                <div className="flex items-center justify-between gap-3"><p className="font-bold text-[#183a28]">{medication.name}</p><span className="text-xs font-bold text-[#25854d]">{medication.frequency || "As directed"}</span></div>
                <p className="mt-2 text-sm text-[#5e7466]">{medication.dosage || "As prescribed"} · {medication.duration || "Duration not specified"}</p>
                {medication.timing && <p className="mt-1 text-xs text-[#7d8e84]">{medication.timing}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-[#dfeee3] bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-black text-[#183a28]">Clinical notes</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#52695b]">{prescription.notes || "No additional notes recorded."}</p>
          </div>

          <div className="rounded-[28px] border border-[#dfeee3] bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black text-[#183a28]">Attachments</h2><span className="text-xs font-bold text-[#789083]">{prescription.attachments?.length || 0} files</span></div>
            <div className="mt-4 space-y-3">
              {prescription.attachments?.length ? prescription.attachments.map((attachment, index) => {
                const url = fileUrl(attachment.url);
                const isImage = attachment.mimeType?.startsWith("image/");
                return (
                  <div key={`${attachment.name}-${index}`} className="rounded-2xl border border-[#ebf1ed] bg-[#f9fcfa] p-3">
                    {isImage && <img src={url} alt={attachment.originalName || "Prescription attachment"} className="mb-3 max-h-48 w-full rounded-xl object-contain" />}
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#315542]">{isImage ? <Image size={16} /> : <FileText size={16} />}<span className="truncate">{attachment.originalName || attachment.name}</span></span>
                      <a href={url} target="_blank" rel="noreferrer" download={attachment.originalName || attachment.name} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#159447] px-3 py-2 text-xs font-bold text-white"><Download size={14} /> Download</a>
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-[#7d8e84]">No attachments were added.</p>}
            </div>
          </div>
        </section>

        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-[#dfeee3] bg-white px-4 py-2 text-sm font-bold text-[#183a28]"><Printer size={15} /> Print details</button>
      </div>
    </Layout>
  );
}