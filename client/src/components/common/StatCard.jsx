import React from 'react'

export default function StatCard({ label, value, icon, color = 'green' }) {
  const colors = {
    green:  'from-emerald-400/30 to-teal-400/20',
    blue:   'from-blue-400/30 to-indigo-400/20',
    amber:  'from-amber-400/30 to-yellow-400/20',
    red:    'from-red-400/30 to-pink-400/20',
    purple: 'from-purple-400/30 to-fuchsia-400/20',
  }
  return (
    <div className="card flex items-center gap-4 hover-lift">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br border border-white/20 flex items-center justify-center text-xl flex-shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-white">{value ?? '—'}</p>
        <p className="text-sm text-slate-300 mt-0.5">{label}</p>
      </div>
    </div>
  )
}
