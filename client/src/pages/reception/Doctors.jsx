import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import api from '../../api/axios'
import { Empty, PageLoader } from '../../components/common/UI'
import { Search, Stethoscope, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const LINKS = [
  { to: '/reception/dashboard', label: 'Dashboard', icon: '🏥' },
  { to: '/reception/patients', label: 'Patients', icon: '👥' },
  { to: '/reception/appointments', label: 'Appointments', icon: '📅' },
  { to: '/reception/doctors', label: 'Doctors', icon: '👨‍⚕️' },
  { to: '/reception/schedule', label: 'Schedule', icon: '📆' },
  { to: '/reception/profile', label: 'Profile', icon: '👤' },
]

export default function ReceptionDoctors() {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [filteredDoctors, setFilteredDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/doctors')
        const doctorList = Array.isArray(res.data) ? res.data : res.data?.doctors || []
        setDoctors(doctorList)
        setFilteredDoctors(doctorList)
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load doctors')
        setDoctors([])
        setFilteredDoctors([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = doctors.filter(
        (d) =>
          d.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (d.specialty || d.specialization || d.userId?.specialization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredDoctors(filtered)
    } else {
      setFilteredDoctors(doctors)
    }
  }, [searchTerm, doctors])

  const deleteDoctor = async (doctor) => {
    const name = doctor.userId?.name || doctor.name || 'this doctor'
    if (!window.confirm(`Delete ${name}? This removes the registered doctor record.`)) return
    try {
      await api.delete(`/api/doctors/${doctor._id}`)
      setDoctors((current) => current.filter((item) => item._id !== doctor._id))
      toast.success('Doctor deleted successfully.')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to delete doctor.')
    }
  }

  if (loading) return <Layout links={LINKS}><PageLoader /></Layout>

  return (
    <Layout links={LINKS}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Doctors Directory</h1>
          <p className="text-slate-600">View and manage doctor information and availability</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Doctors Grid */}
        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <div key={doctor._id} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Stethoscope className="w-6 h-6 text-white" />
                    <h3 className="text-lg font-semibold text-white">{doctor.userId?.name || doctor.name || 'Registered doctor'}</h3>
                  </div>
                  <p className="text-teal-100 text-sm">{doctor.specialty || doctor.specialization || doctor.userId?.specialization || 'General Physician'}</p>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Status */}
                  <div className="mb-4">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      ✓ Registered
                    </span>
                  </div>

                  {/* Contact */}
                  <div className="space-y-2 mb-4 text-sm">
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-700">Email:</span> {doctor.userId?.email || 'N/A'}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-700">Phone:</span> {doctor.userId?.phone || 'N/A'}
                    </p>
                  </div>

                  {/* Specialty */}
                  <div className="mb-4 bg-slate-50 rounded p-3">
                    <p className="text-center">
                        <span className="text-sm font-semibold text-slate-900">{doctor.specialty || doctor.specialization || doctor.userId?.specialization || 'General Physician'}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/reception/appointments/new?doctor=${doctor._id}`)}
                      className="flex-1 rounded-xl bg-[#25854d] py-3 text-sm font-bold text-white transition hover:bg-[#176b3d]"
                    >
                      Schedule Appointment
                    </button>
                    <button type="button" onClick={() => deleteDoctor(doctor)} title="Delete doctor" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#dfeee3] text-[#789083] transition hover:bg-[#f1f8f3] hover:text-[#527261]">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty message="No doctors found" />
        )}
      </div>
    </Layout>
  )
}
