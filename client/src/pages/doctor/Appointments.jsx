import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import Layout from '../../components/common/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Empty, PageLoader, StatusBadge } from '../../components/common/UI'
import { Calendar, Clock, User } from 'lucide-react'

const LINKS = [
  { to: '/doctor/dashboard', label: 'Dashboard', icon: '🏥' },
  { to: '/doctor/patients', label: 'Patients', icon: '👥' },
  { to: '/doctor/appointments', label: 'Appointments', icon: '📅' },
  { to: '/doctor/prescriptions', label: 'Prescriptions', icon: '💊' },
  { to: '/doctor/safety-alerts', label: 'Safety Alerts', icon: '⚠️' },
  { to: '/doctor/ai-assistant', label: 'AI Assistant', icon: '🤖' },
  { to: '/doctor/profile', label: 'Profile', icon: '👤' },
]

export default function DoctorAppointments() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/appointments')
        setAppointments(res.data)
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load appointments')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredAppointments = selectedStatus === 'all'
    ? appointments
    : appointments.filter(a => a.status === selectedStatus)

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  if (loading) return <Layout links={LINKS}><PageLoader /></Layout>

  return (
    <Layout links={LINKS}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Appointments</h1>
          <p className="text-slate-600">Manage your schedule and patient appointments</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-2">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedStatus === status
                  ? 'bg-green-700 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((apt) => (
              <div key={apt._id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-slate-600" />
                      <h3 className="text-lg font-semibold text-slate-900">{apt.patientId?.name || 'Unknown Patient'}</h3>
                    </div>
                    <div className="flex gap-6 text-sm text-slate-600 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {apt.appointmentDate ? format(new Date(apt.appointmentDate), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {apt.timeSlot || 'Not specified'}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">Reason: {apt.reason || 'General checkup'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                      {apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1)}
                    </span>
                    <button
                      onClick={() => navigate(`/doctor/patients/${apt.patientId?._id}`)}
                      className="text-green-700 hover:text-green-800 font-medium text-sm"
                    >
                      View Patient
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty message={`No ${selectedStatus === 'all' ? '' : selectedStatus} appointments found`} />
        )}
      </div>
    </Layout>
  )
}
