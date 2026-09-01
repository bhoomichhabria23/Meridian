import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Empty, PageLoader } from '../../components/common/UI'
import { Edit2, Save, X, Mail, Phone, MapPin, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'

const LINKS = [
  { to: '/doctor/dashboard', label: 'Dashboard', icon: '🏥' },
  { to: '/doctor/patients', label: 'Patients', icon: '👥' },
  { to: '/doctor/appointments', label: 'Appointments', icon: '📅' },
  { to: '/doctor/prescriptions', label: 'Prescriptions', icon: '💊' },
  { to: '/doctor/safety-alerts', label: 'Safety Alerts', icon: '⚠️' },
  { to: '/doctor/ai-assistant', label: 'AI Assistant', icon: '🤖' },
  { to: '/doctor/profile', label: 'Profile', icon: '👤' },
]

export default function DoctorProfile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    specialization: 'General Physician',
    licenseNumber: '',
    yearsOfExperience: '',
    hospitalAffiliation: '',
    bio: ''
  })
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // In real app, fetch doctor profile from backend
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      // In real app, save to backend
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success('Profile updated successfully')
      setEditMode(false)
    } catch (err) {
      setError('Failed to save profile')
      toast.error('Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear()
      logout?.()
      navigate('/login')
    }
  }

  return (
    <Layout links={LINKS}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Profile</h1>
          <p className="text-slate-600">Manage your professional information</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 px-8 py-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{profile.name}</h2>
                <p className="text-green-100">{profile.specialization}</p>
              </div>
              <button
                onClick={() => setEditMode(!editMode)}
                className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition"
              >
                {editMode ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {editMode ? (
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Specialization</label>
                  <select
                    name="specialization"
                    value={profile.specialization}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option>General Physician</option>
                    <option>Cardiologist</option>
                    <option>Dermatologist</option>
                    <option>Neurologist</option>
                    <option>Pediatrician</option>
                    <option>Psychiatrist</option>
                  </select>
                </div>

                {/* License Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={profile.licenseNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Years of Experience */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    name="yearsOfExperience"
                    value={profile.yearsOfExperience}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Hospital Affiliation */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Hospital Affiliation</label>
                  <input
                    type="text"
                    name="hospitalAffiliation"
                    value={profile.hospitalAffiliation}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Professional Bio</label>
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Save Button */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-green-700 hover:bg-green-800 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 font-medium py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <p className="text-slate-900">{profile.email}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm font-medium">Phone</span>
                    </div>
                    <p className="text-slate-900">{profile.phone || 'Not provided'}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-sm font-medium">Specialization</span>
                    </div>
                    <p className="text-slate-900">{profile.specialization}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <span className="text-sm font-medium">License Number</span>
                    </div>
                    <p className="text-slate-900">{profile.licenseNumber || 'Not provided'}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <span className="text-sm font-medium">Years of Experience</span>
                    </div>
                    <p className="text-slate-900">{profile.yearsOfExperience || 'Not provided'}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">Hospital Affiliation</span>
                    </div>
                    <p className="text-slate-900">{profile.hospitalAffiliation || 'Not provided'}</p>
                  </div>
                </div>

                {profile.bio && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Professional Bio</h3>
                    <p className="text-slate-600">{profile.bio}</p>
                  </div>
                )}

                {/* Logout Button */}
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-medium py-2 rounded-lg transition"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
