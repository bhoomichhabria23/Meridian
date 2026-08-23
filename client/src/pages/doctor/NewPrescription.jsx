import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import { PageSpinner } from '../../components/common/Spinner'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const LINKS = [{ to: '/doctor/dashboard', label: 'Dashboard', icon: '🏠' }]

const SEVERITY_STYLE = {
  safe:    { badge: 'badge-green',  icon: '✅', label: 'Safe' },
  caution: { badge: 'badge-yellow', icon: '⚠️', label: 'Caution' },
  danger:  { badge: 'badge-red',    icon: '🚫', label: 'Danger — do not proceed' },
  unknown: { badge: 'badge-gray',   icon: '❓', label: 'Unknown' },
}

function DrugRow({ drug, patientId, onRemove, onChange }) {
  const [checking, setChecking]   = useState(false)
  const [severity, setSeverity]   = useState(null)
  const [detail, setDetail]       = useState('')
  const [ackReason, setAckReason] = useState('')

  const checkInteraction = useCallback(async (name) => {
    if (!name || !patientId) return
    setChecking(true)
    try {
      const res = await api.post('/api/drugs/interactions', { drugName: name, patientId })
      setSeverity(res.data.severity)
      setDetail(res.data.detail)
    } catch { setSeverity(null) }
    finally { setChecking(false) }
  }, [patientId])

  useEffect(() => {
    if (!drug.name) return
    const t = setTimeout(() => checkInteraction(drug.name), 600)
    return () => clearTimeout(t)
  }, [drug.name])

  const style = severity ? SEVERITY_STYLE[severity] : null

  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 p-5 shadow-[0_8px_24px_rgba(27,98,52,0.05)] space-y-3">
      <div className="grid grid-cols-5 gap-2">
        <input className="input col-span-2 text-sm" placeholder="Drug name"
          value={drug.name} onChange={e => onChange('name', e.target.value)} />
        <input className="input text-sm" placeholder="Dose e.g. 500mg"
          value={drug.dose} onChange={e => onChange('dose', e.target.value)} />
        <input className="input text-sm" placeholder="Frequency"
          value={drug.frequency} onChange={e => onChange('frequency', e.target.value)} />
        <input className="input text-sm" placeholder="Duration"
          value={drug.duration} onChange={e => onChange('duration', e.target.value)} />
      </div>
      <input className="input text-sm" placeholder="Instructions (optional)"
        value={drug.instructions} onChange={e => onChange('instructions', e.target.value)} />

      {/* Interaction result */}
      <div className="flex items-start gap-2">
        {checking && <span className="text-xs text-gray-400 animate-pulse">Checking interactions...</span>}
        {!checking && style && (
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={style.badge}>{style.icon} {style.label}</span>
            </div>
            {detail && <p className="text-xs text-gray-500 mt-1">{detail}</p>}
            {severity === 'danger' && (
              <input className="input text-xs mt-2" placeholder="Clinical reason to override (required)"
                value={ackReason} onChange={e => setAckReason(e.target.value)} />
            )}
          </div>
        )}
        <button type="button" onClick={onRemove} className="ml-auto rounded-lg px-2 py-1 text-xs font-bold text-red-400 hover:bg-red-50 hover:text-red-600">Remove</button>
      </div>
    </div>
  )
}

export default function NewPrescription() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({
    diagnosis: '',
    notes:     '',
    validUntil: '',
    medications: [{ name:'', dose:'', frequency:'', duration:'', instructions:'' }]
  })
  const [interactions, setInteractions] = useState([])

  useEffect(() => {
    Promise.all([
      api.get(`/api/patients/${id}`),
    ]).then(([p]) => {
      setPatient(p.data)
    }).catch(() => toast.error('Failed to load prescription form')).finally(() => setLoading(false))
  }, [id, user])

  function addMed() {
    setForm(f => ({ ...f, medications: [...f.medications, { name:'', dose:'', frequency:'', duration:'', instructions:'' }] }))
  }

  function updateMed(index, field, value) {
    setForm(f => {
      const meds = [...f.medications]
      meds[index] = { ...meds[index], [field]: value }
      return { ...f, medications: meds }
    })
  }

  function removeMed(index) {
    setForm(f => ({ ...f, medications: f.medications.filter((_, i) => i !== index) }))
  }

  async function handleSave() {
    if (!form.diagnosis) return toast.error('Diagnosis is required')
    if (form.medications.some(m => !m.name)) return toast.error('All medication names are required')
    setSaving(true)
    try {
      await api.post('/api/prescriptions', {
        patientId:  id,
        diagnosis:  form.diagnosis,
        medications: form.medications,
        notes:      form.notes,
        validUntil: form.validUntil || undefined,
        interactionWarnings: interactions
      })
      toast.success('Prescription saved!')
      navigate(`/doctor/patient/${id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save prescription')
    } finally { setSaving(false) }
  }

  if (loading) return <Layout links={LINKS}><PageSpinner /></Layout>

  return (
    <Layout links={LINKS}>
      <button onClick={() => navigate(`/doctor/patient/${id}`)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-700 mb-6 transition-colors">
        ← Back to patient
      </button>

      <div className="max-w-3xl">
        <div className="mb-8 rounded-3xl border border-emerald-100 bg-gradient-to-br from-[#f4fbf6] via-white to-[#e5f5ea] p-7 shadow-[0_18px_50px_rgba(27,98,52,0.08)]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Clinical workspace</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950">New prescription</h1>
          <p className="mt-2 text-sm text-emerald-900/60">Build a clear, safe treatment plan for {patient?.userId?.name || 'this patient'}.</p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_12px_40px_rgba(27,98,52,0.07)] space-y-6">
          <div>
            <label className="label text-emerald-950">Diagnosis</label>
            <input className="input border-emerald-100 focus:border-emerald-500" placeholder="Enter diagnosis"
              value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0 text-emerald-950">Medications</label>
              <button type="button" onClick={addMed} className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50">+ Add medication</button>
            </div>
            <div className="space-y-3">
              {form.medications.map((med, i) => (
                <DrugRow
                  key={i}
                  drug={med}
                  patientId={id}
                  onChange={(field, val) => updateMed(i, field, val)}
                  onRemove={() => removeMed(i)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="label text-emerald-950">Additional Notes</label>
            <textarea className="input min-h-20 resize-none" placeholder="Any additional notes..."
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div>
            <label className="label text-emerald-950">Valid Until (optional)</label>
            <input type="date" className="input"
              value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 rounded-xl bg-emerald-700 hover:bg-emerald-800">
              {saving ? 'Saving prescription...' : 'Save prescription'}
            </button>
            <button onClick={() => navigate(`/doctor/patient/${id}`)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
