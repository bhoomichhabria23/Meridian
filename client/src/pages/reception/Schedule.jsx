import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, startOfWeek, addDays } from 'date-fns'
import Layout from '../../components/common/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Empty, PageLoader } from '../../components/common/UI'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'

const LINKS = [
  { to: '/reception/dashboard', label: 'Dashboard', icon: '🏥' },
  { to: '/reception/patients', label: 'Patients', icon: '👥' },
  { to: '/reception/appointments', label: 'Appointments', icon: '📅' },
  { to: '/reception/doctors', label: 'Doctors', icon: '👨‍⚕️' },
  { to: '/reception/schedule', label: 'Schedule', icon: '📆' },
  { to: '/reception/profile', label: 'Profile', icon: '👤' },
]

export default function ReceptionSchedule() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/appointments')
        setAppointments(Array.isArray(res.data) ? res.data : res.data?.appointments || [])
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load appointments')
        setAppointments([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const weekStart = startOfWeek(currentDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getAppointmentsForDay = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date || apt.appointmentDate)
      return (
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate()
      )
    })
  }

  const getDisplayTime = (apt) => {
    return apt.timeSlot || (apt.time ? format(new Date(`2000-01-01 ${apt.time}`), 'HH:mm') : '00:00')
  }

  const getPatientName = (patient) => {
    return patient?.userId?.name || patient?.name || 'Unknown Patient'
  }

  const getDoctorName = (doctor) => {
    return doctor?.userId?.name || doctor?.name || 'Unknown Doctor'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'rescheduled':
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
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Weekly Schedule</h1>
              <p className="text-slate-600">View clinic appointments for the week</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentDate(addDays(currentDate, -7))}
                className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(addDays(currentDate, 7))}
                className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-slate-600">
            Week of {format(weekStart, 'MMMM d, yyyy')} - {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Weekly Schedule */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date, idx) => {
            const dayAppointments = getAppointmentsForDay(date)
            const isToday = date.toDateString() === new Date().toDateString()

            return (
              <div
                key={idx}
                className={`border rounded-lg overflow-hidden ${
                  isToday
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {/* Day Header */}
                <div className={`p-3 text-center border-b ${
                  isToday
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-slate-100 border-slate-200'
                }`}>
                  <p className="text-xs font-semibold text-slate-600">
                    {format(date, 'EEE')}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? 'text-blue-700' : 'text-slate-900'}`}>
                    {format(date, 'd')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {dayAppointments.length} appointments
                  </p>
                </div>

                {/* Appointments */}
                <div className="p-2 space-y-1 min-h-32">
                  {dayAppointments.length > 0 ? (
                    dayAppointments.map(apt => (
                      <div
                        key={apt._id}
                        className={`p-2 rounded text-xs cursor-pointer hover:shadow-md transition ${getStatusColor(apt.status)}`}
                        onClick={() => navigate(`/reception/appointments`)}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">{getDisplayTime(apt)}</span>
                        </div>
                        <p className="font-semibold truncate">{getPatientName(apt.patientId)}</p>
                        <p className="truncate opacity-75">{getDoctorName(apt.doctorId)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-8">No appointments</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Appointments Summary */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Appointments</h2>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Date & Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Patient</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Doctor</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {appointments.slice(0, 10).map((apt) => (
                  <tr key={apt._id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {format(new Date(apt.date || apt.appointmentDate), 'MMM dd, yyyy')} at {getDisplayTime(apt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{getPatientName(apt.patientId)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{getDoctorName(apt.doctorId)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                        {apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
