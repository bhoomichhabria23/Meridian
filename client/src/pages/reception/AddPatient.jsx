import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft, User, Mail, Phone, Calendar, AlertCircle } from 'lucide-react'
import api from '../../api/axios'
import Layout from '../../components/common/Layout'

const LINKS = [
  { label: 'Dashboard', to: '/reception/dashboard', icon: 'Home' },
  { label: 'Appointments', to: '/reception/appointments', icon: 'Calendar' },
  { label: 'Patients', to: '/reception/patients', icon: 'Users' },
  { label: 'Doctors', to: '/reception/doctors', icon: 'Stethoscope' },
  { label: 'Schedule', to: '/reception/schedule', icon: 'Clock' },
  { label: 'Upload Reports', to: '/reception/upload-report', icon: 'Upload' }
]

export default function AddPatient() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Male',
    medicalHistory: ''
  })

  const validateForm = () => {
    if (!form.name.trim()) {
      setError('Patient name is required')
      return false
    }
    if (!form.email.trim()) {
      setError('Email address is required')
      return false
    }
    if (!form.email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }
    if (!form.phone.trim()) {
      setError('Phone number is required')
      return false
    }
    if (!form.dateOfBirth) {
      setError('Date of birth is required')
      return false
    }
    const birthDate = new Date(form.dateOfBirth)
    const today = new Date()
    if (birthDate > today) {
      setError('Date of birth cannot be in the future')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    try {
      setLoading(true)
      
      // Create patient record
      const response = await api.post('/api/patients', {
        userId: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: 'patient'
        },
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        medicalHistory: form.medicalHistory || [],
        emergencyContact: {
          name: '',
          relationship: '',
          phone: ''
        }
      })

      if (response.data) {
        toast.success('Patient added successfully!')
        navigate('/reception/patients')
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to add patient'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout links={LINKS}>
      <div className="min-h-screen bg-gradient-to-br from-[#f4fbf6] via-[#fafbf9] to-[#e5f5ea] -mx-4 -my-4 md:-mx-8 md:-my-8 px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => navigate('/reception/patients')}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-emerald-950">Add New Patient</h1>
              <p className="text-sm text-emerald-700">Register a new patient in the system</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="rounded-3xl border border-emerald-100 bg-white/80 backdrop-blur-sm p-8 shadow-[0_12px_40px_rgba(27,98,52,0.07)] space-y-5">
              <h2 className="text-lg font-bold text-emerald-950">Personal Information</h2>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-emerald-950 mb-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm placeholder:text-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-emerald-950 mb-2">
                    <Mail className="w-4 h-4" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm placeholder:text-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-emerald-950 mb-2">
                    <Phone className="w-4 h-4" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm placeholder:text-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-emerald-950 mb-2">
                    <Calendar className="w-4 h-4" />
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-emerald-950 mb-2">Gender</label>
                  <select
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="rounded-3xl border border-emerald-100 bg-white/80 backdrop-blur-sm p-8 shadow-[0_12px_40px_rgba(27,98,52,0.07)] space-y-5">
              <h2 className="text-lg font-bold text-emerald-950">Medical Information</h2>

              <div>
                <label className="block text-sm font-semibold text-emerald-950 mb-2">Medical History</label>
                <textarea
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm placeholder:text-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                  placeholder="Enter any relevant medical conditions, allergies, medications, or previous treatments..."
                  rows="4"
                  value={form.medicalHistory}
                  onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-300 disabled:to-gray-300 text-white px-6 py-4 font-bold text-base transition"
              >
                {loading ? '⏳ Creating Patient...' : '✓ Add Patient'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/reception/patients')}
                className="rounded-xl border border-emerald-300 hover:bg-emerald-50 text-emerald-950 px-6 py-4 font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
