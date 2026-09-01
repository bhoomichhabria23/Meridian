import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Empty, PageLoader } from '../../components/common/UI'
import { Search, Plus } from 'lucide-react'

const LINKS = [
  { to: '/reception/dashboard', label: 'Dashboard', icon: '🏥' },
  { to: '/reception/patients', label: 'Patients', icon: '👥' },
  { to: '/reception/appointments', label: 'Appointments', icon: '📅' },
  { to: '/reception/doctors', label: 'Doctors', icon: '👨‍⚕️' },
  { to: '/reception/schedule', label: 'Schedule', icon: '📆' },
  { to: '/reception/profile', label: 'Profile', icon: '👤' },
]

export default function ReceptionPatients() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/patients')
        setPatients(res.data)
        setFilteredPatients(res.data)
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load patients')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = patients.filter(
        (p) =>
          p.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.userId?.phone?.includes(searchTerm)
      )
      setFilteredPatients(filtered)
    } else {
      setFilteredPatients(patients)
    }
  }, [searchTerm, patients])

  if (loading) return <Layout links={LINKS}><PageLoader /></Layout>

  return (
    <Layout links={LINKS}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Patients</h1>
            <p className="text-slate-600">Manage patient records and information</p>
          </div>
          <button
            onClick={() => navigate('/reception/patients/new')}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Add Patient
          </button>
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
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Patients Table */}
        {filteredPatients.length > 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Registration Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{patient.userId?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{patient.userId?.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{patient.userId?.phone || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/reception/patients/${patient._id}`)}
                          className="text-blue-700 hover:text-blue-800 font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/reception/patients/${patient._id}/edit`)}
                          className="text-slate-700 hover:text-slate-800 font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty message="No patients found" />
        )}
      </div>
    </Layout>
  )
}
