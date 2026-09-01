import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import Layout from '../../components/common/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Empty, PageLoader, StatCard, StatusBadge } from '../../components/common/UI'

const LINKS = [
  { to: '/doctor/dashboard', label: 'Dashboard', icon: '🏥' },
  { to: '/doctor/patients', label: 'Patients', icon: '👥' },
  { to: '/doctor/appointments', label: 'Appointments', icon: '📅' },
  { to: '/doctor/prescriptions', label: 'Prescriptions', icon: '💊' },
  { to: '/doctor/safety-alerts', label: 'Safety Alerts', icon: '⚠️' },
  { to: '/doctor/ai-assistant', label: 'AI Assistant', icon: '🤖' },
  { to: '/doctor/profile', label: 'Profile', icon: '👤' },
]

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [doctor, setDoctor] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const doctors = await api.get('/api/doctors')
        const me = doctors.data.find((d) => String(d.userId?._id) === String(user?._id))
        if (!me) {
          setError('Doctor profile not found. Contact admin to complete onboarding.')
          return
        }
        setDoctor(me)
        const apptRes = await api.get(`/api/doctors/${me._id}/appointments?date=${new Date().toISOString().slice(0, 10)}`)
        setAppointments(apptRes.data)
      } catch (err) {
        setError(err?.response?.data?.error?.message || 'Could not load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const stats = useMemo(() => ({
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
  }), [appointments])

  if (loading) return <Layout links={LINKS}><PageLoader /></Layout>

  return (
    <Layout links={LINKS}>
      <div className="mb-8 animate-slide-up">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Doctor Workspace</p>
        <h1 className="text-4xl font-black text-white mt-2">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-slate-300 mt-2">Manage appointments, review patient profiles, and write prescriptions faster.</p>
      </div>

      {error ? <div className="glass-card p-4 text-rose-200">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Today's Total" value={stats.total} icon="📅" color="teal" />
        <StatCard label="Confirmed" value={stats.confirmed} icon="✅" color="green" />
        <StatCard label="Pending" value={stats.pending} icon="⏳" color="amber" />
        <StatCard label="Completed" value={stats.completed} icon="🧾" color="blue" />
      </div>

      <div className="mt-6 glass-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold">Today&apos;s appointments</h2>
          <span className="text-slate-300 text-sm">{format(new Date(), 'EEEE, MMM d')}</span>
        </div>
        {appointments.length === 0 ? (
          <Empty icon="🩺" title="No appointments today" desc="You are all clear for now." />
        ) : (
          <div className="space-y-3">
            {appointments
              .slice()
              .sort((a, b) => String(a.timeSlot).localeCompare(String(b.timeSlot)))
              .map((appt, index) => (
                <button
                  key={appt._id}
                  style={{ animationDelay: `${index * 70}ms` }}
                  onClick={() => navigate(`/doctor/patient/${appt.patientId?._id || appt.patientId}`)}
                  className="w-full glass-card p-4 text-left hover-lift animate-slide-up"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-cyan-200 font-bold w-16">{appt.timeSlot}</div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{appt.patientId?.userId?.name || 'Patient'}</p>
                      <p className="text-slate-300 text-sm">{appt.chiefComplaint || 'General consultation'}</p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    </Layout>
  )
}