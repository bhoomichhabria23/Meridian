import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import { PageSpinner } from '../../components/common/Spinner'
import api from '../../api/axios'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const LINKS = [
  { to: '/doctor/dashboard', label: 'Dashboard', icon: '🏠' },
]

const TYPE_ICON = {
  prescription: '💊', report: '📄', appointment: '📅',
  diagnosis: '🔬', allergy: '⚠️', update: '📝'
}

export default function DoctorPatient() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [patient, setPatient]           = useState(null)
  const [timeline, setTimeline]         = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [reports, setReports]           = useState([])
  const [tab, setTab]                   = useState('timeline')
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/api/patients/${id}`),
      api.get(`/api/patients/${id}/timeline`),
      api.get(`/api/patients/${id}/prescriptions`),
      api.get(`/api/patients/${id}/reports`),
    ]).then(([p, t, rx, r]) => {
      setPatient(p.data)
      setTimeline(t.data)
      setPrescriptions(rx.data)
      setReports(r.data)
    }).catch(() => toast.error('Could not load patient profile')).finally(() => setLoading(false))
  }, [id])

  if (loading) return <Layout links={LINKS}><PageSpinner /></Layout>
  if (!patient) return <Layout links={LINKS}><p className="text-gray-500">Patient not found</p></Layout>

  return (
    <Layout links={LINKS}>
      {/* Back */}
      <button onClick={() => navigate('/doctor/dashboard')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-700 mb-6 transition-colors">
        ← Back to dashboard
      </button>

      {/* Patient header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700">
              {patient.userId?.name?.[0]}
            </div>
            <div>
              <h1 className="font-display text-2xl font-light text-gray-900">{patient.userId?.name}</h1>
              <p className="text-sm text-gray-500">{patient.userId?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge-green">{patient.bloodGroup}</span>
                <span className="badge-gray capitalize">{patient.gender}</span>
                {patient.dateOfBirth && (
                  <span className="badge-gray">{format(new Date(patient.dateOfBirth), 'dd MMM yyyy')}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/doctor/prescription/${id}`)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(16,128,87,0.2)] transition hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-700"
          >
            <span className="text-lg">+</span> New prescription
          </button>
        </div>

        {/* Conditions & allergies */}
        {(patient.conditions?.length > 0 || patient.allergies?.length > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4">
            {patient.conditions?.map((c, i) => (
              <span key={i} className="badge-yellow">🔬 {c.name}</span>
            ))}
            {patient.allergies?.map((a, i) => (
              <span key={i} className="badge-red">⚠️ {a}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {['timeline','prescriptions','reports'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              tab === t ? 'bg-white text-gray-800 shadow-card' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Timeline tab */}
      {tab === 'timeline' && (
        <div className="space-y-3">
          {timeline.length === 0
            ? <div className="card text-center text-gray-400 py-10">No events yet</div>
            : timeline.map(e => (
                <div key={e._id} className="card flex items-start gap-4 py-4">
                  <span className="text-xl">{TYPE_ICON[e.type] || '📝'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{e.title}</p>
                    {e.description && <p className="text-xs text-gray-500 mt-0.5">{e.description}</p>}
                  </div>
                  <span className="text-xs text-gray-400">{format(new Date(e.date), 'dd MMM yyyy')}</span>
                </div>
              ))
          }
        </div>
      )}

      {/* Prescriptions tab */}
      {tab === 'prescriptions' && (
        <div className="space-y-3">
          {prescriptions.length === 0
            ? <div className="card text-center text-gray-400 py-10">No prescriptions yet</div>
            : prescriptions.map(rx => (
                <div key={rx._id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">{rx.diagnosis || 'General'}</p>
                      <p className="text-xs text-gray-400">{format(new Date(rx.createdAt), 'dd MMM yyyy')}</p>
                    </div>
                    {rx.validUntil && (
                      <span className="badge-yellow text-xs">Until {format(new Date(rx.validUntil), 'dd MMM')}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {rx.medications?.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-green-500">•</span>
                        <span className="font-medium">{m.name}</span>
                        <span className="text-gray-400">{m.dose} · {m.frequency} · {m.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {/* Reports tab */}
      {tab === 'reports' && (
        <div className="grid grid-cols-2 gap-4">
          {reports.length === 0
            ? <div className="card col-span-2 text-center text-gray-400 py-10">No reports uploaded</div>
            : reports.map(r => (
                <div key={r._id} className="card hover:shadow-soft transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.title}</p>
                      <p className="text-xs text-gray-400 capitalize">{r.type?.replace('_',' ')}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">{format(new Date(r.uploadedAt), 'dd MMM yyyy')}</p>
                </div>
              ))
          }
        </div>
      )}
    </Layout>
  )
}
