import React, { useState, useEffect } from 'react'
import Layout from '../../components/common/Layout'
import api from '../../api/axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarDays, Check, Clock3, FileText, Search, Stethoscope, UserRound } from 'lucide-react'

const LINKS = [
  { to: '/reception/dashboard', label: 'Dashboard',        icon: '🏠' },
  { to: '/reception/book',      label: 'Book Appointment', icon: '📅' },
  { to: '/reception/upload',    label: 'Upload Report',    icon: '📤' },
]

export default function ReceptionBook() {
  const navigate         = useNavigate()
  const [params]         = useSearchParams()
  const [patients, setPatients]   = useState([])
  const [doctors, setDoctors]     = useState([])
  const [slots, setSlots]         = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [form, setForm] = useState({
    patientId:      params.get('patientId') || '',
    doctorId:       params.get('doctor') || '',
    date:           '',
    timeSlot:       '',
    chiefComplaint: '',
    notes:          '',
    bookedVia:      'reception'
  })

  useEffect(() => {
    Promise.all([
      api.get('/api/patients'),
      api.get('/api/doctors'),
    ]).then(([p, d]) => {
      setPatients(p.data)
      setDoctors(d.data)
    }).catch(() => toast.error('Failed to load booking data'))
  }, [])

  useEffect(() => {
    if (!form.doctorId || !form.date) { setSlots([]); return }
    api.get(`/api/doctors/${form.doctorId}/slots?date=${form.date}`)
      .then(r => setSlots(r.data.available || []))
      .catch(() => setSlots([]))
  }, [form.doctorId, form.date])

  const filteredPatients = patients.filter(p =>
    p.userId?.role === 'patient' && (!search || p.userId?.name?.toLowerCase().includes(search.toLowerCase()))
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.patientId || !form.doctorId || !form.date || !form.timeSlot) {
      return toast.error('Please fill all required fields')
    }
    setLoading(true)
    try {
      await api.post('/api/appointments', form)
      toast.success('Appointment booked successfully!')
      navigate('/reception/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment')
    } finally { setLoading(false) }
  }

  const selectedPatient = patients.find(p => p._id === form.patientId)
  const selectedDoctor  = doctors.find(d => d._id === form.doctorId)

  const fieldClass = 'mt-2 h-11 w-full rounded-xl border border-[#dcece1] bg-white px-3 text-sm text-[#183a28] outline-none transition focus:border-[#69b47e] focus:ring-2 focus:ring-[#e3f3e7]'
  const labelClass = 'text-xs font-bold text-[#527261]'

  return (
    <Layout links={LINKS}>
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-5 rounded-2xl border border-[#d5ebdc] bg-gradient-to-br from-white via-white to-[#edf9f0] p-6 shadow-[0_12px_40px_rgba(31,105,59,0.07)] sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#25854d]">Care coordination</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#183a28]">Book appointment</h1>
            <p className="mt-2 text-sm text-[#6c8174]">Select a patient, doctor, and available time.</p>
          </div>
          <button type="button" onClick={() => navigate('/reception/appointments')} className="rounded-xl border border-[#b9dac2] bg-white px-4 py-2.5 text-sm font-bold text-[#25854d] transition hover:bg-[#f1f8f3]">Back to appointments</button>
        </header>

        <form onSubmit={handleSubmit} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
          <section className="rounded-2xl border border-[#dcece1] bg-white p-5 shadow-[0_8px_28px_rgba(31,105,59,0.05)] sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf7ed] text-[#25854d]"><UserRound size={19} /></span>
              <div><p className="text-xs font-bold uppercase tracking-wide text-[#25854d]">Step 1</p><h2 className="text-lg font-bold text-[#183a28]">Select patient</h2></div>
            </div>
            <label className="mt-5 flex h-11 items-center gap-2 rounded-xl border border-[#dcece1] px-3 text-[#819087] focus-within:border-[#69b47e]">
              <Search size={16} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients by name" className="w-full bg-transparent text-sm text-[#183a28] outline-none placeholder:text-[#9aaa9f]" />
            </label>
            <div className="mt-3 max-h-[390px] space-y-2 overflow-y-auto pr-1">
              {filteredPatients.length ? filteredPatients.slice(0, 50).map(p => {
                const patientName = p.userId?.name || p.name || 'Registered patient'
                const isSelected = form.patientId === p._id
                return <button key={p._id} type="button" onClick={() => setForm(current => ({ ...current, patientId: p._id }))} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${isSelected ? 'border-[#78bd8a] bg-[#f0f9f2]' : 'border-[#edf3ee] hover:border-[#b9dac2] hover:bg-[#fbfefb]'}`}>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isSelected ? 'bg-[#25854d] text-white' : 'bg-[#eaf7ed] text-[#25854d]'}`}>{patientName.slice(0, 1).toUpperCase()}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-[#183a28]">{patientName}</span><span className="mt-0.5 block text-xs text-[#819087]">{[p.bloodGroup, p.gender].filter(Boolean).join(' · ') || p.userId?.email || 'Patient'}</span></span>
                  {isSelected && <Check size={17} className="shrink-0 text-[#25854d]" />}
                </button>
              }) : <div className="rounded-xl bg-[#f7fbf8] px-4 py-8 text-center text-sm text-[#819087]">No patients match this search.</div>}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-[#dcece1] bg-white p-5 shadow-[0_8px_28px_rgba(31,105,59,0.05)] sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf7ed] text-[#25854d]"><CalendarDays size={19} /></span>
                <div><p className="text-xs font-bold uppercase tracking-wide text-[#25854d]">Step 2</p><h2 className="text-lg font-bold text-[#183a28]">Appointment details</h2></div>
              </div>
              <div className="mt-5 space-y-4">
                <label className="block"><span className={labelClass}>Doctor <span className="text-[#c55b4f]">*</span></span>
                  <select required className={fieldClass} value={form.doctorId} onChange={e => setForm(current => ({ ...current, doctorId: e.target.value, timeSlot: '' }))}>
                    <option value="">Select a doctor</option>
                    {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.userId?.name || d.name || 'Doctor'}{d.specialty || d.specialization || d.userId?.specialization ? ` · ${d.specialty || d.specialization || d.userId?.specialization}` : ''}</option>)}
                  </select>
                </label>
                <label className="block"><span className={labelClass}>Date <span className="text-[#c55b4f">*</span></span>
                  <input required type="date" className={fieldClass} min={new Date().toISOString().split('T')[0]} value={form.date} onChange={e => setForm(current => ({ ...current, date: e.target.value, timeSlot: '' }))} />
                </label>
                {form.doctorId && form.date && <div>
                  <p className={labelClass}>Available times <span className="text-[#c55b4f">*</span></p>
                  {slots.length ? <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">{slots.map(slot => <button type="button" key={slot} onClick={() => setForm(current => ({ ...current, timeSlot: slot }))} className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-2 text-sm font-semibold transition ${form.timeSlot === slot ? 'border-[#25854d] bg-[#25854d] text-white' : 'border-[#dcece1] text-[#527261] hover:border-[#78bd8a] hover:bg-[#f1f8f3]'}`}><Clock3 size={14} />{slot}</button>)}</div> : <p className="mt-2 rounded-lg bg-[#f7fbf8] px-3 py-2 text-xs text-[#819087]">No available times for this date.</p>}
                </div>}
                <label className="block"><span className={labelClass}>Reason for visit</span><input className={fieldClass} placeholder="Briefly describe the reason" value={form.chiefComplaint} onChange={e => setForm(current => ({ ...current, chiefComplaint: e.target.value }))} /></label>
                <label className="block"><span className={labelClass}>Notes <span className="font-normal text-[#819087]">(optional)</span></span><textarea className="mt-2 min-h-24 w-full resize-y rounded-xl border border-[#dcece1] bg-white px-3 py-2.5 text-sm text-[#183a28] outline-none transition placeholder:text-[#9aaa9f] focus:border-[#69b47e] focus:ring-2 focus:ring-[#e3f3e7]" placeholder="Additional information for the clinic" value={form.notes} onChange={e => setForm(current => ({ ...current, notes: e.target.value }))} /></label>
              </div>
            </section>

            {form.patientId && form.doctorId && form.timeSlot && <section className="rounded-2xl border border-[#cfe5d5] bg-[#f1f8f3] p-5">
              <div className="flex items-center gap-2 text-[#25854d]"><FileText size={17} /><h2 className="text-sm font-bold">Booking summary</h2></div>
              <p className="mt-3 text-sm text-[#527261]">Patient: <strong className="text-[#183a28]">{selectedPatient?.userId?.name || selectedPatient?.name}</strong></p>
              <p className="mt-1 text-sm text-[#527261]">Doctor: <strong className="text-[#183a28]">Dr. {selectedDoctor?.userId?.name || selectedDoctor?.name}</strong></p>
              <p className="mt-1 text-sm text-[#527261]">Date and time: <strong className="text-[#183a28]">{form.date} at {form.timeSlot}</strong></p>
            </section>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => navigate('/reception/dashboard')} className="rounded-xl border border-[#dcece1] bg-white px-5 py-3 text-sm font-bold text-[#527261] transition hover:bg-[#f7fbf8]">Cancel</button>
              <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25854d] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(37,133,77,0.18)] transition hover:bg-[#176b3d] disabled:cursor-not-allowed disabled:opacity-60"><Check size={17} />{loading ? 'Booking...' : 'Confirm booking'}</button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}
