import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import api from '../../api/axios'
import { PageLoader } from '../../components/common/UI'
import { Search, Plus, Eye, Pencil, Trash2, X, UserRound, Mail, Phone } from 'lucide-react'
import toast from 'react-hot-toast'

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
  const [patients, setPatients] = useState([])
  const [filteredPatients, setFilteredPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [editingPatient, setEditingPatient] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/patients')
        const records = Array.isArray(res.data) ? res.data : res.data?.patients || res.data?.data?.patients || []
        setPatients(records)
        setFilteredPatients(records)
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

  const updatePatient = (field, value) => setEditingPatient((current) => ({ ...current, [field]: value }))

  const savePatient = async (event) => {
    event.preventDefault()
    try {
      setSaving(true)
      const response = await api.put(`/api/patients/${editingPatient._id}`, {
        age: editingPatient.age === '' ? undefined : Number(editingPatient.age),
        gender: editingPatient.gender,
        bloodGroup: editingPatient.bloodGroup,
        address: editingPatient.address || '',
      })
      const updated = response.data
      setPatients((current) => current.map((item) => item._id === updated._id ? { ...item, ...updated, userId: item.userId } : item))
      setEditingPatient(null)
      toast.success('Patient record updated successfully.')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to update patient record.')
    } finally {
      setSaving(false)
    }
  }

  const removePatient = async (patient) => {
    const name = patient.userId?.name || 'this patient'
    if (!window.confirm(`Delete ${name}? This removes the registered patient record.`)) return
    try {
      await api.delete(`/api/patients/${patient._id}`)
      setPatients((current) => current.filter((item) => item._id !== patient._id))
      setSelectedPatient(null)
      toast.success('Patient deleted successfully.')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to delete patient.')
    }
  }

  if (loading) return <Layout links={LINKS}><PageLoader /></Layout>

  return (
    <Layout links={LINKS}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-5 rounded-[28px] border border-[#d5ebdc] bg-gradient-to-br from-white via-white to-[#eaf7ed] p-6 shadow-[0_16px_45px_rgba(31,105,59,0.08)] md:flex-row md:items-end md:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#25854d]">Patient records</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#183a28] md:text-4xl">Registered patients</h1>
            <p className="mt-2 text-sm text-[#647b6d]">Manage verified patient records stored in Meridian.</p>
          </div>
          <button
            onClick={() => navigate('/reception/patients/new')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#25854d] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,133,77,0.2)] transition hover:bg-[#176b3d]"
          >
            <Plus className="w-5 h-5" />
            Add Patient
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-[#cfe5d5] bg-[#f1f8f3] p-4 text-sm font-medium text-[#3f6b4d]">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="rounded-2xl border border-[#dfeee3] bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-3 h-5 w-5 text-[#76a986]" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 w-full rounded-xl border border-[#dfeee3] bg-[#f8fcf9] pl-12 pr-4 text-sm text-[#183a28] outline-none focus:border-[#8ac79d]"
            />
          </div>
        </div>

        {/* Patients Table */}
        {filteredPatients.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-[#dfeee3] bg-white shadow-sm">
            <table className="w-full min-w-[780px]">
              <thead className="border-b border-[#edf3ee] bg-[#f8fcf9]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-[#789083]">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-[#789083]">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-[#789083]">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-[#789083]">Registered</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-[#789083]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient._id} className="transition hover:bg-[#fbfefb]">
                    <td className="px-6 py-5 text-sm font-bold text-[#183a28]"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf7ed] text-[#25854d]"><UserRound size={17} /></span><span>{patient.userId?.name || 'Registered patient'}<small className="mt-1 block text-xs font-normal text-[#819087]">{patient.patientCode || patient._id}</small></span></div></td>
                    <td className="px-6 py-5 text-sm text-[#62776d]">{patient.userId?.email || 'Not provided'}</td>
                    <td className="px-6 py-5 text-sm text-[#62776d]">{patient.userId?.phone || 'Not provided'}</td>
                    <td className="px-6 py-5 text-sm text-[#62776d]">
                      {patient.createdAt || patient.userId?.createdAt ? new Date(patient.createdAt || patient.userId.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not recorded'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPatient(patient)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#b9dac2] px-3 py-2 text-xs font-bold text-[#25854d] hover:bg-[#f1f8f3]"
                        >
                          <Eye size={14} /> View
                        </button>
                        <button
                          onClick={() => setEditingPatient({ ...patient, age: patient.age ?? '', address: patient.address || '' })}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfeee3] px-3 py-2 text-xs font-bold text-[#527261] hover:bg-[#f1f8f3]"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button type="button" onClick={() => removePatient(patient)} title="Delete patient" className="rounded-lg p-2 text-[#789083] hover:bg-[#f1f8f3] hover:text-[#527261]"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#cfe5d5] bg-white p-12 text-center shadow-sm"><UserRound className="mx-auto h-12 w-12 text-[#78aa86]" /><h2 className="mt-4 text-xl font-black text-[#183a28]">No registered patients found</h2><p className="mt-2 text-sm text-[#71857a]">Only patient records stored in Meridian appear here.</p></div>
        )}

        {selectedPatient && <PatientView patient={selectedPatient} onClose={() => setSelectedPatient(null)} />}
        {editingPatient && <PatientEdit patient={editingPatient} saving={saving} onChange={updatePatient} onClose={() => setEditingPatient(null)} onSubmit={savePatient} />}
      </div>
    </Layout>
  )
}

function PatientView({ patient, onClose }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#173a28]/35 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between border-b border-[#edf3ee] pb-5"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#25854d]">Patient profile</p><h2 className="mt-2 text-2xl font-black text-[#183a28]">{patient.userId?.name || 'Registered patient'}</h2></div><button type="button" onClick={onClose} className="rounded-xl bg-[#f1f8f3] p-2 text-[#25854d]"><X size={17} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Info icon={Mail} label="Email" value={patient.userId?.email} /><Info icon={Phone} label="Phone" value={patient.userId?.phone} /><Info icon={UserRound} label="Patient code" value={patient.patientCode} /><Info icon={UserRound} label="Age" value={patient.age ? `${patient.age} years` : 'Not recorded'} /><Info icon={UserRound} label="Gender" value={patient.gender} /><Info icon={UserRound} label="Blood group" value={patient.bloodGroup} /></div><div className="mt-5 rounded-xl bg-[#f7fbf8] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#789083]">Address</p><p className="mt-1 text-sm text-[#315343]">{patient.address || 'Not recorded'}</p></div><button type="button" onClick={onClose} className="mt-6 w-full rounded-xl bg-[#25854d] px-4 py-3 text-sm font-bold text-white">Close</button></div></div>
}

function PatientEdit({ patient, saving, onChange, onClose, onSubmit }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#173a28]/35 p-4"><form onSubmit={onSubmit} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between border-b border-[#edf3ee] pb-5"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#25854d]">Patient record</p><h2 className="mt-2 text-2xl font-black text-[#183a28]">Edit details</h2></div><button type="button" onClick={onClose} className="rounded-xl bg-[#f1f8f3] p-2 text-[#25854d]"><X size={17} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-[#527261]">Age<input type="number" min="0" value={patient.age} onChange={(event) => onChange('age', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#dfeee3] px-3 text-sm outline-none focus:border-[#8ac79d]" /></label><label className="text-xs font-bold text-[#527261]">Gender<select value={patient.gender || ''} onChange={(event) => onChange('gender', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#dfeee3] px-3 text-sm outline-none focus:border-[#8ac79d]"><option value="">Not specified</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer_not">Prefer not to say</option></select></label><label className="text-xs font-bold text-[#527261]">Blood group<select value={patient.bloodGroup || 'unknown'} onChange={(event) => onChange('bloodGroup', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#dfeee3] px-3 text-sm outline-none focus:border-[#8ac79d]"><option value="unknown">Unknown</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option></select></label><label className="text-xs font-bold text-[#527261] sm:col-span-2">Address<input value={patient.address || ''} onChange={(event) => onChange('address', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#dfeee3] px-3 text-sm outline-none focus:border-[#8ac79d]" /></label></div><div className="mt-6 flex gap-3"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-[#cfe5d5] px-4 py-3 text-sm font-bold text-[#527261]">Cancel</button><button type="submit" disabled={saving} className="flex-1 rounded-xl bg-[#25854d] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button></div></form></div>
}

function Info({ icon: Icon, label, value }) { return <div className="rounded-xl border border-[#edf3ee] bg-[#f8fcf9] p-4"><div className="flex items-center gap-2 text-[#789083]"><Icon size={15} className="text-[#25854d]" /><p className="text-xs font-bold uppercase tracking-wide">{label}</p></div><p className="mt-2 text-sm font-bold text-[#315343]">{value || 'Not recorded'}</p></div> }
