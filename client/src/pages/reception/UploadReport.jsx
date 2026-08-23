import React, { useState, useEffect } from 'react'
import Layout from '../../components/common/Layout'
import api from '../../api/axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const LINKS = [
  { to: '/reception/dashboard', label: 'Dashboard',        icon: '🏠' },
  { to: '/reception/book',      label: 'Book Appointment', icon: '📅' },
  { to: '/reception/upload',    label: 'Upload Report',    icon: '📤' },
]

const REPORT_TYPES = [
  ['lab', 'Laboratory'],
  ['imaging', 'Imaging / Scan'],
  ['cardiology', 'Cardiology'],
  ['pathology', 'Pathology'],
  ['radiology', 'Radiology'],
  ['other', 'Other'],
]

export default function ReceptionUpload() {
  const navigate      = useNavigate()
  const [patients, setPatients] = useState([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [form, setForm] = useState({
    patientId: '', title: '', type: 'lab', date: '', file: null
  })

  useEffect(() => {
    api.get('/api/patients').then(r => setPatients(r.data)).catch(() => toast.error('Failed to load patients'))
  }, [])

  const filtered = patients.filter(p =>
    !search || p.userId?.name?.toLowerCase().includes(search.toLowerCase())
  )

  function handleFile(file) {
    if (file && file.type === 'application/pdf') {
      setForm(f => ({ ...f, file }))
    } else {
      toast.error('Please select a PDF file')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.patientId || !form.title || !form.file) {
      return toast.error('Please fill all required fields and select a file')
    }
    setLoading(true)
    try {
      const data = new FormData()
      data.append('file',      form.file)
      data.append('patientId', form.patientId)
      data.append('title',     form.title)
      data.append('type',      form.type)
      data.append('date',      form.date || new Date().toISOString())
      await api.post('/api/reports/upload', data)
      toast.success('Report uploaded successfully!')
      navigate('/reception/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally { setLoading(false) }
  }

  const selectedPatient = patients.find(p => p._id === form.patientId)

  return (
    <Layout links={LINKS}>
      <div className="mb-8 rounded-3xl border border-emerald-100 bg-gradient-to-br from-[#f4fbf6] via-white to-[#e5f5ea] p-7 shadow-[0_18px_50px_rgba(27,98,52,0.08)]">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Records studio</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950">Upload clinical report</h1>
        <p className="mt-2 text-sm text-emerald-900/60">Securely attach a report to the right patient record.</p>
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Patient select */}
          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_12px_40px_rgba(27,98,52,0.07)]">
            <h2 className="font-semibold text-emerald-950 mb-4">Select patient</h2>
            <input className="input text-sm mb-3" placeholder="Search patient..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-2">
              {filtered.slice(0, 15).map(p => (
                <div key={p._id}
                  onClick={() => setForm(f => ({ ...f, patientId: p._id }))}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    form.patientId === p._id ? 'bg-green-600 text-white' : 'hover:bg-gray-50'
                  }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    form.patientId === p._id ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
                  }`}>
                    {p.userId?.name?.[0]}
                  </div>
                  <p className={`text-sm font-medium ${form.patientId === p._id ? 'text-white' : 'text-gray-800'}`}>
                    {p.userId?.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Report details */}
          <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_12px_40px_rgba(27,98,52,0.07)] space-y-4">
            <h2 className="font-semibold text-emerald-950">Report details</h2>

            <div>
              <label className="label">Report Title</label>
              <input className="input text-sm" placeholder="e.g. Blood Test — January 2026"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Report Type</label>
                <select className="input text-sm" value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {REPORT_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Report Date</label>
                <input type="date" className="input text-sm"
                  value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>

            {/* File drop zone */}
            <div>
              <label className="label">PDF File</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
                onClick={() => document.getElementById('file-input').click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-100 bg-emerald-50/30 hover:border-emerald-400 hover:bg-emerald-50'
                }`}>
                {form.file
                  ? <div className="flex items-center justify-center gap-2 text-green-700">
                      <span className="text-2xl">📄</span>
                      <span className="text-sm font-medium">{form.file.name}</span>
                    </div>
                  : <div>
                      <p className="text-3xl mb-2">📤</p>
                      <p className="text-sm text-gray-600 font-medium">Drop PDF here or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">PDF files only</p>
                    </div>
                }
                <input id="file-input" type="file" accept=".pdf" className="hidden"
                  onChange={e => handleFile(e.target.files[0])} />
              </div>
            </div>
          </div>

          {/* Summary */}
          {form.patientId && form.title && form.file && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="font-semibold text-green-800 mb-2">Upload Summary</h3>
              <p className="text-sm text-green-700">Patient: <strong>{selectedPatient?.userId?.name}</strong></p>
              <p className="text-sm text-green-700">Report: <strong>{form.title}</strong></p>
              <p className="text-sm text-green-700">File: <strong>{form.file?.name}</strong></p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Uploading...' : '📤 Upload Report'}
            </button>
            <button type="button" onClick={() => navigate('/reception/dashboard')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
