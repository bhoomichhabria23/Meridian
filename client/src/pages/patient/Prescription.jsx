import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownToLine, Printer, RefreshCw, Search, ShieldCheck, Stethoscope } from "lucide-react";
import Navbar from "../../components/Navbar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const tabs = [["all", "All prescriptions"], ["active", "Active"], ["completed", "Completed"], ["archived", "Archived"]];

const formatDate = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not specified";
};

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#9aaa9f]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#3a5a48]">{value || "Not recorded"}</p>
    </div>
  );
}

function Card({ item, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`w-full rounded-2xl border p-5 text-left transition ${selected ? "border-[#93cba3] bg-[#f2faf4] shadow-[0_8px_24px_rgba(31,105,59,0.08)]" : "border-[#deece1] bg-white hover:border-[#b5d8be]"}`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#eaf7ed] text-[#25854d]">
          <span className="text-lg font-bold">{item.date ? new Date(item.date).getDate() : "--"}</span>
          <span className="text-[10px] font-bold uppercase">{item.date ? new Date(item.date).toLocaleDateString("en", { month: "short" }) : "date"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-[#1b3c2a]">{item.doctor?.name || "Care team prescription"}</h3>
            <span className="rounded-full bg-[#eaf7ed] px-2.5 py-1 text-[10px] font-bold capitalize text-[#25854d]">{item.status || "Active"}</span>
          </div>
          <p className="mt-1 text-xs text-[#7d8e84]">
            {item.doctor?.specialization || "Medical specialist"} {item.prescriptionId ? `• ${item.prescriptionId}` : ""}
          </p>
          <p className="mt-3 text-sm font-semibold text-[#466352]">
            {item.medications?.length || 0} medications <span className="mx-2 text-[#c4d6c9]">•</span> Follow-up {formatDate(item.followUpDate)}
          </p>
        </div>
        <span className="text-xs font-bold text-[#25854d]">Open</span>
      </div>
    </button>
  );
}

function State({ title, text, action }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center text-center">
      <AlertTriangle size={27} className="text-[#6ca67b]" />
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mt-1 text-sm text-[#83938a]">{text}</p>
      {action && (
        <button type="button" onClick={action} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25854d] px-4 py-2 text-xs font-bold text-white">
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}

export default function Prescriptions() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/api/prescriptions`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to load prescriptions.");
      }

      const result = await response.json();
      const records = Array.isArray(result) ? result : result.prescriptions || [];
      setItems(records);
      setSelected(records[0] || null);
    } catch (requestError) {
      setError(requestError.message || "Unable to load prescriptions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      items
        .filter((item) => tab === "all" || String(item.status || "active").toLowerCase() === tab)
        .filter((item) => {
          const query = search.trim().toLowerCase();
          if (!query) return true;
          return [
            item.doctor?.name,
            item.prescriptionId,
            ...(item.medications || []).map((medication) => medication.name),
          ].some((value) => String(value || "").toLowerCase().includes(query));
        }),
    [items, search, tab]
  );

  const action = async (type) => {
    if (!selected) return;
    if (type === "print") {
      try {
        const response = await fetch(`${API_URL}/api/prescriptions/${selected._id}/print`, { credentials: "include" });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.prescription) throw new Error(result.message || "Unable to prepare prescription for printing.");
        const prescription = result.prescription;
        const printWindow = window.open("", "_blank", "noopener,noreferrer");
        if (!printWindow) throw new Error("Allow pop-ups to print the prescription.");
        const escape = (value) => String(value || "").replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[character]));
        const medications = (prescription.medications || []).map((medication) => `<li><strong>${escape(medication.name)}</strong><br>Dose: ${escape(medication.dosage || "As prescribed")}<br>Frequency: ${escape(medication.frequency || "As directed")}<br>Timing: ${escape(medication.timing || "Not recorded")}<br>Duration: ${escape(medication.duration || "Not recorded")}</li>`).join("");
        printWindow.document.write(`<html><head><title>Prescription ${escape(prescription.prescriptionId)}</title><style>body{font-family:Arial,sans-serif;padding:36px;color:#173a28}h1{color:#176b3d}li{margin:0 0 18px;line-height:1.5}</style></head><body><h1>MERIDIAN</h1><h2>Prescription ${escape(prescription.prescriptionId)}</h2><p>Diagnosis: ${escape(prescription.diagnosis)}</p><p>Issued: ${escape(formatDate(prescription.date))}</p><ol>${medications}</ol><p>${escape(prescription.notes)}</p></body></html>`);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      } catch (printError) {
        setError(printError.message || "Unable to print prescription.");
      }
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/prescriptions/${selected._id}/download`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to download prescription PDF.");
      }
      const pdf = await response.blob();
      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = `prescription-${selected.prescriptionId || selected._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.message || "Unable to download prescription PDF.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fbf8] text-[#173a28]">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-12 pt-7 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[28px] border border-[#d8eee0] bg-[#eaf7ed] px-6 py-8 shadow-[0_12px_40px_rgba(31,105,59,0.07)] sm:px-10 lg:py-10">
          <img src="/images/medical-login.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#eaf7ed] via-[#eaf7ed]/95 to-transparent" />
          <div className="relative max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#25854d]">
              <ShieldCheck size={16} />
              <span>Prescription access</span>
            </div>
            <h1 className="mt-4 text-3xl font-black text-[#173a28] sm:text-4xl">Your active prescriptions</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#4f665a]">Prescriptions appear here only after your consultation has been approved by the clinic team.</p>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#deece1] bg-white p-5 shadow-[0_8px_28px_rgba(31,105,59,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7d8e84]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search medication or doctor"
                className="h-12 w-full rounded-2xl border border-[#deece1] bg-[#f7faf8] pl-11 pr-4 text-sm text-[#173a28] outline-none transition focus:border-[#8ac79d]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {tabs.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold capitalize transition ${tab === key ? "bg-[#25854d] text-white" : "border border-[#deece1] bg-[#f7faf8] text-[#4e6658]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-[28px] border border-dashed border-[#d8eee0] bg-[#f9fcfa] p-10 text-center">
            <Stethoscope size={28} className="mx-auto text-[#6ca67b]" />
            <h2 className="mt-3 text-xl font-black text-[#173a28]">No prescriptions available yet</h2>
            <p className="mt-2 text-sm text-[#627669]">Your prescriptions will appear here after your appointment has been confirmed by reception.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <div className="space-y-4">
              {filtered.map((item) => (
                <Card key={item._id} item={item} selected={selected?._id === item._id} onSelect={setSelected} />
              ))}
            </div>

            <div className="rounded-[28px] border border-[#deece1] bg-white p-5 shadow-[0_8px_28px_rgba(31,105,59,0.04)] sm:p-6">
              {selected ? (
                <>
                  <div className="flex flex-col gap-2 border-b border-[#edf3ee] pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8aa092]">Prescription</p>
                      <h2 className="mt-1 text-2xl font-black text-[#173a28]">{selected.prescriptionId || "Clinical treatment plan"}</h2>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-[#eaf7ed] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#25854d]">{selected.status || "Active"}</span>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Doctor" value={selected.doctor?.name || "Care team"} />
                    <Field label="Specialty" value={selected.doctor?.specialization || "General physician"} />
                    <Field label="Issued" value={formatDate(selected.date)} />
                    <Field label="Follow-up" value={formatDate(selected.followUpDate)} />
                    <Field label="Status" value={selected.status || "Active"} />
                    <Field label="Medication count" value={selected.medications?.length || 0} />
                  </div>

                  <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl bg-[#f7faf8] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8aa092]">Diagnosis</p>
                      <p className="mt-2 text-sm font-medium leading-6 text-[#42564d]">{selected.diagnosis || "Not recorded"}</p>
                    </div>
                    <div className="rounded-2xl bg-[#f7faf8] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8aa092]">Notes</p>
                      <p className="mt-2 text-sm font-medium leading-6 text-[#42564d]">{selected.notes || "No additional notes recorded"}</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-[#edf3ee] bg-[#fafdfb] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8aa092]">Medications</p>
                    <div className="mt-4 space-y-3">
                      {(selected.medications || []).map((medication, index) => (
                        <div key={`${medication.name}-${index}`} className="rounded-2xl border border-[#ebf1ed] bg-white p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-bold text-[#173a28]">{medication.name || "Medication"}</p>
                            <span className="rounded-full bg-[#eaf7ed] px-2.5 py-1 text-[10px] font-bold uppercase text-[#25854d]">{medication.frequency || "As directed"}</span>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-[#9aaa9f]">Dose</p>
                              <p className="mt-1 text-sm font-semibold text-[#3a5a48]">{medication.dosage || medication.dose || "As prescribed"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-[#9aaa9f]">Timing</p>
                              <p className="mt-1 text-sm font-semibold text-[#3a5a48]">{medication.timing || medication.instructions || "As directed"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-[#9aaa9f]">Duration</p>
                              <p className="mt-1 text-sm font-semibold text-[#3a5a48]">{medication.duration || "As advised"}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selected.attachments?.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-[#edf3ee] bg-[#fafdfb] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8aa092]">Attachments</p>
                      <div className="mt-4 space-y-3">
                        {selected.attachments.map((attachment, index) => (
                          <div key={`${attachment.name || attachment.originalName || 'attachment'}-${index}`} className="flex flex-col gap-2 rounded-2xl border border-[#ebf1ed] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[#173a28]">{attachment.originalName || attachment.name || "Prescription document"}</p>
                              <p className="text-[10px] uppercase tracking-wide text-[#7d8e84]">{attachment.mimeType || "file"}</p>
                            </div>
                            <a href={`${API_URL}${attachment.url || ""}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-[#25854d] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white">
                              Open
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" onClick={() => action("download")} className="inline-flex items-center gap-2 rounded-xl bg-[#25854d] px-4 py-2 text-xs font-bold text-white">
                      <ArrowDownToLine size={14} /> Download
                    </button>
                    <button type="button" onClick={() => action("print")} className="inline-flex items-center gap-2 rounded-xl border border-[#deece1] bg-[#f7faf8] px-4 py-2 text-xs font-bold text-[#173a28]">
                      <Printer size={14} /> Print
                    </button>
                  </div>
                </>
              ) : (
                <State title="No prescription selected" text="Choose a prescription from the list to review the active treatment plan." />
              )}
            </div>
          </section>
        )}

        {loading && (
          <div className="rounded-[28px] border border-[#deece1] bg-white p-8 text-center text-sm text-[#5d7067]">
            Loading prescriptions...
          </div>
        )}
      </main>
    </div>
  );
}
