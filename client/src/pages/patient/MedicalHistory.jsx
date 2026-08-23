import React, { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import { PageSpinner } from '../../components/common/Spinner'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const LINKS = [
  { to: '/patient/dashboard', label: 'Dashboard',       icon: '🏠' },
  { to: '/patient/history',   label: 'Medical History', icon: '📋' },
  { to: '/patient/medications', label: 'Medication',    icon: '💊' },
  { to: '/patient/prescriptions', label: 'Prescription', icon: '📝' },
  { to: '/patient/reports',   label: 'Reports',         icon: '📄' },
]

const TYPE_STYLE = {
  prescription: { bg: 'bg-blue-50',   dot: 'bg-blue-400',   icon: '💊' },
  report:       { bg: 'bg-green-50',  dot: 'bg-green-500',  icon: '📄' },
  appointment:  { bg: 'bg-purple-50', dot: 'bg-purple-400', icon: '📅' },
  diagnosis:    { bg: 'bg-amber-50',  dot: 'bg-amber-400',  icon: '🔬' },
  allergy:      { bg: 'bg-red-50',    dot: 'bg-red-400',    icon: '⚠️' },
  update:       { bg: 'bg-gray-50',   dot: 'bg-gray-400',   icon: '📝' },
}

export default function PatientHistory() {
  const { user }  = useAuth()
  const [patientId, setPatientId] = useState(null)
  const [timeline, setTimeline]   = useState([])
  const [filter, setFilter]       = useState('all')
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)

  useEffect(() => {
    api.get('/api/patients').then(res => {
      const me = res.data.find(p => p.userId?._id === user?._id || p.userId === user?._id)
      if (me) {
        setPatientId(me._id)
        return api.get(`/api/patients/${me._id}/timeline?page=1&limit=50`)
      }
    }).then(res => {
      if (res) setTimeline(res.data)
    }).catch(() => toast.error('Unable to load medical history')).finally(() => setLoading(false))
  }, [user])

  const filtered = filter === 'all' ? timeline : timeline.filter(e => e.type === filter)

  if (loading) return <Layout links={LINKS}><PageSpinner /></Layout>

  return (
    <Layout links={LINKS}>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-light text-gray-900">Medical History</h1>
        <p className="text-gray-500 mt-1 text-sm">Your complete health timeline</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all','appointment','prescription','report','diagnosis','allergy'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${
              filter === f ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300'
            }`}
          >
            {f === 'all' ? 'All events' : f}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-green-100" />
        <div className="space-y-4">
          {filtered.length === 0
            ? <div className="card text-center text-gray-400 py-12">No events found</div>
            : filtered.map(event => {
                const style = TYPE_STYLE[event.type] || TYPE_STYLE.update
                return (
                  <div key={event._id} className="flex gap-4 animate-slide-up">
                    <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center text-base flex-shrink-0 z-10`}>
                      {style.icon}
                    </div>
                    <div className="card flex-1 py-4 px-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{event.title}</p>
                          {event.description && <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>}
                        </div>
                        <span className="text-xs text-gray-400 ml-4 flex-shrink-0">
                          {format(new Date(event.date), 'dd MMM yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>
    </Layout>
  )
}
