import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CalendarRange, ClipboardPlus, FileText, Pill, Plus, Save, ShieldCheck, Trash2, Upload } from 'lucide-react';
import Layout from '../../components/common/Layout';
import { PageSpinner } from '../../components/common/Spinner';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const LINKS = [{ to: '/doctor/dashboard', label: 'Dashboard', icon: '🏠' }];

const SEVERITY_STYLE = {
  safe: { badge: 'inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700', icon: '✅', label: 'Safe' },
  caution: { badge: 'inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700', icon: '⚠️', label: 'Caution' },
  danger: { badge: 'inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-red-700', icon: '🚫', label: 'Danger — do not proceed' },
  unknown: { badge: 'inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700', icon: '❓', label: 'Unknown' },
};

function DrugRow({ drug, patientId, onRemove, onChange }) {
  const [checking, setChecking] = useState(false);
  const [severity, setSeverity] = useState(null);
  const [detail, setDetail] = useState('');
  const [ackReason, setAckReason] = useState('');

  const checkInteraction = useCallback(async (name) => {
    if (!name || !patientId) return;
    setChecking(true);
    try {
      const res = await api.post('/api/safety/medication-review', { drugName: name, patientId });
      setSeverity(res.data.severity);
      setDetail(res.data.detail);
    } catch (error) {
      setSeverity('unknown');
      setDetail(error.response?.data?.message || 'AI medication review is unavailable. Verify with an authoritative clinical checker.');
    } finally {
      setChecking(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!drug.name) return undefined;
    const timer = setTimeout(() => checkInteraction(drug.name), 600);
    return () => clearTimeout(timer);
  }, [checkInteraction, drug.name]);

  const style = severity ? SEVERITY_STYLE[severity] : null;

  return (
    <div className="rounded-[24px] border border-[#dfeee3] bg-gradient-to-br from-white to-[#f4fbf6] p-4 shadow-[0_8px_24px_rgba(27,98,52,0.05)]">
      <div className="grid gap-3 md:grid-cols-5">
        <input className="h-11 rounded-2xl border border-[#dfeee3] bg-white px-3 text-sm text-[#183a28] outline-none focus:border-[#1aa65c] md:col-span-2" placeholder="Drug name" value={drug.name} onChange={(event) => onChange('name', event.target.value)} />
        <input className="h-11 rounded-2xl border border-[#dfeee3] bg-white px-3 text-sm text-[#183a28] outline-none focus:border-[#1aa65c]" placeholder="Dose" value={drug.dose} onChange={(event) => onChange('dose', event.target.value)} />
        <input className="h-11 rounded-2xl border border-[#dfeee3] bg-white px-3 text-sm text-[#183a28] outline-none focus:border-[#1aa65c]" placeholder="Frequency" value={drug.frequency} onChange={(event) => onChange('frequency', event.target.value)} />
        <input className="h-11 rounded-2xl border border-[#dfeee3] bg-white px-3 text-sm text-[#183a28] outline-none focus:border-[#1aa65c]" placeholder="Duration" value={drug.duration} onChange={(event) => onChange('duration', event.target.value)} />
      </div>

      <div className="mt-3">
        <input className="h-11 w-full rounded-2xl border border-[#dfeee3] bg-white px-3 text-sm text-[#183a28] outline-none focus:border-[#1aa65c]" placeholder="Instructions (optional)" value={drug.instructions} onChange={(event) => onChange('instructions', event.target.value)} />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-h-[48px] flex-1">
          {checking && <span className="text-xs font-medium text-[#67806d]">Checking interactions...</span>}
          {!checking && style && (
            <div>
              <span className={style.badge}>{style.icon} {style.label}</span>
              {detail && <p className="mt-2 text-xs leading-5 text-[#6a7d71]">{detail}</p>}
              {severity === 'danger' && (
                <input className="mt-2 h-10 w-full rounded-xl border border-red-200 bg-red-50 px-3 text-xs text-[#183a28] outline-none focus:border-red-300" placeholder="Clinical reason to override" value={ackReason} onChange={(event) => setAckReason(event.target.value)} />
              )}
            </div>
          )}
        </div>

        <button type="button" onClick={onRemove} className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-bold text-red-600 hover:bg-red-100">
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
    </div>
  );
}

export default function NewPrescription() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const patientId = id || searchParams.get('patientId');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [form, setForm] = useState({
    diagnosis: '',
    notes: '',
    validUntil: '',
    medications: [{ name: '', dose: '', frequency: '', duration: '', instructions: '' }],
  });

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    Promise.all([api.get(`/api/patients/${patientId}`)])
      .then(([p]) => setPatient(p.data))
      .catch(() => toast.error('Failed to load prescription form'))
      .finally(() => setLoading(false));
  }, [patientId, user]);

  const addMed = () => {
    setForm((current) => ({ ...current, medications: [...current.medications, { name: '', dose: '', frequency: '', duration: '', instructions: '' }] }));
  };

  const updateMed = (index, field, value) => {
    setForm((current) => {
      const medications = [...current.medications];
      medications[index] = { ...medications[index], [field]: value };
      return { ...current, medications };
    });
  };

  const removeMed = (index) => {
    setForm((current) => ({
      ...current,
      medications: current.medications.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSave = async () => {
    if (!form.diagnosis) return toast.error('Diagnosis is required');
    if (form.medications.some((medication) => !medication.name)) return toast.error('All medication names are required');

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('patientId', patientId);
      payload.append('diagnosis', form.diagnosis);
      payload.append('notes', form.notes);
      payload.append('validUntil', form.validUntil || '');
      payload.append('medications', JSON.stringify(form.medications));
      attachments.forEach((file) => payload.append('attachments', file));

      const response = await api.post('/api/prescriptions', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data) {
        toast.success('Prescription created successfully');
        navigate('/doctor/prescriptions');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout links={LINKS}><PageSpinner /></Layout>;

  return (
    <Layout links={LINKS}>
      <div className="mx-auto max-w-7xl pb-8">
        <button onClick={() => navigate(patientId ? `/doctor/patients/${patientId}` : '/doctor/patients')} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#597266] transition hover:text-[#183a28]">
          <ArrowLeft className="h-4 w-4" /> Back to patient
        </button>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-[30px] border border-[#d7efe0] bg-gradient-to-br from-[#f4fbf6] via-white to-[#e5f5ea] p-6 shadow-[0_18px_50px_rgba(27,98,52,0.08)] md:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Clinical workspace</p>
              <h1 className="mt-3 text-3xl font-black text-emerald-950 md:text-4xl">New prescription</h1>
              <p className="mt-2 text-sm text-emerald-900/70">Build a clear, safe treatment plan for {patient?.userId?.name || patient?.name || 'this patient'}.</p>
            </div>

            <div className="rounded-[30px] border border-[#dfeee3] bg-white p-5 shadow-[0_12px_40px_rgba(27,98,52,0.07)] md:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf7ed] text-[#159447]">
                  <ClipboardPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5c7868]">Care plan</p>
                  <h2 className="text-xl font-black text-[#183a28]">Treatment overview</h2>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#183a28]">Diagnosis</label>
                  <input className="h-12 w-full rounded-2xl border border-[#dfeee3] bg-[#f7fbf8] px-4 text-sm text-[#183a28] outline-none transition focus:border-[#1aa65c]" placeholder="Enter diagnosis" value={form.diagnosis} onChange={(event) => setForm((current) => ({ ...current, diagnosis: event.target.value }))} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#183a28]">Additional notes</label>
                  <textarea className="min-h-[120px] w-full rounded-2xl border border-[#dfeee3] bg-[#f7fbf8] px-4 py-3 text-sm text-[#183a28] outline-none transition focus:border-[#1aa65c]" placeholder="Add monitoring, instructions, follow-up guidance..." value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#183a28]">Valid until</label>
                    <div className="relative">
                      <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a7d71]" />
                      <input type="date" className="h-12 w-full rounded-2xl border border-[#dfeee3] bg-[#f7fbf8] pl-10 pr-4 text-sm text-[#183a28] outline-none transition focus:border-[#1aa65c]" value={form.validUntil} onChange={(event) => setForm((current) => ({ ...current, validUntil: event.target.value }))} />
                    </div>
                  </div>
                  <div className="hidden md:block" aria-hidden="true" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#183a28]">Prescription files</label>
                  <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#b8d8c1] bg-[#f7fbf8] text-sm font-bold text-[#1d6b3f] transition hover:border-[#78b98e] hover:bg-[#edf9f1]">
                    <Upload className="h-4 w-4" /> Attach text, PDF, or image files
                    <input type="file" multiple accept=".txt,.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" className="hidden" onChange={(event) => setAttachments(Array.from(event.target.files))} />
                  </label>
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-2xl border border-[#dfeee3] bg-[#f9fcfa] px-3 py-2 text-xs text-[#183a28]">
                          <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-[#159447]" /> {file.name}</span>
                          <button type="button" onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="font-bold text-red-600">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#dfeee3] bg-white p-5 shadow-[0_12px_40px_rgba(27,98,52,0.07)] md:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf7ed] text-[#159447]">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5c7868]">Medication list</p>
                    <h2 className="text-xl font-black text-[#183a28]">Clinical regimen</h2>
                  </div>
                </div>
                <button type="button" onClick={addMed} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#eaf7ed] px-3 text-xs font-bold text-[#159447] transition hover:bg-[#d9f1df]">
                  <Plus className="h-4 w-4" /> Add medication
                </button>
              </div>

              <div className="space-y-4">
                {form.medications.map((medication, index) => (
                  <DrugRow
                    key={index}
                    drug={medication}
                    patientId={patientId}
                    onRemove={() => removeMed(index)}
                    onChange={(field, value) => updateMed(index, field, value)}
                  />
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[30px] border border-[#dfeee3] bg-white p-5 shadow-[0_12px_40px_rgba(27,98,52,0.07)] md:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf7ed] text-[#159447]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5c7868]">Safety check</p>
                  <h3 className="text-xl font-black text-[#183a28]">Medication review</h3>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl bg-[#f7fbf8] p-4 text-sm text-[#64756b]">
                <p>Clinical safety checks will review drug interactions, duplications, doses, and contraindications before finalizing treatment.</p>
                <p className="font-bold text-[#183a28]">Prescriber notes:</p>
                <p>Confirm the patient’s allergies and renal/hepatic status before final approval.</p>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#dfeee3] bg-white p-5 shadow-[0_12px_40px_rgba(27,98,52,0.07)] md:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf7ed] text-[#159447]">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5c7868]">Clinical summary</p>
                  <h3 className="text-xl font-black text-[#183a28]">Patient snapshot</h3>
                </div>
              </div>

              <div className="space-y-3 text-sm text-[#64756b]">
                <p><span className="font-bold text-[#183a28]">Patient:</span> {patient?.userId?.name || patient?.name || 'Unknown'}</p>
                <p><span className="font-bold text-[#183a28]">Condition:</span> {form.diagnosis || 'Diagnosis pending'}</p>
                <p><span className="font-bold text-[#183a28]">Medications:</span> {form.medications.filter((med) => med.name.trim()).length || 0} added</p>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#dfeee3] bg-white p-5 shadow-[0_12px_40px_rgba(27,98,52,0.07)] md:p-6">
              <button type="button" onClick={handleSave} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#159447] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_26px_rgba(21,148,71,0.22)] transition hover:bg-[#11853d] disabled:cursor-not-allowed disabled:opacity-60">
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save prescription'}
              </button>
              <button type="button" onClick={() => navigate(patientId ? `/doctor/patients/${patientId}` : '/doctor/patients')} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#dfeee3] bg-[#f9fcfa] px-4 py-3 text-sm font-bold text-[#183a28]">Cancel</button>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
