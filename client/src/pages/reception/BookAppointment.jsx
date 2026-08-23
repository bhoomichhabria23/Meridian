import React, { useState, useEffect } from 'react'
import Layout from '../../components/common/Layout'
import api from '../../api/axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

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
    doctorId:       '',
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
    !search || p.userId?.name?.toLowerCase().includes(search.toLowerCase())
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

  return (
    <Layout links={LINKS}>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-light text-gray-900">Book Appointment</h1>
        <p className="text-gray-500 mt-1 text-sm">Schedule a new patient appointment</p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Patient selection */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">Select Patient</h2>
            <input className="input text-sm mb-3" placeholder="Search patient by name..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-2">
              {filteredPatients.slice(0, 20).map(p => (
                <div key={p._id}
                  onClick={() => setForm(f => ({ ...f, patientId: p._id }))}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                    form.patientId === p._id ? 'bg-green-600 text-white' : 'hover:bg-gray-50'
                  }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    form.patientId === p._id ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
                  }`}>
                    {p.userId?.name?.[0]}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${form.patientId === p._id ? 'text-white' : 'text-gray-800'}`}>
                      {p.userId?.name}
                    </p>
                    <p className={`text-xs ${form.patientId === p._id ? 'text-green-100' : 'text-gray-400'}`}>
                      {p.bloodGroup} · {p.gender}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor + date + slot */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-800">Appointment Details</h2>

            <div>
              <label className="label">Doctor</label>
              <select className="input text-sm" value={form.doctorId}
                onChange={e => setForm(f => ({ ...f, doctorId: e.target.value, timeSlot: '' }))}>
                <option value="">Select a doctor</option>
                {doctors.map(d => (
                  <option key={d._id} value={d._id}>
                    Dr. {d.userId?.name} — {d.specialty}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Date</label>
              <input type="date" className="input text-sm"
                min={new Date().toISOString().split('T')[0]}
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value, timeSlot: '' }))} />
            </div>

            {slots.length > 0 && (
              <div>
                <label className="label">Available Slots</label>
                <div className="grid grid-cols-5 gap-2">
                  {slots.map(s => (
                    <button type="button" key={s}
                      onClick={() => setForm(f => ({ ...f, timeSlot: s }))}
                      className={`py-2 rounded-xl text-sm font-medium transition-all border ${
                        form.timeSlot === s
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="label">Chief Complaint</label>
              <input className="input text-sm" placeholder="Reason for visit"
                value={form.chiefComplaint}
                onChange={e => setForm(f => ({ ...f, chiefComplaint: e.target.value }))} />
            </div>

            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="input text-sm min-h-16 resize-none" placeholder="Any additional notes"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>

          {/* Summary */}
          {form.patientId && form.doctorId && form.timeSlot && (
            <div className="card border-green-200 bg-green-50">
              <h3 className="font-semibold text-green-800 mb-2">Booking Summary</h3>
              <p className="text-sm text-green-700">Patient: <strong>{selectedPatient?.userId?.name}</strong></p>
              <p className="text-sm text-green-700">Doctor: <strong>Dr. {selectedDoctor?.userId?.name}</strong></p>
              <p className="text-sm text-green-700">Date & Time: <strong>{form.date} at {form.timeSlot}</strong></p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Booking...' : '✅ Confirm Booking'}
            </button>
            <button type="button" onClick={() => navigate('/reception/dashboard')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
