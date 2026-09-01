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
      <div className="min-h-screen bg-gradient-to-br from-[#f4fbf6] via-[#fafbf9] to-[#e5f5ea] -mx-4 -my-4 md:-mx-8 md:-my-8 px-4 py-8 md:px-8 md:py-12">
        {/* Header */}
        <div className="mx-auto max-w-7xl mb-12">
          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-white/70 to-emerald-50/70 backdrop-blur-sm p-8 shadow-[0_18px_50px_rgba(27,98,52,0.08)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">📋 Records studio</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-emerald-950">Upload clinical report</h1>
            <p className="mt-2 text-base text-emerald-900/70">Securely attach patient reports in one seamless workflow</p>
            
            {/* Step Indicator */}
            <div className="mt-6 flex items-center gap-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white transition ${ form.patientId ? 'bg-emerald-600' : 'bg-emerald-400' }`}>1</div>
              <div className={`flex-1 h-1 rounded-full transition ${ form.patientId ? 'bg-emerald-400' : 'bg-emerald-200' }`} />
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white transition ${ form.title && form.type && form.date ? 'bg-emerald-600' : 'bg-emerald-400' }`}>2</div>
              <div className={`flex-1 h-1 rounded-full transition ${ form.title && form.type && form.date && form.file ? 'bg-emerald-400' : 'bg-emerald-200' }`} />
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white transition ${ form.file ? 'bg-emerald-600' : 'bg-emerald-400' }`}>3</div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main Grid Layout - Horizontal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Step 1: Patient Selection - Left Column */}
              <div className="rounded-3xl border border-emerald-100 bg-white/80 backdrop-blur-sm p-8 shadow-[0_12px_40px_rgba(27,98,52,0.07)] h-fit lg:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-bold">1</div>
                  <h2 className="text-lg font-bold text-emerald-950">Select patient</h2>
                </div>
                
                <input 
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm placeholder:text-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 mb-4" 
                  placeholder="🔍 Search patient..."
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
                
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {filtered.length > 0 ? (
                    filtered.slice(0, 20).map(p => (
                      <div key={p._id}
                        onClick={() => setForm(f => ({ ...f, patientId: p._id }))}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border ${
                          form.patientId === p._id ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 border-emerald-600 text-white shadow-lg' : 'bg-white border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200'
                        }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          form.patientId === p._id ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {p.userId?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${form.patientId === p._id ? 'text-white' : 'text-gray-900'}`}>
                            {p.userId?.name}
                          </p>
                          <p className={`text-xs truncate ${form.patientId === p._id ? 'text-emerald-100' : 'text-gray-600'}`}>
                            {p.userId?.email}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-emerald-600 text-sm">📭 No patients found</div>
                  )}
                </div>
                
                {form.patientId && (
                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-700">✓ Patient selected</p>
                  </div>
                )}
              </div>

              {/* Step 2 & 3: Report Details and File - Middle & Right Columns */}
              <div className="rounded-3xl border border-emerald-100 bg-white/80 backdrop-blur-sm p-8 shadow-[0_12px_40px_rgba(27,98,52,0.07)] lg:col-span-2">
                
                {/* Step 2: Report Details */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-bold">2</div>
                    <h2 className="text-lg font-bold text-emerald-950">Report details</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-semibold text-emerald-950 mb-2">Title *</label>
                      <input 
                        className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm placeholder:text-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" 
                        placeholder="e.g. Blood Test"
                        value={form.title} 
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-emerald-950 mb-2">Date *</label>
                      <input 
                        type="date" 
                        className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={form.date} 
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))} 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-emerald-950 mb-2">Type *</label>
                      <select 
                        className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" 
                        value={form.type}
                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                        {REPORT_TYPES.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-emerald-100 pt-8">
                  {/* Step 3: File Upload */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-bold">3</div>
                    <h2 className="text-lg font-bold text-emerald-950">Attach PDF *</h2>
                  </div>
                  
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
                    onClick={() => document.getElementById('file-input').click()}
                    className={`border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      dragOver ? 'border-emerald-500 bg-emerald-100' : 'border-emerald-300 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100/50'
                    }`}>
                    {form.file
                      ? <div className="flex flex-col items-center justify-center gap-2">
                          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                            <span className="text-2xl">✓</span>
                          </div>
                          <span className="text-sm font-bold text-emerald-900">{form.file.name}</span>
                          <span className="text-xs text-emerald-700">{(form.file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      : <div>
                          <p className="text-4xl mb-3">📄</p>
                          <p className="font-bold text-emerald-950">Drop PDF here</p>
                          <p className="text-sm text-emerald-700 mt-1">or click to browse</p>
                        </div>
                    }
                    <input id="file-input" type="file" accept=".pdf" className="hidden"
                      onChange={e => handleFile(e.target.files[0])} />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            {form.patientId && form.title && form.type && form.file && (
              <div className="rounded-3xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-lg">✨</div>
                    <div>
                      <h3 className="font-bold text-lg">Ready to upload</h3>
                      <p className="text-sm text-emerald-100">All required fields completed</p>
                    </div>
                  </div>
                  <div className="text-4xl">🎯</div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-emerald-500/30 border-b">
                  <div>
                    <p className="text-xs text-emerald-100">Patient</p>
                    <p className="font-bold truncate">{selectedPatient?.userId?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-100">Title</p>
                    <p className="font-bold truncate">{form.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-100">Type</p>
                    <p className="font-bold capitalize">{form.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-100">File</p>
                    <p className="font-bold truncate text-sm">{form.file?.name?.split('.')[0]}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !form.patientId || !form.title || !form.file}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-300 disabled:to-gray-300 text-white px-6 py-4 font-bold text-base transition shadow-lg"
              >
                {loading ? '⏳ Uploading...' : '🚀 Upload Report'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/reception/dashboard')}
                className="rounded-xl border-2 border-emerald-300 hover:bg-emerald-50 text-emerald-950 px-6 py-4 font-semibold transition"
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
