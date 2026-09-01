import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Empty, PageLoader } from '../../components/common/UI'
import { Send, Loader2, Brain } from 'lucide-react'

const LINKS = [
  { to: '/doctor/dashboard', label: 'Dashboard', icon: '🏥' },
  { to: '/doctor/patients', label: 'Patients', icon: '👥' },
  { to: '/doctor/appointments', label: 'Appointments', icon: '📅' },
  { to: '/doctor/prescriptions', label: 'Prescriptions', icon: '💊' },
  { to: '/doctor/safety-alerts', label: 'Safety Alerts', icon: '⚠️' },
  { to: '/doctor/ai-assistant', label: 'AI Assistant', icon: '🤖' },
  { to: '/doctor/profile', label: 'Profile', icon: '👤' },
]

export default function AIAssistant() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    {
      _id: '1',
      role: 'ai',
      content: 'Hello! I\'m your AI Medical Assistant. I can help you with clinical decision support, patient information summaries, medication interactions, and more. How can I assist you today?',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage = {
      _id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages([...messages, userMessage])
    setInputValue('')
    setLoading(true)

    try {
      // Simulate API call - in real app this would call backend
      setTimeout(() => {
        const aiResponse = {
          _id: (Date.now() + 1).toString(),
          role: 'ai',
          content: generateAIResponse(inputValue),
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiResponse])
        setLoading(false)
      }, 1000)
    } catch (err) {
      setError('Failed to send message')
      setLoading(false)
    }
  }

  const generateAIResponse = (input) => {
    // Sample responses for demonstration
    const responses = [
      'Based on the patient information provided, I recommend considering the following clinical pathway...',
      'The lab results suggest elevated levels. Please consider follow-up testing or consultation with a specialist.',
      'This medication combination has no known interactions. However, monitor for common side effects.',
      'Patient\'s symptoms align with the following differential diagnoses. Consider ruling out...',
      'I\'ve analyzed the patient timeline. Key findings: consistent pattern over time, trending improvement/worsening.'
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const QuickActions = [
    { label: 'Drug Interactions', icon: '💊' },
    { label: 'Clinical Guidelines', icon: '📚' },
    { label: 'Patient Summary', icon: '👤' },
    { label: 'Lab Interpretation', icon: '🧪' }
  ]

  return (
    <Layout links={LINKS}>
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-6 h-6 text-green-700" />
            <h1 className="text-3xl font-bold text-slate-900">AI Medical Assistant</h1>
          </div>
          <p className="text-slate-600">Get instant clinical support and decision assistance</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto mb-4 bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md lg:max-w-2xl rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-green-700 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <span className={`text-xs mt-2 block ${
                  msg.role === 'user' ? 'opacity-70' : 'text-slate-500'
                }`}>
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-900 rounded-lg p-4 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-600 mb-2">Quick actions:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {QuickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputValue(action.label)}
                  className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-sm font-medium text-slate-700"
                >
                  <span>{action.icon}</span> {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me about medications, diagnoses, lab results, or clinical guidelines..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !inputValue.trim()}
              className="bg-green-700 hover:bg-green-800 text-white p-2 rounded-lg transition disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
