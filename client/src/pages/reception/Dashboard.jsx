import React, { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import StatCard from '../../components/common/StatCard'
import { PageSpinner } from '../../components/common/Spinner'
import api from '../../api/axios'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const LINKS = [
  { to: '/reception/dashboard', label: 'Dashboard',     icon: '🏠' },
  { to: '/reception/book',      label: 'Book Appointment', icon: '📅' },
  { to: '/reception/upload',    label: 'Upload Report', icon: '📤' },
]

const STATUS_BADGE = {
  confirmed: 'badge-green',
  pending:   'badge-yellow',
  completed: 'badge-gray',
  cancelled: 'badge-red',
}

export default function ReceptionDashboard() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [search, setSearch]             = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    api.get('/api/patients')
      .then(async (pRes) => {
        const allAppts = []
        for (const doc of (await api.get('/api/doctors')).data) {
          const res = await api.get(`/api/doctors/${doc._id}/appointments?date=${today}`)
          allAppts.push(...res.data)
        }
        setAppointments(allAppts)
      })
      .catch(() => toast.error('Failed to load reception dashboard'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    const t = setTimeout(() => {
      api.get(`/api/patients?search=${search}`)
        .then(r => setSearchResults(r.data)).catch(() => {})
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  if (loading) return <Layout links={LINKS}><PageSpinner /></Layout>

  const confirmed  = appointments.filter(a => a.status === 'confirmed').length
  const pending    = appointments.filter(a => a.status === 'pending').length

  return (
    <Layout links={LINKS}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-light text-gray-900">Reception</h1>
          <p className="text-gray-500 mt-1 text-sm">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/reception/book')} className="btn-primary">📅 Book Appointment</button>
          <button onClick={() => navigate('/reception/upload')} className="btn-secondary">📤 Upload Report</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Today's Total"  value={appointments.length} icon="📋" color="green" />
        <StatCard label="Confirmed"      value={confirmed}           icon="✅" color="blue"  />
        <StatCard label="Pending"        value={pending}             icon="⏳" color="amber" />
        <StatCard label="Cancelled"      value={appointments.filter(a=>a.status==='cancelled').length} icon="❌" color="red" />
      </div>

      {/* Patient search */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Patient Lookup</h2>
        <div className="relative">
          <input className="input pl-9 text-sm" placeholder="Search by name..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2 border border-gray-100 rounded-xl overflow-hidden">
            {searchResults.map(p => (
              <div key={p._id} className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold flex-shrink-0">
                  {p.userId?.name?.[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{p.userId?.name}</p>
                  <p className="text-xs text-gray-400">{p.bloodGroup} · {p.gender}</p>
                </div>
                <button onClick={() => navigate(`/reception/book?patientId=${p._id}`)} className="btn-primary text-xs py-1.5 px-3">
                  Book
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's appointments */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Today's Full Schedule</h2>
        {appointments.length === 0
          ? <p className="text-sm text-gray-400 py-8 text-center">No appointments for today</p>
          : <div className="space-y-2">
              {appointments.sort((a,b) => a.timeSlot?.localeCompare(b.timeSlot)).map(a => (
                <div key={a._id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50">
                  <p className="text-base font-semibold text-green-700 w-14 flex-shrink-0">{a.timeSlot}</p>
                  <div className="w-px h-8 bg-gray-200" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{a.patientId?.userId?.name || 'Patient'}</p>
                    <p className="text-xs text-gray-400">{a.chiefComplaint || 'General'}</p>
                  </div>
                  <span className={STATUS_BADGE[a.status] || 'badge-gray'}>{a.status}</span>
                </div>
              ))}
            </div>
        }
      </div>
    </Layout>
  )
}
