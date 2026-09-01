import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Empty, PageLoader } from '../../components/common/UI'
import { AlertTriangle, Clock, User } from 'lucide-react'

const LINKS = [
  { to: '/doctor/dashboard', label: 'Dashboard', icon: '🏥' },
  { to: '/doctor/patients', label: 'Patients', icon: '👥' },
  { to: '/doctor/appointments', label: 'Appointments', icon: '📅' },
  { to: '/doctor/prescriptions', label: 'Prescriptions', icon: '💊' },
  { to: '/doctor/safety-alerts', label: 'Safety Alerts', icon: '⚠️' },
  { to: '/doctor/ai-assistant', label: 'AI Assistant', icon: '🤖' },
  { to: '/doctor/profile', label: 'Profile', icon: '👤' },
]

export default function SafetyAlerts() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([
    {
      _id: '1',
      type: 'drug_interaction',
      severity: 'high',
      patient: 'John Doe',
      patientId: 'p1',
      message: 'Potential drug interaction detected',
      details: 'Patient is taking Warfarin and Aspirin together. Please review prescription.',
      timestamp: new Date(),
      resolved: false
    },
    {
      _id: '2',
      type: 'allergy_warning',
      severity: 'critical',
      patient: 'Jane Smith',
      patientId: 'p2',
      message: 'Allergy alert',
      details: 'Patient has documented allergy to Penicillin. Recent prescription contains similar antibiotic.',
      timestamp: new Date(),
      resolved: false
    },
    {
      _id: '3',
      type: 'lab_abnormal',
      severity: 'medium',
      patient: 'Bob Johnson',
      patientId: 'p3',
      message: 'Abnormal lab results',
      details: 'Blood glucose level significantly elevated. Consider follow-up testing.',
      timestamp: new Date(),
      resolved: false
    }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResolved, setShowResolved] = useState(false)

  const activeAlerts = alerts.filter(a => !a.resolved)
  const resolvedAlerts = alerts.filter(a => a.resolved)
  const displayAlerts = showResolved ? resolvedAlerts : activeAlerts

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800'
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      default:
        return 'bg-slate-100 border-slate-300 text-slate-800'
    }
  }

  const handleResolveAlert = (alertId) => {
    setAlerts(alerts.map(a => 
      a._id === alertId ? { ...a, resolved: true } : a
    ))
  }

  if (loading) return <Layout links={LINKS}><PageLoader /></Layout>

  return (
    <Layout links={LINKS}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Safety Alerts</h1>
          <p className="text-slate-600">Monitor critical patient safety notifications</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Alert Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Critical Alerts</p>
            <p className="text-2xl font-bold text-red-900">{alerts.filter(a => a.severity === 'critical' && !a.resolved).length}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">High Priority</p>
            <p className="text-2xl font-bold text-orange-900">{alerts.filter(a => a.severity === 'high' && !a.resolved).length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Resolved</p>
            <p className="text-2xl font-bold text-green-900">{resolvedAlerts.length}</p>
          </div>
        </div>

        {/* Toggle Button */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setShowResolved(false)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              !showResolved
                ? 'bg-red-700 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Active Alerts ({activeAlerts.length})
          </button>
          <button
            onClick={() => setShowResolved(true)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              showResolved
                ? 'bg-green-700 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Resolved ({resolvedAlerts.length})
          </button>
        </div>

        {/* Alerts List */}
        {displayAlerts.length > 0 ? (
          <div className="space-y-4">
            {displayAlerts.map((alert) => (
              <div
                key={alert._id}
                className={`border-l-4 rounded-lg p-6 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-4 flex-1">
                    <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{alert.message}</h3>
                      <p className="text-sm opacity-90 mb-2">{alert.details}</p>
                      <div className="flex items-center gap-4 text-sm opacity-75">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {alert.patient}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {alert.timestamp.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/doctor/patients/${alert.patientId}`)}
                      className="px-4 py-2 bg-white bg-opacity-50 hover:bg-opacity-100 rounded font-medium text-sm transition"
                    >
                      View Patient
                    </button>
                    {!alert.resolved && (
                      <button
                        onClick={() => handleResolveAlert(alert._id)}
                        className="px-4 py-2 bg-white bg-opacity-50 hover:bg-opacity-100 rounded font-medium text-sm transition"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty message={showResolved ? 'No resolved alerts' : 'No active alerts - Great job!'} />
        )}
      </div>
    </Layout>
  )
}
