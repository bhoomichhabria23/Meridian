import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Empty, PageLoader } from '../../components/common/UI'
import { Edit2, Save, X, Mail, Phone, MapPin, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'

const LINKS = [
  { to: '/reception/dashboard', label: 'Dashboard', icon: '🏥' },
  { to: '/reception/patients', label: 'Patients', icon: '👥' },
  { to: '/reception/appointments', label: 'Appointments', icon: '📅' },
  { to: '/reception/doctors', label: 'Doctors', icon: '👨‍⚕️' },
  { to: '/reception/schedule', label: 'Schedule', icon: '📆' },
  { to: '/reception/profile', label: 'Profile', icon: '👤' },
]

export default function ReceptionProfile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    position: 'Receptionist',
    department: 'Front Desk',
    employeeId: '',
    startDate: '',
    bio: ''
  })
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // In real app, fetch receptionist profile from backend
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
          <p className="text-slate-600">Manage your personal information</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{profile.name}</h2>
                <p className="text-blue-100">{profile.position} • {profile.department}</p>
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
                  <select
                    name="position"
                    value={profile.position}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Receptionist</option>
                    <option>Senior Receptionist</option>
                    <option>Clinic Manager</option>
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={profile.department}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Employee ID */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={profile.employeeId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={profile.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Save Button */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
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
                      <Briefcase className="w-4 h-4" />
                      <span className="text-sm font-medium">Position</span>
                    </div>
                    <p className="text-slate-900">{profile.position}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <span className="text-sm font-medium">Department</span>
                    </div>
                    <p className="text-slate-900">{profile.department}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <span className="text-sm font-medium">Employee ID</span>
                    </div>
                    <p className="text-slate-900">{profile.employeeId || 'Not provided'}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <span className="text-sm font-medium">Start Date</span>
                    </div>
                    <p className="text-slate-900">
                      {profile.startDate ? new Date(profile.startDate).toLocaleDateString() : 'Not provided'}
                    </p>
                  </div>
                </div>

                {profile.bio && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Bio</h3>
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
