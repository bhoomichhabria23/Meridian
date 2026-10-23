import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import Layout from '../../components/common/Layout'
import api from '../../api/axios'
import { PageLoader } from '../../components/common/UI'
import { Calendar, CalendarClock, Clock, User, Plus, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react'
import toast from 'react-hot-toast'

const LINKS = [
  { to: '/reception/dashboard', label: 'Dashboard', icon: '🏥' },
  { to: '/reception/patients', label: 'Patients', icon: '👥' },
  { to: '/reception/appointments', label: 'Appointments', icon: '📅' },
  { to: '/reception/doctors', label: 'Doctors', icon: '👨‍⚕️' },
  { to: '/reception/schedule', label: 'Schedule', icon: '📆' },
  { to: '/reception/profile', label: 'Profile', icon: '👤' },
]

export default function ReceptionAppointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [rescheduleTarget, setRescheduleTarget] = useState(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [savingReschedule, setSavingReschedule] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/appointments')
        const records = Array.isArray(res.data) ? res.data : res.data?.appointments || res.data?.data?.appointments || []
        setAppointments(records)
      } catch (err) {
        setError(err?.response?.data?.message || 'Unable to load appointment records.')
      } finally {
        setLoading(false)
      }
    }
    load()
    const refreshOnFocus = () => {
      if (!document.hidden) load()
    }
    window.addEventListener('focus', refreshOnFocus)
    return () => window.removeEventListener('focus', refreshOnFocus)
  }, [])

  useEffect(() => {
    const doctorId = rescheduleTarget?.doctorId?._id
    if (!doctorId || !rescheduleDate) {
      setAvailableSlots([])
      return
    }

    let active = true
    setLoadingSlots(true)
    api.get(`/api/doctors/${doctorId}/slots?date=${rescheduleDate}`)
      .then(response => { if (active) setAvailableSlots(response.data?.available || []) })
      .catch(() => { if (active) setAvailableSlots([]) })
      .finally(() => { if (active) setLoadingSlots(false) })

    return () => { active = false }
  }, [rescheduleTarget, rescheduleDate])

  const filteredAppointments = selectedStatus === 'all'
    ? appointments
    : appointments.filter(a => a.status === selectedStatus)

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-[#eaf7ed] text-[#25854d]'
      case 'pending':
        return 'bg-[#f4f8e8] text-[#738438]'
      case 'cancelled':
        return 'bg-[#eef3ef] text-[#718078]'
      case 'rescheduled':
        return 'bg-[#eaf2ff] text-[#3568a8]'
      case 'completed':
        return 'bg-[#edf5ef] text-[#4f7860]'
      default:
        return 'bg-[#f1f5f2] text-[#718078]'
    }
  }

  const handleConfirm = async (aptId) => {
    try {
      await api.put(`/api/appointments/${aptId}`, { status: 'confirmed' })
      setAppointments(current => current.map(item => item._id === aptId ? { ...item, status: 'confirmed' } : item))
      toast.success('Appointment approved and patient notified')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to approve appointment.')
    }
  }

  const handleCancel = async (aptId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await api.put(`/api/appointments/${aptId}`, { status: 'cancelled' })
        setAppointments(current => current.map(item => item._id === aptId ? { ...item, status: 'cancelled' } : item))
        toast.success('Appointment cancelled and patient notified')
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Unable to cancel appointment.')
      }
    }
  }

  const openReschedule = (appointment) => {
    const date = appointment.date ? format(new Date(appointment.date), 'yyyy-MM-dd') : ''
    setRescheduleTarget(appointment)
    setRescheduleDate(date)
    setRescheduleTime('')
  }

  const handleReschedule = async (event) => {
    event.preventDefault()
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) {
      toast.error('Select a new date and available time.')
      return
    }

    setSavingReschedule(true)
    try {
      const response = await api.put(`/api/appointments/${rescheduleTarget._id}`, {
        date: rescheduleDate,
        timeSlot: rescheduleTime,
        status: 'rescheduled',
      })
      setAppointments(current => current.map(item => item._id === rescheduleTarget._id ? { ...item, ...response.data } : item))
      setRescheduleTarget(null)
      toast.success('Appointment rescheduled and patient notified')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to reschedule appointment.')
    } finally {
      setSavingReschedule(false)
    }
  }

  if (loading) return <Layout links={LINKS}><PageLoader /></Layout>

  return (
    <Layout links={LINKS}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-5 rounded-[28px] border border-[#d5ebdc] bg-gradient-to-br from-white via-white to-[#eaf7ed] p-6 shadow-[0_16px_45px_rgba(31,105,59,0.08)] md:flex-row md:items-end md:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#25854d]">Care coordination</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#183a28] md:text-4xl">Appointments</h1>
            <p className="mt-2 text-sm text-[#647b6d]">Review, approve, and coordinate patient visits.</p>
          </div>
          <button
            onClick={() => navigate('/reception/appointments/new')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#25854d] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,133,77,0.2)] transition hover:bg-[#176b3d]"
          >
            <Plus className="h-5 w-5" />
            New Appointment
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-[#cfe5d5] bg-[#f1f8f3] p-4 text-sm font-medium text-[#3f6b4d]">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2 rounded-2xl border border-[#dfeee3] bg-white p-4 shadow-sm">
          {['all', 'pending', 'confirmed', 'rescheduled', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`rounded-xl px-4 py-2.5 text-xs font-bold capitalize transition ${
                selectedStatus === status
                  ? 'bg-[#25854d] text-white shadow-sm'
                  : 'border border-[#dfeee3] bg-[#f8fcf9] text-[#587064] hover:border-[#9fcfb0] hover:bg-[#eef8f1]'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {filteredAppointments.length > 0 ? (
          <div className="space-y-5">
            {filteredAppointments.map((apt) => (
              <article key={apt._id} className="rounded-[24px] border border-[#dfeee3] bg-white p-5 shadow-[0_10px_30px_rgba(31,105,59,0.05)] transition hover:-translate-y-0.5 hover:border-[#9fcfb0] hover:shadow-[0_18px_42px_rgba(31,105,59,0.1)] md:p-6">
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eaf7ed] text-[#25854d]"><User className="h-6 w-6" /></div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black text-[#183a28]">Patient record</h3>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${getStatusColor(apt.status)}`}>
                          {apt.status || 'pending'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#315343]">{apt.patientId?.userId?.name || apt.patientId?.name || 'Registered patient'}</p>
                      <p className="mt-1 text-xs text-[#819087]">{apt.patientId?.patientCode || apt.patientId?.userId?.email || 'Registered patient'}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#62776d]">
                        <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-[#25854d]" />{apt.date ? format(new Date(apt.date), 'dd MMM yyyy') : 'Date not set'}</span>
                        <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-[#25854d]" />{apt.timeSlot || 'Time not specified'}</span>
                        <span className="font-semibold text-[#3f6b4d]">Doctor: {apt.doctorId?.userId?.name || apt.doctorId?.name || 'Not assigned'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {(apt.chiefComplaint || apt.notes) && (
                  <div className="mt-5 rounded-2xl bg-[#f7fbf8] p-4 text-sm leading-6 text-[#62776d]">
                    {apt.chiefComplaint && <p><span className="font-bold text-[#315343]">Reason:</span> {apt.chiefComplaint}</p>}
                    {apt.notes && <p className="mt-1"><span className="font-bold text-[#315343]">Notes:</span> {apt.notes}</p>}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2 border-t border-[#edf3ee] pt-4">
                  {apt.status === 'pending' && (
                      <button
                        onClick={() => handleConfirm(apt._id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#25854d] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#176b3d]"
                      >
                        <CheckCircle2 size={15} />
                        Confirm
                      </button>
                  )}
                  {['pending', 'confirmed', 'rescheduled'].includes(apt.status) && (
                    <>
                      <button
                        onClick={() => openReschedule(apt)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#b9d3ea] bg-[#f4f8fd] px-4 py-2.5 text-xs font-bold text-[#3568a8] transition hover:bg-[#eaf2ff]"
                      >
                        <CalendarClock size={15} />
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleCancel(apt._id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#efd2cf] bg-[#fff7f6] px-4 py-2.5 text-xs font-bold text-[#a64d46] transition hover:bg-[#fff0ee]"
                      >
                        <XCircle size={15} />
                        Cancel appointment
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => navigate(`/reception/patients/${apt.patientId?._id || apt.patientId?.userId?._id || apt.patientId}`)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#b9dac2] bg-white px-4 py-2.5 text-xs font-bold text-[#25854d] transition hover:bg-[#f1f8f3]"
                  >
                    View Patient <ArrowUpRight size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#cfe5d5] bg-white p-12 text-center shadow-sm">
            <Calendar className="mx-auto h-12 w-12 text-[#78aa86]" />
            <h2 className="mt-4 text-xl font-black text-[#183a28]">No appointments found</h2>
            <p className="mt-2 text-sm text-[#71857a]">No {selectedStatus === 'all' ? '' : selectedStatus} appointments match this view.</p>
          </div>
        )}

        {rescheduleTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173a28]/35 p-4 backdrop-blur-sm">
            <form onSubmit={handleReschedule} className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-[#edf3ee] p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-[#25854d]">Appointment update</p>
                <h2 className="mt-1 text-xl font-bold text-[#183a28]">Reschedule appointment</h2>
                <p className="mt-1 text-sm text-[#71857a]">{rescheduleTarget.patientId?.userId?.name || rescheduleTarget.patientId?.name || 'Patient'} with Dr. {rescheduleTarget.doctorId?.userId?.name || rescheduleTarget.doctorId?.name || 'Doctor'}</p>
              </div>
              <div className="space-y-5 p-6">
                <label className="block text-xs font-bold text-[#527261]">New date
                  <input required type="date" min={new Date().toISOString().split('T')[0]} value={rescheduleDate} onChange={event => { setRescheduleDate(event.target.value); setRescheduleTime('') }} className="mt-2 h-11 w-full rounded-xl border border-[#dcece1] bg-white px-3 text-sm text-[#183a28] outline-none focus:border-[#69b47e] focus:ring-2 focus:ring-[#e3f3e7]" />
                </label>
                <div>
                  <p className="text-xs font-bold text-[#527261]">Available times</p>
                  {loadingSlots ? <p className="mt-2 text-sm text-[#819087]">Loading available times...</p> : availableSlots.length ? <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">{availableSlots.map(slot => <button key={slot} type="button" onClick={() => setRescheduleTime(slot)} className={`min-h-10 rounded-lg border px-2 text-sm font-semibold transition ${rescheduleTime === slot ? 'border-[#25854d] bg-[#25854d] text-white' : 'border-[#dcece1] text-[#527261] hover:border-[#78bd8a] hover:bg-[#f1f8f3]'}`}>{slot}</button>)}</div> : <p className="mt-2 rounded-lg bg-[#f7fbf8] px-3 py-2 text-xs text-[#819087]">No available times for this date. Choose another date.</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#edf3ee] p-5">
                <button type="button" onClick={() => setRescheduleTarget(null)} className="rounded-xl border border-[#dcece1] px-4 py-2.5 text-xs font-bold text-[#527261]">Keep current appointment</button>
                <button type="submit" disabled={savingReschedule || loadingSlots || !rescheduleTime} className="rounded-xl bg-[#25854d] px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{savingReschedule ? 'Saving...' : 'Confirm reschedule'}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  )
}
