import React, { useState, useRef, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const STEPS = ['complaint','duration','doctor','slot','confirm']

const BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-']
const GENDERS      = ['male','female','other','prefer_not']

export default function ChatbotWidget({ onClose }) {
  const [step, setStep]           = useState('complaint')
  const [messages, setMessages]   = useState([
    { from: 'bot', text: "Hi! I'll help you book an appointment. What brings you here today?" }
  ])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [doctors, setDoctors]       = useState([])
  const [slots, setSlots]           = useState([])
  const [form, setForm]             = useState({
    chiefComplaint: '', symptomDuration: { value: 1, unit: 'days' },
    preferredDoctorId: '', appointmentDate: '', timeSlot: '',
    bloodGroup: '', gender: ''
  })
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    api.get('/api/doctors').then(r => setDoctors(r.data)).catch(() => {})
  }, [])

  function addMsg(from, text) {
    setMessages(m => [...m, { from, text }])
  }

  async function handleComplaint() {
    if (!input.trim()) return
    const complaint = input.trim()
    addMsg('user', complaint)
    setInput('')
    setLoading(true)
    try {
      const res = await api.post('/api/chatbot/validate-complaint', { complaint })
      if (res.data.valid) {
        setForm(f => ({ ...f, chiefComplaint: complaint }))
        addMsg('bot', "Got it. How long have you been experiencing this?")
        setStep('duration')
      } else {
        addMsg('bot', res.data.message || "Please describe a health concern so I can help you book the right appointment.")
      }
    } catch {
      addMsg('bot', "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleDuration() {
    addMsg('user', `${form.symptomDuration.value} ${form.symptomDuration.unit}`)
    addMsg('bot', "Do you have a preferred doctor or specialty? You can also skip this.")
    setStep('doctor')
  }

  function handleDoctor(doctorId, doctorName) {
    setForm(f => ({ ...f, preferredDoctorId: doctorId }))
    addMsg('user', doctorName || 'No preference')
    addMsg('bot', "Pick a date and time slot for your appointment.")
    setStep('slot')
  }

  async function handleDateChange(date) {
    setForm(f => ({ ...f, appointmentDate: date, timeSlot: '' }))
    if (!form.preferredDoctorId) return
    try {
      const res = await api.get(`/api/doctors/${form.preferredDoctorId}/slots?date=${date}`)
      setSlots(res.data.available || [])
    } catch { setSlots([]) }
  }

  function handleSlot(slot) {
    setForm(f => ({ ...f, timeSlot: slot }))
    addMsg('user', `${form.appointmentDate} at ${slot}`)
    addMsg('bot', "Almost done! Just need a couple more details.")
    setStep('confirm')
  }

  async function handleConfirm() {
    setLoading(true)
    try {
      const res = await api.post('/api/chatbot/confirm-booking', form)
      addMsg('user', 'Confirm booking')
      addMsg('bot', res.data.confirmationMessage || "Your appointment has been booked successfully!")
      setStep('done')
      toast.success('Appointment booked!')
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not book appointment'
      addMsg('bot', `Sorry — ${msg}. ${err.response?.data?.alternatives?.length ? 'Try: ' + err.response.data.alternatives.join(', ') : ''}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-end p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col animate-slide-up" style={{ height: '600px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white text-sm">✨</div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Book Appointment</p>
              <p className="text-xs text-gray-400">AI-powered booking</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.from === 'user'
                  ? 'bg-green-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-gray-100">
          {step === 'complaint' && (
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm"
                placeholder="Describe your symptoms..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComplaint()}
              />
              <button onClick={handleComplaint} className="btn-primary px-4">→</button>
            </div>
          )}

          {step === 'duration' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="number" min="1" className="input w-20 text-sm"
                  value={form.symptomDuration.value}
                  onChange={e => setForm(f => ({ ...f, symptomDuration: { ...f.symptomDuration, value: e.target.value } }))}
                />
                <select className="input flex-1 text-sm"
                  value={form.symptomDuration.unit}
                  onChange={e => setForm(f => ({ ...f, symptomDuration: { ...f.symptomDuration, unit: e.target.value } }))}>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
                <button onClick={handleDuration} className="btn-primary px-4">→</button>
              </div>
            </div>
          )}

          {step === 'doctor' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {doctors.map(d => (
                  <button key={d._id}
                    onClick={() => handleDoctor(d._id, d.userId?.name)}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 hover:border-green-400 hover:bg-green-50 text-left transition-all">
                    <p className="font-medium text-gray-700 truncate">{d.userId?.name}</p>
                    <p className="text-gray-400">{d.specialty}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => handleDoctor('', 'No preference')} className="w-full btn-secondary text-xs py-2">
                No preference
              </button>
            </div>
          )}

          {step === 'slot' && (
            <div className="space-y-2">
              <input type="date" className="input text-sm w-full"
                value={form.appointmentDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => handleDateChange(e.target.value)}
              />
              {slots.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto">
                  {slots.map(s => (
                    <button key={s}
                      onClick={() => handleSlot(s)}
                      className={`text-xs py-1.5 rounded-lg border transition-all ${
                        form.timeSlot === s ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 hover:border-green-400'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <select className="input text-sm" value={form.bloodGroup}
                  onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))}>
                  <option value="">Blood group</option>
                  {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
                <select className="input text-sm" value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                  <option value="">Gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <button onClick={handleConfirm} className="btn-primary w-full" disabled={loading}>
                {loading ? 'Booking...' : '✅ Confirm Appointment'}
              </button>
            </div>
          )}

          {step === 'done' && (
            <button onClick={onClose} className="btn-primary w-full">Close</button>
          )}
        </div>
      </div>
    </div>
  )
}
